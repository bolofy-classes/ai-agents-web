const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const TOKEN_KEY = 'ai_agents_token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

/**
 * Thin fetch wrapper that:
 *  - prefixes the API base URL
 *  - attaches the Bearer token when present
 *  - parses JSON and throws a normalized Error on failure
 */
export async function apiFetch(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }

  if (auth) {
    const token = tokenStore.get()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Cannot reach the server. Is the API running?')
  }

  let data = null
  try {
    data = await res.json()
  } catch {
    // non-JSON response
  }

  if (!res.ok || (data && data.success === false)) {
    const message = (data && data.message) || `Request failed (${res.status})`
    const err = new Error(message)
    err.status = res.status
    err.errors = data && data.errors
    throw err
  }

  return data
}
