import { config } from '../config/config.js';
import { generateToken, SESSION_COOKIE } from '../utils/jwt.js';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: config.nodeEnv === 'production',
  path: '/'
};

export function getSessionsStatus(req, res) {
  res.status(200).json({ status: 'success', message: 'Autenticación disponible' });
}

export function register(req, res) {
  res.status(201).json({ status: 'success', payload: req.user });
}

export function login(req, res) {
  const token = generateToken(req.user);
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions, maxAge: 3600000 });
  res.status(200).json({ status: 'success', message: 'Login correcto' });
}

export function current(req, res) {
  res.status(200).json({ status: 'success', payload: req.user });
}

export function logout(req, res) {
  res.clearCookie(SESSION_COOKIE, cookieOptions);
  res.status(200).json({ status: 'success', message: 'Sesión cerrada' });
}
