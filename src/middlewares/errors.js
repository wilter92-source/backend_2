import { HttpError } from '../utils/HttpError.js';

export function notFound(req, res) {
  res.status(404).json({ status: 'error', message: 'Ruta no encontrada' });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error instanceof HttpError) {
    return res.status(error.status).json({ status: 'error', message: error.message });
  }
  const status =
    error.type === 'entity.parse.failed' ? 400 : error.type === 'entity.too.large' ? 413 : 500;
  const message =
    status === 400
      ? 'JSON inválido'
      : status === 413
        ? 'Cuerpo de petición demasiado grande'
        : 'Error interno del servidor';
  res.status(status).json({ status: 'error', message });
}
