import passport from 'passport';
import { Strategy } from 'passport-custom';
import { sessionsService } from '../services/sessions.service.js';
import { HttpError } from '../utils/HttpError.js';
import { SESSION_COOKIE, verifyToken } from '../utils/jwt.js';
import { roles } from './roles.js';

function strategy(resolveUser) {
  return new Strategy(async (req, done) => {
    try {
      const user = await resolveUser(req);
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  });
}

passport.use(
  'register',
  strategy((req) => sessionsService.register(req.body))
);
passport.use(
  'login',
  strategy((req) => sessionsService.login(req.body))
);
passport.use(
  'current',
  strategy((req) => {
    let claims;
    try {
      claims = verifyToken(req.cookies?.[SESSION_COOKIE]);
    } catch {
      throw new HttpError(401, 'No autenticado');
    }
    const { id, email, role, exp } = claims;
    if (
      typeof id !== 'string' ||
      typeof email !== 'string' ||
      !roles.includes(role) ||
      !Number.isFinite(exp)
    ) {
      throw new HttpError(401, 'No autenticado');
    }
    return { id, email, role };
  })
);

export default passport;
