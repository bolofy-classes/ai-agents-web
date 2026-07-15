import { apiFetch } from './client'

export function getWeather(q) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : ''
  return apiFetch(`/weather${qs}`).then((r) => r.data)
}
