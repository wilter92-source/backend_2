import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';

export const SESSION_COOKIE = 'currentUser';

export function generateToken(user) {
  return jwt.sign(user, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: config.jwtExpiresIn
  });
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
}
