import 'dotenv/config';

const port = Number(process.env.PORT || 8080);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT debe ser un entero entre 1 y 65535');
}
export const config = Object.freeze({
  port,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUrl: process.env.MONGO_URL || '',
  jwtSecret: process.env.JWT_SECRET || ''
});
