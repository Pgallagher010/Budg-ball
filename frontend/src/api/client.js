/**
 * API helpers for Budg'Ball backend (Vite proxies /api and /health).
 */

export function buildAuthHeaders({ authMode, idToken, devUserId }) {
  const h = { 'Content-Type': 'application/json' }
  if (authMode === 'firebase' && idToken) {
    h.Authorization = `Bearer ${idToken}`
    return h
  }
  if (devUserId?.trim()) h['x-dev-user-id'] = devUserId.trim()
  return h
}

export async function apiFetch(path, { authMode, idToken, devUserId, ...init } = {}) {
  const headers = {
    ...buildAuthHeaders({ authMode, idToken, devUserId }),
    ...(init.headers || {}),
  }
  const res = await fetch(path, { ...init, headers })
  const text = await res.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    body = text
  }
  return { ok: res.ok, status: res.status, body }
}
