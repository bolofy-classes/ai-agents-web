import { apiFetch } from './client'

// Suggest classic top/bottom meme captions from a topic.
export function suggestCaptions(topic) {
  return apiFetch('/memes/captions', { method: 'POST', body: { topic } }).then((r) => r.data)
}

// Generate an original meme image from a prompt → { imageBase64, mimeType }.
export function generateImage(prompt) {
  return apiFetch('/memes/image', { method: 'POST', body: { prompt } }).then((r) => r.data)
}

// Publish a meme. LinkedIn posts via the API; X/Instagram return { manual: true }.
export function postMeme({ imageBase64, caption, platform }) {
  return apiFetch('/memes/post', {
    method: 'POST',
    body: { imageBase64, caption, platform },
  }).then((r) => r.data)
}

// LinkedIn connection status is reused from the social feature.
export function getLinkedInStatus() {
  return apiFetch('/social/linkedin/status').then((r) => r.data)
}

export async function getLinkedInAuthUrl() {
  const r = await apiFetch('/social/linkedin/auth/url')
  return r.data.url
}
