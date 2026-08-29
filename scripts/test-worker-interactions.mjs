import assert from 'node:assert/strict'
import { webcrypto } from 'node:crypto'
import worker from '../tickets-worker/worker.js'
import { STANDING_API, WINDOWS_API } from '../tickets-worker/points-live.js'
import { PANEL_IDS, PANEL_SIGNATURE, buildFreeToolsPanel } from '../tickets-worker/panel.js'

if (!globalThis.crypto) globalThis.crypto = webcrypto

const encoder = new TextEncoder()
const toHex = bytes => Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('')

const keyPair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])
const publicKey = toHex(await crypto.subtle.exportKey('raw', keyPair.publicKey))

let interactionCounter = 0

async function invoke(data, userId = null, roles = [], type = 2) {
  interactionCounter += 1
  const interaction = {
    type,
    data,
    application_id: 'fixture-application',
    token: `fixture-token-${interactionCounter}`,
  }
  if (userId || roles.length) interaction.member = { user: { id: userId }, roles }
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
  const response = await worker.fetch(request, {
    DISCORD_PUBLIC_KEY: publicKey,
    VIP_ROLE_ID: 'fixture-vip-role',
  }, {
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

const panel = buildFreeToolsPanel()
assert.equal(panel.components[0].components.length, 4)
assert(panel.embed.description.includes(PANEL_SIGNATURE))
assert(!panel.embed.description.includes('[maxx-panel:'))

const livePanel = await invoke({ custom_id: PANEL_IDS.livePoints }, 'panel-user', [], 3)
assert.equal(livePanel.response.status, 200)
assert.equal(livePanel.body.type, 4)
assert.equal(livePanel.body.data.flags, 64)
assert.equal(livePanel.body.data.allowed_mentions.parse.length, 0)
assert.equal(livePanel.body.data.components[0].components[0].custom_id, PANEL_IDS.liveRegion)
assert.equal(livePanel.body.data.components[0].components[0].options.length, 7)
assert(livePanel.body.data.embeds[0].description.includes('currently live Epic windows'))

const manualPanel = await invoke({ custom_id: PANEL_IDS.manualPoints }, 'panel-manual-user', [], 3)
assert.equal(manualPanel.body.type, 9)
assert.equal(manualPanel.body.data.custom_id, PANEL_IDS.manualSubmit)
assert.equal(manualPanel.body.data.components.length, 4)

const manualModal = await invoke({
  custom_id: PANEL_IDS.manualSubmit,
  components: [
    { type: 1, components: [{ type: 4, custom_id: 'current_points', value: '120' }] },
    { type: 1, components: [{ type: 4, custom_id: 'target_points', value: '200' }] },
    { type: 1, components: [{ type: 4, custom_id: 'games_left', value: '3' }] },
    { type: 1, components: [{ type: 4, custom_id: 'safety_cushion', value: '10' }] },
  ],
}, 'panel-manual-user', [], 5)
assert.equal(manualModal.body.type, 4)
assert.equal(manualModal.body.data.flags, 64)
assert.equal(manualModal.body.data.embeds[0].title, '🏆 POINTS READ // QUALIFICATION RACE')
assert.equal(manualModal.body.data.allowed_mentions.parse.length, 0)

const stormPanel = await invoke({ custom_id: PANEL_IDS.stormReload }, 'panel-storm-user', [], 3)
assert.equal(stormPanel.body.type, 9)
assert(stormPanel.body.data.custom_id.startsWith(PANEL_IDS.stormSubmitPrefix))
assert.equal(stormPanel.body.data.components.length, 5)

const stormModal = await invoke({
  custom_id: stormPanel.body.data.custom_id,
  components: [
    { type: 1, components: [{ type: 4, custom_id: 'zone', value: '7' }] },
    { type: 1, components: [{ type: 4, custom_id: 'phase', value: 'closing' }] },
    { type: 1, components: [{ type: 4, custom_id: 'time_left', value: '30' }] },
    { type: 1, components: [{ type: 4, custom_id: 'damage_taken', value: '550' }] },
    { type: 1, components: [{ type: 4, custom_id: 'dps_override', value: '' }] },
  ],
}, 'panel-storm-user', [], 5)
assert.equal(stormModal.body.type, 4)
assert.equal(stormModal.body.data.flags, 64)
assert.equal(stormModal.body.data.embeds[0].title, '⚡ STORM READ // ROTATE WINDOW')
assert.equal(stormModal.body.data.allowed_mentions.parse.length, 0)

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

  const vipUserOptions = {
    ...liveOptions,
    options: liveOptions.options.map(option => option.name === 'ign'
      ? { ...option, value: 'VIP Fixture Name' }
      : option),
  }
  const vip = await invoke(vipUserOptions, 'vip-fixture-user', ['fixture-vip-role'])
  assert.equal(vip.response.status, 200)
  await Promise.all(vip.pending)
  const callsAfterVip = liveCalls.length
  assert.equal(callsAfterVip, 7)

  const vipThrottled = await invoke(vipUserOptions, 'vip-fixture-user', ['fixture-vip-role'])
  assert.equal(vipThrottled.response.status, 200)
  await Promise.all(vipThrottled.pending)
  assert.equal(liveCalls.length, callsAfterVip + 1)
  const vipThrottleFollowup = JSON.parse(liveCalls.at(-1).options.body)
  assert(vipThrottleFollowup.content.includes('one lookup every 5 seconds'))
  assert.equal(vipThrottleFollowup.allowed_mentions.parse.length, 0)

  const panelRegionStart = liveCalls.length
  const regionSelect = await invoke({ custom_id: PANEL_IDS.liveRegion, values: ['EU'] }, 'panel-region-user', [], 3)
  assert.equal(regionSelect.response.status, 200)
  assert.equal(regionSelect.body.type, 5)
  assert.equal(regionSelect.body.data.flags, 64)
  assert.equal(regionSelect.pending.length, 1)
  await Promise.all(regionSelect.pending)
  assert.equal(liveCalls.length, panelRegionStart + 2)
  const regionFollowup = JSON.parse(liveCalls.at(-1).options.body)
  assert.equal(regionFollowup.embeds[0].title, '🏆 LIVE WINDOWS // EU')
  const tournamentPicker = regionFollowup.components[0].components[0]
  assert.equal(tournamentPicker.options.length, 1)
  assert(tournamentPicker.options[0].label.includes('QUALIFIERS'))
  assert(tournamentPicker.options[0].description.includes('EU'))

  const regionRefresh = await invoke({ custom_id: PANEL_IDS.liveRegion, values: ['EU'] }, 'panel-region-user', [], 3)
  assert.equal(regionRefresh.body.type, 5)
  await Promise.all(regionRefresh.pending)
  assert.equal(liveCalls.length, panelRegionStart + 3)
  const regionThrottleFollowup = JSON.parse(liveCalls.at(-1).options.body)
  assert(regionThrottleFollowup.content.includes('one refresh every 5 seconds'))
  assert.equal(regionThrottleFollowup.allowed_mentions.parse.length, 0)

  const windowSelect = await invoke({
    custom_id: tournamentPicker.custom_id,
    values: [tournamentPicker.options[0].value],
  }, 'panel-window-user', [], 3)
  assert.equal(windowSelect.body.type, 9)
  assert(windowSelect.body.data.custom_id.startsWith(PANEL_IDS.liveSubmitPrefix))
  assert.equal(windowSelect.body.data.components.length, 3)

  const panelLookupStart = liveCalls.length
  const panelLive = await invoke({
    custom_id: windowSelect.body.data.custom_id,
    components: [
      { type: 1, components: [{ type: 4, custom_id: 'epic_identity', value: 'Exact Fixture Name' }] },
      { type: 1, components: [{ type: 4, custom_id: 'games_left', value: '3' }] },
      { type: 1, components: [{ type: 4, custom_id: 'safety_cushion', value: '10' }] },
    ],
  }, 'panel-live-user', [], 5)
  assert.equal(panelLive.response.status, 200)
  assert.equal(panelLive.body.type, 5)
  assert.equal(panelLive.body.data.flags, 64)
  assert.equal(panelLive.pending.length, 1)
  await Promise.all(panelLive.pending)
  assert.equal(liveCalls.length, panelLookupStart + 3)
  assert(liveCalls[panelLookupStart].url.startsWith(WINDOWS_API))
  assert(liveCalls[panelLookupStart + 1].url.includes('eventId=fixture-event-EU'))
  assert(liveCalls[panelLookupStart + 1].url.includes('windowId=fixture-window-EU'))
  const panelLiveFollowup = JSON.parse(liveCalls[panelLookupStart + 2].options.body)
  assert.equal(panelLiveFollowup.embeds[0].title, '🏆 POINTS READ // LIVE QUALIFICATION')
  assert.equal(panelLiveFollowup.allowed_mentions.parse.length, 0)
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
