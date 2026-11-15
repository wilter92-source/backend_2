import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { test } from 'node:test';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { Enrollment } from '../src/models/Enrollment.js';
import { User } from '../src/models/User.js';
import { SessionsService } from '../src/services/sessions.service.js';
import { verifyPassword } from '../src/utils/hash.js';

const registration = {
  first_name: ' Ana ',
  last_name: ' Pérez ',
  email: ' Ana@Example.com ',
  password: 'Secreta123'
};

test('el servicio valida los campos antes de consultar el repositorio', async () => {
  const service = new SessionsService({
    findByEmail: async () => assert.fail('No debe consultar la base con datos inválidos')
  });
  for (const field of Object.keys(registration)) {
    await assert.rejects(service.register({ ...registration, [field]: ' ' }), { status: 400 });
  }
  for (const body of [
    [],
    { ...registration, email: 'ana@example' },
    { ...registration, password: '1234567' },
    { ...registration, password: 'é'.repeat(37) },
    { ...registration, first_name: 22 }
  ]) {
    await assert.rejects(service.register(body), { status: 400 });
  }
});

test('duplicados detectados al guardar se traducen a estado 409', async () => {
  const service = new SessionsService({
    findByEmail: async () => null,
    create: async () => { throw Object.assign(new Error(), { code: 11000 }); }
  });
  await assert.rejects(service.register(registration), { status: 409 });
});

test('Enrollment exige usuario y evento y define un índice único compuesto', () => {
  const error = new Enrollment().validateSync();
  assert.ok(error.errors.user);
  assert.ok(error.errors.event);
  assert.ok(Enrollment.schema.indexes().some(([keys, options]) =>
    keys.event === 1 && keys.user === 1 && options.unique
  ));
});

const testMongoUrl = process.env.TEST_MONGO_URL;

test('registro por HTTP con MongoDB real', { skip: !testMongoUrl }, async (t) => {
  let server;
  let url;
  t.after(async () => {
    try {
      if (server) await new Promise((resolve) => server.close(resolve));
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.dropDatabase();
      }
    } finally {
      await disconnectDatabase();
    }
  });

  const databaseName = `escena_test_${randomUUID().replaceAll('-', '')}`;
  const database = new URL(testMongoUrl);
  database.pathname = `/${databaseName}`;
  await connectDatabase(database.href);

  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  url = `http://127.0.0.1:${server.address().port}/api/sessions/register`;

  async function register(body) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return { status: response.status, body: await response.json() };
  }

  await t.test('campos faltantes, correo inválido y contraseña corta devuelven 400', async () => {
    for (const body of [
      {},
      { ...registration, email: 'ana' },
      { ...registration, password: 'corta' }
    ]) {
      const response = await register(body);
      assert.equal(response.status, 400);
      assert.equal(response.body.status, 'error');
    }
    assert.equal(await User.countDocuments(), 0);
  });

  await t.test('201 con correo normalizado, rol user y hash persistido', async () => {
    const response = await register({ ...registration, role: 'admin' });
    assert.equal(response.status, 201);
    assert.deepEqual(response.body, {
      status: 'success',
      payload: {
        id: response.body.payload.id,
        first_name: 'Ana',
        last_name: 'Pérez',
        email: 'ana@example.com',
        role: 'user'
      }
    });
    const stored = await User.collection.findOne({ email: 'ana@example.com' });
    assert.equal(response.body.payload.id, String(stored._id));
    assert.equal(stored.role, 'user');
    assert.match(stored.password, /^\$2[aby]\$/);
    assert.notEqual(stored.password, registration.password);
    assert.ok(await verifyPassword(registration.password, stored.password));
    assert.equal((await User.findOne({ email: stored.email })).password, undefined);
  });

  await t.test('correo repetido devuelve 409 aun con otras mayúsculas y espacios', async () => {
    const response = await register({ ...registration, email: ' ANA@example.com  ' });
    assert.equal(response.status, 409);
    assert.equal(response.body.message, 'El email ya está registrado');
    assert.equal(await User.countDocuments(), 1);
  });

  await t.test('dos altas simultáneas dejan un solo usuario', async () => {
    const body = { ...registration, email: 'duplicado@example.com' };
    const responses = await Promise.all([register(body), register(body)]);
    assert.deepEqual(responses.map(({ status }) => status).sort(), [201, 409]);
    assert.equal(await User.countDocuments({ email: body.email }), 1);
  });

});
