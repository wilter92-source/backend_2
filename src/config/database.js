import mongoose from 'mongoose';
import { User } from '../models/User.js';

export async function connectDatabase(mongoUrl, { dbName } = {}) {
  if (!mongoUrl) throw new Error('Configura MONGO_URL en el archivo .env');

  await mongoose.connect(mongoUrl, { dbName, serverSelectionTimeoutMS: 5000 });
  // La API empieza a aceptar registros cuando el índice único está listo.
  await User.createIndexes();
}

export function disconnectDatabase() {
  return mongoose.disconnect();
}
