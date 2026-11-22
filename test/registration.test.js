import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { test } from 'node:test';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
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
    create: async () => {
      throw Object.assign(new Error(), { code: 11000 });
    }
  });
  await assert.rejects(service.register(registration), { status: 409 });
});

test('Enrollment exige usuario y evento y define un índice único compuesto', () => {
  const error = new Enrollment().validateSync();
  assert.ok(error.errors.user);
  assert.ok(error.errors.event);
  assert.ok(
    Enrollment.schema
      .indexes()
      .some(([keys, options]) => keys.event === 1 && keys.user === 1 && options.unique)
  );
});

const testMongoUrl = process.env.TEST_MONGO_URL;

test('registro y autenticación por HTTP con MongoDB real', { skip: !testMongoUrl }, async (t) => {
  let server;
  const secret = randomUUID();
  process.env.JWT_SECRET = secret;
  process.env.JWT_EXPIRES_IN = '45m';
  const { default: app } = await import('../src/app.js');
  const databaseName = `escena_test_${randomUUID().replaceAll('-', '')}`;

  t.after(async () => {
    try {
      if (server) await new Promise((resolve) => server.close(resolve));
      if (mongoose.connection.readyState === 1 && mongoose.connection.name === databaseName) {
        await mongoose.connection.dropDatabase();
      }
    } finally {
      await disconnectDatabase();
    }
  });

  await connectDatabase(testMongoUrl, { dbName: databaseName });

  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}/api/sessions`;

  function post(path, body) {
    return fetch(url + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  }

  async function register(body) {
    const response = await post('/register', body);
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

  await t.test('el índice único admite solo uno de doce registros concurrentes', async () => {
    const indexes = await User.collection.indexes();
    assert.ok(indexes.some(({ key, unique }) => key.email === 1 && unique));

    const attempts = Array.from({ length: 12 }, (_, index) =>
      register({
        ...registration,
        email: index % 2 === 0 ? ' Duplicado@Example.com ' : 'duplicado@example.com'
      })
    );
    const responses = await Promise.all(attempts);
    assert.equal(responses.filter(({ status }) => status === 201).length, 1);
    const failures = responses.filter(({ status }) => status !== 201);
    assert.equal(failures.length, 11);
    for (const response of failures) {
      assert.equal(response.status, 409);
      assert.equal(response.body.message, 'El email ya está registrado');
    }
    assert.equal(await User.countDocuments({ email: 'duplicado@example.com' }), 1);
  });

  await t.test(
    'un correo desconocido y una contraseña incorrecta devuelven el mismo 401',
    async () => {
      for (const credentials of [
        { email: 'inexistente@example.com', password: registration.password },
        { email: registration.email, password: 'incorrecta123' }
      ]) {
        const response = await post('/login', credentials);
        assert.equal(response.status, 401);
        assert.equal(response.headers.has('set-cookie'), false);
        assert.deepEqual(await response.json(), {
          status: 'error',
          message: 'Credenciales inválidas'
        });
      }
    }
  );

  await t.test('login, current, rechazo de tokens inválidos y logout', async () => {
    const login = await post('/login', {
      email: registration.email,
      password: registration.password
    });
    assert.equal(login.status, 200);
    assert.deepEqual(await login.json(), { status: 'success', message: 'Login correcto' });

    const setCookie = login.headers.get('set-cookie');
    assert.match(setCookie, /^currentUser=/);
    assert.match(setCookie, /; HttpOnly/);
    assert.match(setCookie, /; SameSite=Lax/);
    assert.match(setCookie, /; Max-Age=3600/);
    assert.equal(/; Secure/.test(setCookie), process.env.NODE_ENV === 'production');

    const [cookie] = setCookie.split(';');
    const token = cookie.slice('currentUser='.length);
    const { exp, iat, ...claims } = jwt.verify(token, secret, { algorithms: ['HS256'] });
    assert.equal(exp - iat, 45 * 60);
    const user = await User.findOne({ email: 'ana@example.com' });
    assert.deepEqual(claims, { id: String(user._id), email: user.email, role: 'user' });

    const current = await fetch(url + '/current', { headers: { Cookie: cookie } });
    assert.equal(current.status, 200);
    assert.deepEqual(await current.json(), { status: 'success', payload: claims });

    const expired = jwt.sign(claims, secret, { expiresIn: -1 });
    const [header, payload, signature] = token.split('.');
    const changed = signature.startsWith('A') ? 'B' : 'A';
    const invalid = `${header}.${payload}.${changed}${signature.slice(1)}`;
    for (const rejectedToken of [invalid, expired]) {
      const response = await fetch(url + '/current', {
        headers: { Cookie: `currentUser=${rejectedToken}` }
      });
      assert.equal(response.status, 401);
      assert.deepEqual(await response.json(), { status: 'error', message: 'No autenticado' });
    }

    const logout = await fetch(url + '/logout', { method: 'POST', headers: { Cookie: cookie } });
    assert.equal(logout.status, 200);
    assert.deepEqual(await logout.json(), { status: 'success', message: 'Sesión cerrada' });
    assert.match(
      logout.headers.get('set-cookie'),
      /^currentUser=; Path=\/; Expires=Thu, 01 Jan 1970/
    );
    const afterLogout = await fetch(url + '/current');
    assert.equal(afterLogout.status, 401);
  });
});
