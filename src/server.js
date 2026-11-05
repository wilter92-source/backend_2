import app from './app.js';
import { config } from './config/config.js';

const server = app.listen(config.port, () => {
  console.log(`Escena Guayaquil activo en http://localhost:${config.port}`);
});
server.on('error', (error) => {
  console.error(`No se pudo iniciar el servidor (${error.code || 'error'})`);
  process.exitCode = 1;
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
