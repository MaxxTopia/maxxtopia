import assert from 'node:assert/strict'
import { webcrypto } from 'node:crypto'
import worker from '../tickets-worker/worker.js'
import { STANDING_API, WINDOWS_API } from '../tickets-worker/points-live.js'

if (!globalThis.crypto) globalThis.crypto = webcrypto

const encoder = new TextEncoder()
const toHex = bytes => Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('')

const keyPair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])
const publicKey = toHex(await crypto.subtle.exportKey('raw', keyPair.publicKey))

async function invoke(data, userId = null) {
  const interaction = { type: 2, data }
  if (userId) interaction.member = { user: { id: userId } }
  const body = JSON.stringify(interaction)
  const timestamp = String(Math.floor(Date.now() / 1000))
  const signature = toHex(await crypto.subtle.sign('Ed25519', keyPair.privateKey, encoder.encode(timestamp + body)))
  const pending = []
  const request = new Request('https://maxxtopia-tickets.test/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature-Ed25519': signature,
      'X-Signature-Timestamp': timestamp,
    },
    body,
  })
  const response = await worker.fetch(request, { DISCORD_PUBLIC_KEY: publicKey }, {
    waitUntil(promise) { pending.push(promise) },
  })
  return { response, body: await response.json(), pending }
}

const storm = await invoke({
  name: 'storm',
  options: [
    { name: 'zone', value: 7 },
    { name: 'phase', value: 'closing' },
    { name: 'time', value: 30 },
    { name: 'damage', value: 550 },
    { name: 'mode', value: 'battleRoyale' },
  ],
})
assert.equal(storm.response.status, 200)
assert.equal(storm.body.type, 4)
assert.equal(storm.body.data.flags, 64)
assert.equal(storm.body.data.allowed_mentions.parse.length, 0)
assert.equal(storm.body.data.embeds[0].title, '⚡ STORM READ // ROTATE WINDOW')
assert(storm.body.data.embeds[0].description.includes('ROTATE SOON'))
assert.equal(storm.pending.length, 0)

const points = await invoke({
  name: 'points',
  options: [
    { name: 'mode', value: 'manual' },
    { name: 'games', value: 11 },
    { name: 'current', value: 0 },
    { name: 'target', value: 300 },
  ],
})
assert.equal(points.response.status, 200)
assert.equal(points.body.type, 4)
assert.equal(points.body.data.flags, 64)
assert.equal(points.body.data.allowed_mentions.parse.length, 0)
assert.equal(points.body.data.embeds[0].title, '🏆 POINTS READ // QUALIFICATION RACE')
assert(points.body.data.embeds[0].description.includes('CHASE THE RACE LINE'))
assert.equal(points.pending.length, 0)

const liveFetch = globalThis.fetch
const liveCalls = []
globalThis.fetch = async (url, options = {}) => {
  liveCalls.push({ url: String(url), options })
  if (String(url).startsWith(WINDOWS_API)) {
    return new Response(JSON.stringify({
      region: 'EU',
      windows: [{
        live: true,
        name: 'Fixture Cup',
        roundType: 'Qualifiers',
        eventId: 'fixture-event-EU',
        windowId: 'fixture-window-EU',
        format: 'qualification',
        threshold: { type: 'rank', label: 'Top 500 advance', cutoffPoints: 200 },
      }],
    }), { status: 200, headers: { 'content-type': 'application/json' } })
  }
  if (String(url).startsWith(STANDING_API)) {
    assert(String(url).includes('eventId=fixture-event-EU'))
    assert(String(url).includes('windowId=fixture-window-EU'))
    assert(String(url).includes('region=EU'))
    return new Response(JSON.stringify({ found: true, points: 120, rank: 700, games: 4 }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }
  return new Response(null, { status: 204 })
}

try {
  const liveOptions = {
    name: 'points',
    options: [
      { name: 'mode', value: 'live' },
      { name: 'games', value: 3 },
      { name: 'ign', value: 'Exact Fixture Name' },
      { name: 'region', value: 'EU' },
      { name: 'tournament', value: 'Fixture Cup' },
    ],
  }
  const live = await invoke(liveOptions, 'fixture-user')
  assert.equal(live.response.status, 200)
  assert.equal(live.body.type, 5)
  assert.equal(live.body.data.flags, 64)
  assert.equal(live.pending.length, 1)
  await Promise.all(live.pending)
  assert.equal(liveCalls.length, 3)
  assert(liveCalls[0].url.startsWith(WINDOWS_API))
  assert(liveCalls[1].url.includes('eventId=fixture-event-EU'))
  assert(liveCalls[1].url.includes('windowId=fixture-window-EU'))
  const followup = liveCalls[2]
  assert(followup.url.includes('/webhooks/'))
  const followupBody = JSON.parse(followup.options.body)
  assert.equal(followupBody.embeds[0].title, '🏆 POINTS READ // LIVE QUALIFICATION')
  assert.equal(followupBody.allowed_mentions.parse.length, 0)

  const throttled = await invoke(liveOptions, 'fixture-user')
  assert.equal(throttled.response.status, 200)
  assert.equal(throttled.body.type, 5)
  assert.equal(throttled.body.data.flags, 64)
  await Promise.all(throttled.pending)
  assert.equal(liveCalls.length, 4)
  const throttleFollowup = JSON.parse(liveCalls[3].options.body)
  assert(throttleFollowup.content.includes('one lookup every 30 seconds'))
  assert.equal(throttleFollowup.allowed_mentions.parse.length, 0)
} finally {
  globalThis.fetch = liveFetch
}

const invalid = await invoke({
  name: 'storm',
  options: [
    { name: 'zone', value: 13 },
    { name: 'phase', value: 'closing' },
    { name: 'time', value: 30 },
    { name: 'damage', value: 0 },
  ],
})
assert.equal(invalid.body.type, 4)
assert.equal(invalid.body.data.flags, 64)
assert(invalid.body.data.content.includes('Choose a zone from 1 to 12'))
assert.equal(invalid.pending.length, 0)

console.log('worker interaction fixture: signed private routes passed')
