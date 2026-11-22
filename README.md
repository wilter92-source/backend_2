# Escena Guayaquil

API de eventos culturales de Guayaquil. **Preentrega 3 de Programación Backend II — Autenticación con JWT y cookies.**

La API registra usuarios con bcrypt y usa JWT en una cookie HTTP Only para iniciar sesión, consultar el usuario autenticado y cerrar la sesión. El modelo `Enrollment` establece la relación entre usuarios y eventos y define un índice único por pareja.

## Instalación

Requisitos: Node.js 22 o superior y MongoDB en ejecución, local o Atlas.

1. Ejecuta `npm ci` en la raíz del proyecto.
2. Copia `.env.example` como `.env` (`cp .env.example .env` en macOS/Linux o `Copy-Item .env.example .env` en PowerShell).
3. Configura `MONGO_URL`. Para Atlas, pega la URI de tu clúster con un usuario de base de datos y el nombre de la base. Autoriza tu IP en el proyecto de Atlas. Para MongoDB local puedes usar la URI de ejemplo.
4. Genera una clave con `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` y asígnala a `JWT_SECRET` en tu `.env`. Si ya tienes ese archivo, agrega las variables nuevas allí.
5. Ejecuta `npm start` o `npm run dev`. El servidor inicia después de conectarse a MongoDB y preparar el índice único de correo.

| Variable | Uso |
| --- | --- |
| `PORT` | Puerto HTTP. Por defecto, `8080`. |
| `NODE_ENV` | Entorno. Por defecto, `development`. Usa `production` con HTTPS para emitir la cookie con `Secure`. |
| `MONGO_URL` | URI de MongoDB. El ejemplo apunta a `mongodb://127.0.0.1:27017/escena_guayaquil`. |
| `JWT_SECRET` | Clave privada obligatoria para firmar y verificar el JWT. |
| `JWT_EXPIRES_IN` | Vigencia del JWT con unidad, por ejemplo `30m` o `1h`. Por defecto, `1h`. |
| `TEST_MONGO_URL` | URI opcional de una instancia MongoDB de pruebas para habilitar la integración HTTP. |

`.env` y `node_modules` están excluidos por `.gitignore`.

## Rutas

Usa `http://localhost:8080` en desarrollo. Para solicitudes con cuerpo, envía `Content-Type: application/json`.

| Método | Ruta | Descripción | Ejemplo de solicitud | Ejemplo de respuesta |
| --- | --- | --- | --- | --- |
| GET | `/api/health` | Consulta el estado del servidor. | Sin cuerpo. | `200` `{"status":"ok","message":"Servidor activo"}` |
| GET | `/api/events` | Lista los eventos. | Sin cuerpo. | `200` `{"status":"success","payload":[]}` |
| GET | `/api/sessions` | Consulta la disponibilidad de la autenticación. | Sin cuerpo. | `200` `{"status":"success","message":"Autenticación disponible"}` |
| POST | `/api/sessions/register` | Registra un usuario. | `{"first_name":"Ana","last_name":"Pérez","email":"ana@example.com","password":"Secreta123"}` | `201` `{"status":"success","payload":{"id":"665f2a111111111111111111","first_name":"Ana","last_name":"Pérez","email":"ana@example.com","role":"user"}}` |
| POST | `/api/sessions/login` | Valida las credenciales y establece la cookie `currentUser`. | `{"email":"ana@example.com","password":"Secreta123"}` | `200` `{"status":"success","message":"Login correcto"}` |
| GET | `/api/sessions/current` | Devuelve el usuario autenticado. | Sin cuerpo. El cliente envía la cookie `currentUser`. | `200` `{"status":"success","payload":{"id":"665f2a111111111111111111","email":"ana@example.com","role":"user"}}` |
| POST | `/api/sessions/logout` | Borra la cookie `currentUser`. | Sin cuerpo. Usa la misma sesión del cliente. | `200` `{"status":"success","message":"Sesión cerrada"}` |

## Probar el registro

Usa `POST http://localhost:8080/api/sessions/register` con `Content-Type: application/json`.

| Campo obligatorio | Reglas |
| --- | --- |
| `first_name` | Texto con contenido. Se recortan los espacios de los extremos. |
| `last_name` | Texto con contenido. Se recortan los espacios de los extremos. |
| `email` | Correo válido y único. Se recortan los espacios y se convierte a minúsculas. |
| `password` | Texto de al menos 8 caracteres y hasta 72 bytes UTF-8, de acuerdo con el límite de bcrypt. Se conserva exactamente como se ingresó antes de calcular el hash. |

El modelo admite `user`, `organizer` y `admin`. El registro público genera siempre el rol `user` e ignora cualquier rol enviado en el cuerpo.

```bash
curl -i -X POST http://localhost:8080/api/sessions/register \
  -H 'Content-Type: application/json' \
  -d '{"first_name":"Ana","last_name":"Pérez","email":" Ana@Example.com ","password":"Secreta123"}'
```

Respuesta de ejemplo (`201 Created`):

```json
{
  "status": "success",
  "payload": {
    "id": "665f2a111111111111111111",
    "first_name": "Ana",
    "last_name": "Pérez",
    "email": "ana@example.com",
    "role": "user"
  }
}
```

- Para comprobar `400`, elimina un campo obligatorio, cambia el correo a `ana.example.com` o usa una contraseña de menos de 8 caracteres.
- Para comprobar `409`, repite el registro con el mismo correo, incluso con espacios o mayúsculas diferentes.
- Para verificar el almacenamiento, consulta la colección `users` en MongoDB Compass o en `mongosh` con `db.users.findOne({ email: "ana@example.com" })`. En MongoDB se guarda un hash bcrypt. La respuesta HTTP omite el campo `password`.

## Probar la sesión

En Postman o Thunder Client, usa el mismo host en todo el flujo y conserva activado el almacenamiento de cookies.

1. Registra al usuario de ejemplo e inicia sesión con su correo y contraseña. La respuesta devuelve `200` y establece la cookie `currentUser` con `HttpOnly`, `SameSite=Lax` y `Max-Age=3600`. En producción la cookie también tiene `Secure`.
2. Consulta `GET /api/sessions/current`. Debe devolver `200` con `id`, `email` y `role`.
3. Ejecuta `POST /api/sessions/logout` y vuelve a consultar `/current`. Debe devolver `401` con `{"status":"error","message":"No autenticado"}`, la misma respuesta que devuelve con una cookie inválida o vencida.
4. Prueba iniciar sesión con un correo inexistente y con una contraseña incorrecta. Ambos devuelven `401` con `{"status":"error","message":"Credenciales inválidas"}`. Si falta el correo o la contraseña, devuelve `400` con `{"status":"error","message":"Email y contraseña son obligatorios"}`.

## Pruebas y formato

`npm test` ejecuta las pruebas sin servicios externos. Para incluir la integración HTTP, configura `TEST_MONGO_URL` en `.env` o en la terminal y usa una instancia **de pruebas** con permisos para crear y eliminar una base temporal de nombre único. La integración verifica el ciclo de sesión y que, de doce registros concurrentes con el mismo correo, solo uno se guarda.

```bash
TEST_MONGO_URL=mongodb://127.0.0.1:27017 npm test
```

En PowerShell, usa `$env:TEST_MONGO_URL = 'mongodb://127.0.0.1:27017'` y luego `npm test`.

`npm run format:check` verifica el formato y `npm run format` aplica Prettier.

## Arquitectura

`app.js` configura Express. `server.js` gestiona MongoDB y el arranque del servidor. El registro recorre:

```text
routes/sessions.router.js
  → controllers/sessions.controller.js
    → services/sessions.service.js
      → repositories/users.repository.js
        → dao/users.dao.js
          → models/User.js
```

`utils/hash.js` reúne el hash y la comparación de bcrypt. `models/User.js` declara el índice único de correo y excluye `password` de las consultas normales. El servicio limita la respuesta a los campos públicos. La comprobación previa de duplicados y el índice cubren tanto reintentos como registros simultáneos.

`utils/jwt.js` firma y verifica el JWT. `middlewares/auth.middleware.js` lee la cookie, valida el token y asigna `req.user`. El modelo y el middleware comparten los roles de `config/roles.js`.

## Evidencias del registro

En el repositorio de entrega, las dos capturas previas deben tener una sola extensión `.png` y coincidir con estos nombres.

- [Postman — respuesta 201 sin el campo password](evidencias/http-201.png)
- [MongoDB Compass — usuario guardado con hash bcrypt](evidencias/mongodb-hash.png)