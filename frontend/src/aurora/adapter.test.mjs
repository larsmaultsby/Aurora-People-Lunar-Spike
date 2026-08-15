import test from 'node:test'
import assert from 'node:assert/strict'
import { auroraContext, conversationToMessages, interactionMessage, normalizeAuroraBaseUrl } from './adapter.js'

test('normalizes Aurora API base without changing the default proxy', () => {
  assert.equal(normalizeAuroraBaseUrl(''), '/aurora-api')
  assert.equal(normalizeAuroraBaseUrl('http://localhost:4173/'), 'http://localhost:4173')
})

test('compiles DO and SAY into Aurora scene-v1 text', () => {
  assert.equal(interactionMessage('DO', 'I open the door.'), 'I open the door.')
  assert.equal(interactionMessage('SAY', 'Hello "there"'), '"Hello \'there\'"')
})

test('projects only player-view-v1 data into shell context', () => {
  const context = auroraContext({
    inventory: [{ id: 'i1' }], journal: [{ id: 'j1' }], relationships: [{ personId: 'p1' }],
    commitments: [{ id: 'c1' }], pending: [{ id: 'p1' }],
    scene: { destinations: [{ id: 'r2' }], people: [{ id: 'npc1' }] }, hiddenMemory: ['must not leak'],
  })
  assert.deepEqual(Object.keys(context).sort(), ['commitments', 'destinations', 'inventory', 'journal', 'people', 'relationships'])
  assert.equal(context.commitments.length, 2)
})

test('conversation projection preserves player and visible response text', () => {
  const messages = conversationToMessages({ conversation: [{
    id: 't1', personName: 'Mira', input: { action: 'I wave.', speech: null },
    response: { speech: 'Hello.', actions: ['She smiles.'] },
  }] })
  assert.deepEqual(messages.map((entry) => entry.role), ['user', 'assistant'])
  assert.match(messages[1].content, /Hello\./)
  assert.match(messages[1].content, /She smiles\./)
})
