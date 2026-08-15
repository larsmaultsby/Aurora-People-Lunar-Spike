import { normalizeAuroraBaseUrl } from './adapter'

const BASE = normalizeAuroraBaseUrl(import.meta.env.VITE_AURORA_PEOPLE_BASE_URL)

async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  })
  let payload = {}
  try { payload = await response.json() } catch {}
  if (!response.ok) throw new Error(payload.error || `Aurora People request failed (${response.status})`)
  return payload
}

export async function fetchAuroraView() {
  const payload = await request('/api/play')
  if (payload?.view?.contract !== 'player-view-v1') throw new Error('Aurora People did not return player-view-v1')
  return payload.view
}

export async function interactAurora({ message, personId, privacyMode = 'public' }) {
  const payload = await request('/api/play/interact', {
    method: 'POST',
    body: JSON.stringify({ message, personId, privacyMode, inputContract: 'scene-v1' }),
  })
  return payload.view
}

export async function moveAurora(roomId) {
  const payload = await request('/api/play/move', { method: 'POST', body: JSON.stringify({ roomId }) })
  return payload.view
}

export async function waitAurora(steps = 1) {
  const payload = await request('/api/play/wait', { method: 'POST', body: JSON.stringify({ steps }) })
  return payload.view
}

export const auroraBaseUrl = BASE
