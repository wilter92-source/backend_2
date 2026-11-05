# Escena Guayaquil

API de eventos culturales en Guayaquil, como conciertos, obras de teatro y talleres. Proyecto para la preentrega 1 de Backend II.

Incluye la estructura inicial del servidor. El listado de eventos devuelve una lista vacía y la autenticación se implementará más adelante.

## Tecnologías

- Node.js 22 o superior
- Express
- MongoDB y Mongoose para los modelos
- dotenv
- JavaScript con módulos ESM

## Instalación

Desde la carpeta del proyecto, instala las dependencias:

```bash
npm ci
```

Copia el archivo `.env.example` y renombra la copia como `.env`.

## Variables de entorno

```env
PORT=8080
NODE_ENV=development
MONGO_URL=
JWT_SECRET=
```

`PORT` define el puerto del servidor y `NODE_ENV` el entorno de ejecución. `MONGO_URL` y `JWT_SECRET` quedan preparados para próximas entregas y pueden permanecer vacíos.

En esta etapa no se necesita una conexión activa a MongoDB.

## Ejecución

Iniciar el servidor:

```bash
npm start
```

Iniciar en modo desarrollo:

```bash
npm run dev
```

Ejecutar las pruebas:

```bash
npm test
```

El servidor estará disponible en `http://localhost:8080`.

## Estructura

```text
src/
  app.js
  server.js
  config/
  routes/
  controllers/
  services/
  repositories/
  dao/
  models/
  middlewares/
  utils/
test/
.env.example
.gitignore
package.json
package-lock.json
README.md
```

`app.js` configura Express y conecta las rutas. `server.js` inicia el servidor. El recurso de eventos está separado en ruta, controlador, servicio, repositorio y DAO.

Los modelos iniciales son `User` y `Event`.

## Rutas disponibles

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/health` | Verifica que el servidor esté activo. |
| GET | `/api/events` | Devuelve una lista vacía de eventos. |
| GET | `/api/sessions` | Ruta inicial sin autenticación. Responde con estado 501. |

Respuesta de `/api/health`:

```json
{
  "status": "ok",
  "message": "Servidor activo"
}
```

Respuesta de `/api/events`:

```json
{
  "status": "success",
  "payload": []
}
```# backend_2
