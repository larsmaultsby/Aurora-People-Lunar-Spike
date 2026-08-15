export function normalizeAuroraBaseUrl(value = '') {
  const trimmed = String(value || '').trim()
  if (!trimmed) return '/aurora-api'
  return trimmed.replace(/\/$/, '')
}

export function joinBasePath(basePath = '/', segment = '') {
  const base = String(basePath || '/').replace(/^\/+|\/+$/g, '')
  const suffix = String(segment || '').replace(/^\/+|\/+$/g, '')
  return `/${[base, suffix].filter(Boolean).join('/')}`.replace(/\/{2,}/g, '/')
}

export function interactionMessage(type, text) {
  const mode = String(type || 'DO').toUpperCase()
  const body = String(text || '').trim()
  if (mode === 'SAY') {
    const safe = body.replace(/[“”"]/g, "'")
    return `"${safe}"`
  }
  return body
}

export function conversationToMessages(view) {
  const turns = Array.isArray(view?.conversation) ? view.conversation : []
  const messages = []
  for (const turn of turns) {
    const input = turn?.input || {}
    const response = turn?.response || {}
    const playerText = [input.action, input.speech].filter(Boolean).join(' ')
    const showInput = !turn?.sceneTurnId || turn?.sceneTurnSequence === 1
    if (playerText && showInput) messages.push({ role: 'user', content: playerText, id: `u:${turn.id}` })
    const reply = [response.speech, ...(Array.isArray(response.actions) ? response.actions : [])].filter(Boolean).join('\n\n')
    if (reply) messages.push({ role: 'assistant', content: reply, personName: turn.personName, id: `a:${turn.id}` })
  }
  return messages
}

export function auroraContext(view) {
  return {
    inventory: Array.isArray(view?.inventory) ? view.inventory : [],
    journal: Array.isArray(view?.journal) ? view.journal : [],
    relationships: Array.isArray(view?.relationships) ? view.relationships : [],
    commitments: [
      ...(Array.isArray(view?.pending) ? view.pending : []),
      ...(Array.isArray(view?.commitments) ? view.commitments : []),
    ],
    destinations: Array.isArray(view?.scene?.destinations) ? view.scene.destinations : [],
    people: Array.isArray(view?.scene?.people) ? view.scene.people : [],
  }
}
