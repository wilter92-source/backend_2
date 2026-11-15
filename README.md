# Escena Guayaquil

API de eventos culturales de Guayaquil. **Preentrega 2 de Programación Backend II — Registro seguro de usuarios.**

El registro valida las entradas, normaliza el correo, guarda el hash de la contraseña y devuelve únicamente los campos públicos del usuario. El modelo `Enrollment` establece la relación entre usuarios y eventos y define un índice único por pareja. Las rutas de inscripción, el control de cupos, el login y JWT corresponden a etapas posteriores.

## Instalación

Requisitos: Node.js 22 o superior y MongoDB en ejecución, local o Atlas.

1. Ejecuta `npm ci` en la raíz del proyecto.
2. Copia `.env.example` como `.env` (`cp .env.example .env` en macOS/Linux o `Copy-Item .env.example .env` en PowerShell).
3. Revisa `MONGO_URL` y ejecuta `npm start`. El servidor inicia después de conectarse a MongoDB y preparar el índice único de correo. En desarrollo también puedes usar `npm run dev`.

| Variable | Uso |
| --- | --- |
| `PORT` | Puerto HTTP. Por defecto, `8080`. |
| `NODE_ENV` | Entorno. Por defecto, `development`. |
| `MONGO_URL` | URI de MongoDB. El ejemplo apunta a `mongodb://127.0.0.1:27017/escena_guayaquil`. |
| `JWT_SECRET` | Reservada para un módulo posterior. Puede quedar vacía. |

`.env` y `node_modules` están excluidos por `.gitignore`.

## Rutas

| Método | Ruta | Respuesta |
| --- | --- | --- |
| GET | `/api/health` | `200`. Estado del servidor. |
| GET | `/api/events` | `200`. Listado inicial de eventos. |
| GET | `/api/sessions` | `501`. Estado de las futuras funciones de sesión. |
| POST | `/api/sessions/register` | `201`, `400` o `409`. Registro público de usuarios. |

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

## Pruebas y formato

`npm test` corre las pruebas de regresión y validación sin servicios externos. Para incluir las pruebas de integración con MongoDB, apunta `TEST_MONGO_URL` a una instancia **de pruebas**. La suite crea y elimina una base temporal de nombre único.

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
