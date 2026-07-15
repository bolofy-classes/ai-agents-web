import { apiFetch } from './client'

export function getSettings() {
  return apiFetch('/news/settings').then((r) => r.data)
}

export function summarizeArticle({ title, description, source, url }) {
  return apiFetch('/news/summarize', {
    method: 'POST',
    body: { title, description, source, url },
  }).then((r) => r.data)
}

export function saveSettings(body) {
  return apiFetch('/news/settings', { method: 'PUT', body }).then((r) => r.data)
}

// Client-side cache + in-flight de-duplication so rapid tab switches and
// React StrictMode's double-mount don't hammer the GNews rate limit.
const TTL_MS = 5 * 60 * 1000
const cache = new Map() // key -> { at, data }
const inflight = new Map() // key -> Promise

export function getNews({ category, q, force = false } = {}) {
  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (q) params.set('q', q)
  const qs = params.toString()
  const key = qs || 'default'

  if (!force) {
    const hit = cache.get(key)
    if (hit && Date.now() - hit.at < TTL_MS) return Promise.resolve(hit.data)
    if (inflight.has(key)) return inflight.get(key)
  }

  const p = apiFetch(`/news${qs ? `?${qs}` : ''}`)
    .then((r) => {
      cache.set(key, { at: Date.now(), data: r.data })
      return r.data
    })
    .finally(() => inflight.delete(key))

  inflight.set(key, p)
  return p
}

