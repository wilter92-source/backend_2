export function getSessionsStatus(req, res) {
  res.status(501).json({
    status: 'error',
    message: 'Autenticación pendiente para próximas entregas'
  });
}
