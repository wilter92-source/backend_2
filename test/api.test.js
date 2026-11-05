import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Event } from '../src/models/Event.js';
import { EventsService } from '../src/services/events.service.js';
let server, base;
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => server.close(resolve)));
test('health cumple el contrato', async () => {
  const r = await fetch(`${base}/api/health`);
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { status: 'ok', message: 'Servidor activo' });
});
test('events devuelve una lista vacía', async () => {
  const r = await fetch(`${base}/api/events`);
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { status: 'success', payload: [] });
});
test('sessions declara autenticación pendiente', async () => {
  const r = await fetch(`${base}/api/sessions`);
  assert.equal(r.status, 501);
});
test('ruta inexistente responde 404', async () => {
  const r = await fetch(`${base}/missing`);
  assert.equal(r.status, 404);
});
test('JSON inválido responde 400', async () => {
  const r = await fetch(`${base}/api/events`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(r.status, 400);
  assert.equal((await r.json()).message, 'JSON inválido');
});
test('servicio permite inyectar el repositorio', async () => {
  const service = new EventsService({ findAll: async () => [{ title: 'Teatro' }] });
  assert.deepEqual(await service.list(), [{ title: 'Teatro' }]);
});
test('User exige campos y restringe roles', () => {
  const u = new User({ role: 'invalid' });
  const e = u.validateSync();
  for (const key of ['first_name', 'last_name', 'email', 'password', 'role']) assert.ok(e.errors[key]);
  assert.equal(User.schema.path('password').options.select, false);
});
test('Event rechaza cupos fraccionarios y fechas inválidas', () => {
  const e = new Event({ capacity: 1.5, date: 'invalid' }).validateSync();
  assert.ok(e.errors.capacity);
  assert.ok(e.errors.date);
});
