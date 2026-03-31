import { fail } from "../utils/http.js";

export function notFound(req, res) {
  return fail(res, "Not found", 404);
}

export function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-unused-vars
  const status = Number(err?.status || err?.statusCode || 500);
  const message = err?.message || "Server error";
  // Avoid leaking full stacks to clients.
  if (status >= 500) {
    // Keep a server-side breadcrumb.
    console.error(err);
  }
  return fail(res, message, status);
}

