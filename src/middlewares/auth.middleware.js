import { roles } from '../config/roles.js';
import { HttpError } from '../utils/HttpError.js';
import { SESSION_COOKIE, verifyToken } from '../utils/jwt.js';

export function authenticate(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE];
  const unauthorized = new HttpError(401, 'No autenticado');
  if (!token) return next(unauthorized);

  try {
    const { id, email, role, exp } = verifyToken(token);
    if (
      typeof id !== 'string' ||
      typeof email !== 'string' ||
      !roles.includes(role) ||
      !Number.isFinite(exp)
    ) {
      return next(unauthorized);
    }
    req.user = { id, email, role };
  } catch {
    return next(unauthorized);
  }

  next();
}
