const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "")

function buildUrl(path) {
  if (!API_BASE) return path
  // If caller passes "/api/...", keep it.
  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`
}

/**
 * @param {string} path
 * @param {object} [opts]
 * @param {'dev'|'firebase'} [opts.authMode]
 * @param {string} [opts.idToken]
 * @param {string} [opts.devUserId]
 */
export async function apiFetch(path, opts = {}) {
  const {
    authMode = "dev",
    idToken = "",
    devUserId = "",
    method = "GET",
    headers,
    body,
    ...rest
  } = opts

  const h = { ...(headers || {}) }
  if (authMode === "firebase" && idToken) {
    h.Authorization = `Bearer ${idToken}`
  } else if (authMode === "dev" && devUserId) {
    h["x-dev-user-id"] = devUserId
  }

  let finalBody = body
  if (body !== undefined && body !== null && typeof body === "object" && !(body instanceof FormData)) {
    h["Content-Type"] = h["Content-Type"] || "application/json"
    finalBody = JSON.stringify(body)
  }

  const res = await fetch(buildUrl(path), {
    method,
    headers: h,
    body: finalBody,
    ...rest,
  })

  let parsed = null
  try {
    parsed = await res.json()
  } catch {
    parsed = null
  }

  return {
    ok: res.ok,
    status: res.status,
    body: parsed,
  }
}
