import { sessionsService } from '../services/sessions.service.js';

export function getSessionsStatus(req, res) {
  res.status(501).json({
    status: 'error',
    message: 'Autenticación pendiente para próximas entregas'
  });
}

export async function register(req, res, next) {
  try {
    const payload = await sessionsService.register(req.body);
    res.status(201).json({ status: 'success', payload });
  } catch (error) {
    next(error);
  }
}
