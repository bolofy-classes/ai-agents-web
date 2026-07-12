import { apiFetch, tokenStore } from './client'

export async function login(email, password) {
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, password },
  })
  const { user, token } = res.data
  tokenStore.set(token)
  return user
}

export async function register(name, email, password) {
  const res = await apiFetch('/auth/register', {
    method: 'POST',
    auth: false,
    body: { name, email, password },
  })
  const { user, token } = res.data
  tokenStore.set(token)
  return user
}

export async function getCurrentUser() {
  const res = await apiFetch('/auth/me')
  return res.data.user
}

export function logout() {
  tokenStore.clear()
}

export function hasToken() {
  return Boolean(tokenStore.get())
}
