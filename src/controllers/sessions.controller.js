import { config } from '../config/config.js';
import { generateToken, SESSION_COOKIE } from '../utils/jwt.js';
import { sessionsService } from '../services/sessions.service.js';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: config.nodeEnv === 'production',
  path: '/'
};

export function getSessionsStatus(req, res) {
  res.status(200).json({ status: 'success', message: 'Autenticación disponible' });
}

export async function register(req, res, next) {
  try {
    const payload = await sessionsService.register(req.body);
    res.status(201).json({ status: 'success', payload });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const user = await sessionsService.login(req.body);
    const token = generateToken(user);
    res.cookie(SESSION_COOKIE, token, { ...cookieOptions, maxAge: 3600000 });
    res.status(200).json({ status: 'success', message: 'Login correcto' });
  } catch (error) {
    next(error);
  }
}

export function current(req, res) {
  res.status(200).json({ status: 'success', payload: req.user });
}

export function logout(req, res) {
  res.clearCookie(SESSION_COOKIE, cookieOptions);
  res.status(200).json({ status: 'success', message: 'Sesión cerrada' });
}
