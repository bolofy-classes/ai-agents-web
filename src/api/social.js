import { apiFetch } from './client'

// --- LinkedIn connection ---
export function getLinkedInStatus() {
  return apiFetch('/social/linkedin/status').then((r) => r.data)
}

export async function getLinkedInAuthUrl() {
  const r = await apiFetch('/social/linkedin/auth/url')
  return r.data.url
}

export function disconnectLinkedIn() {
  return apiFetch('/social/linkedin/disconnect', { method: 'DELETE' })
}

// --- Generation + drafts ---
export function generate(query) {
  return apiFetch('/social/generate', { method: 'POST', body: { query } }).then((r) => r.data)
}

export function listPosts(status) {
  const qs = status ? `?status=${status}` : ''
  return apiFetch(`/social/posts${qs}`).then((r) => r.data.posts)
}

export function createPost({ platform, content, prompt }) {
  return apiFetch('/social/posts', { method: 'POST', body: { platform, content, prompt } }).then(
    (r) => r.data.post
  )
}

export function updatePost(id, body) {
  return apiFetch(`/social/posts/${id}`, { method: 'PUT', body }).then((r) => r.data.post)
}

export function deletePost(id) {
  return apiFetch(`/social/posts/${id}`, { method: 'DELETE' })
}

export function publish(id) {
  return apiFetch(`/social/posts/${id}/publish`, { method: 'POST' }).then((r) => r.data.post)
}

export function markPosted(id, postUrl) {
  return apiFetch(`/social/posts/${id}/mark-posted`, { method: 'POST', body: { postUrl } }).then(
    (r) => r.data.post
  )
}

export function refreshMetrics(id) {
  return apiFetch(`/social/posts/${id}/refresh-metrics`, { method: 'POST' }).then((r) => r.data.post)
}

export function getAnalytics() {
  return apiFetch('/social/analytics').then((r) => r.data)
}
