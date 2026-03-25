// Shared API envelope helpers keep response shapes consistent across routes.
export function ok(res, data, status = 200) {
  return res.status(status).json({
    success: true,
    data,
  });
}

export function fail(res, message, status = 400, details = null) {
  return res.status(status).json({
    success: false,
    error: {
      message,
      details,
    },
  });
}
