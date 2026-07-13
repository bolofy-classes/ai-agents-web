import { apiFetch } from './client'

// --- Connection ---
export function getStatus() {
  return apiFetch('/gmail/status').then((r) => r.data)
}

export async function getAuthUrl() {
  const r = await apiFetch('/gmail/auth/url')
  return r.data.url
}

export function disconnect() {
  return apiFetch('/gmail/disconnect', { method: 'DELETE' })
}

// --- Messages ---
export function getMessages() {
  return apiFetch('/gmail/messages').then((r) => r.data)
}

export function sync(max = 25) {
  return apiFetch(`/gmail/sync?max=${max}`, { method: 'POST' }).then((r) => r.data)
}

export function trash(gmailIds) {
  return apiFetch('/gmail/trash', { method: 'POST', body: { gmailIds } }).then((r) => r.data)
}

export function send(gmailId, body) {
  return apiFetch('/gmail/send', { method: 'POST', body: { gmailId, body } }).then((r) => r.data)
}

export function block(gmailId) {
  return apiFetch('/gmail/block', { method: 'POST', body: { gmailId } }).then((r) => r.data)
}

// --- Agent actions ---
export function summarize(gmailId) {
  return apiFetch('/agent/summarize', { method: 'POST', body: { gmailId } }).then((r) => r.data)
}

export function analyze(gmailId) {
  return apiFetch('/agent/analyze', { method: 'POST', body: { gmailId } }).then((r) => r.data)
}

export function reply(gmailId) {
  return apiFetch('/agent/reply', { method: 'POST', body: { gmailId } }).then((r) => r.data)
}

export function schedule(gmailId) {
  return apiFetch('/agent/schedule', { method: 'POST', body: { gmailId } }).then((r) => r.data)
}

export function suggestDelete() {
  return apiFetch('/agent/suggest-delete', { method: 'POST' }).then((r) => r.data)
}
