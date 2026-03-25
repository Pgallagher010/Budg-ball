import { fail } from "../utils/http.js";

// Consistent 404 response for unknown routes.
export function notFound(_req, res) {
  return fail(res, "Route not found", 404);
}

// Last-resort error handler. Preserve status when callers set error.status.
export function errorHandler(error, _req, res, _next) {
  const status = error.status || 500;
  const message = error.message || "Internal server error";
  return fail(res, message, status);
}
