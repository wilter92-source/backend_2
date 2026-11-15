import app from './app.js';
import { config } from './config/config.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

try {
  await connectDatabase(config.mongoUrl);

  const server = app.listen(config.port, () => {
    console.log(`Escena Guayaquil activo en http://localhost:${config.port}`);
  });

  server.on('error', async (error) => {
    console.error(`No se pudo iniciar el servidor (${error.code || 'error'})`);
    process.exitCode = 1;
    await disconnectDatabase();
  });

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
      server.close(async () => {
        await disconnectDatabase();
      });
    });
  }
} catch (error) {
  console.error(config.mongoUrl
    ? `No se pudo preparar MongoDB (${error.code || error.name})`
    : 'Configura MONGO_URL en el archivo .env');
  await disconnectDatabase();
  process.exitCode = 1;
}
