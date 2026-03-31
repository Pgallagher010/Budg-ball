export function ok(res, data, status = 200) {
  return res.status(status).json({ ok: true, data });
}

export function fail(res, message, status = 400, details) {
  const payload = { ok: false, error: { message } };
  if (details !== undefined) payload.error.details = details;
  return res.status(status).json(payload);
}

