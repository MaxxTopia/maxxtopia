import assert from 'node:assert/strict'
import { webcrypto } from 'node:crypto'
import worker from '../tickets-worker/worker.js'
import { STANDING_API, WINDOWS_API } from '../tickets-worker/points-live.js'
import {
  PANEL_IDS,
  PANEL_SIGNATURE,
  buildFreeToolsPanel,
  parseStormWizardCustomId,
} from '../tickets-worker/panel.js'
import { REVIEW_BUTTON_ID, REVIEW_MODAL_ID } from '../tickets-worker/reviews.js'

if (!globalThis.crypto) globalThis.crypto = webcrypto

const encoder = new TextEncoder()
const toHex = bytes => Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('')

const keyPair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])
const publicKey = toHex(await crypto.subtle.exportKey('raw', keyPair.publicKey))

let interactionCounter = 0

async function invoke(data, userId = null, roles = [], type = 2, channelId = null) {
  interactionCounter += 1
  const interaction = {
    type,
    data,
    application_id: 'fixture-application',
    token: `fixture-token-${interactionCounter}`,
    ...(channelId ? { channel_id: channelId } : {}),
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
    FEEDBACK_REVIEW_CHANNEL_ID: 'fixture-review-channel',
    FEEDBACK_CHANNEL_ID: 'fixture-feedback-forum',
    FEEDBACK_THREAD_ID: 'fixture-feedback-thread',
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
assert.equal(panel.components[0].components.length, 3)
assert(panel.embed.description.includes(PANEL_SIGNATURE))
assert(!panel.embed.description.includes('[maxx-panel:'))
assert(!panel.embed.fields.some(field => field.name.includes('MANUAL')))

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
assert.equal(stormPanel.body.type, 4)
assert.equal(stormPanel.body.data.flags, 64)
assert.equal(stormPanel.body.data.components.length, 5)
assert.equal(stormPanel.body.data.components.slice(0, 4).every(component => component.components[0].type === 3), true)
assert.equal(stormPanel.body.data.components[4].components[0].disabled, true)

let stormWizard = stormPanel.body.data
for (const [index, value] of [[0, '7'], [1, 'c'], [2, '30'], [3, '500']]) {
  const picker = stormWizard.components[index].components[0]
  const parsed = parseStormWizardCustomId(picker.custom_id)
  assert(parsed)
  assert.equal(parsed.action, ['zone', 'phase', 'time', 'damage'][index])
  const step = await invoke({ custom_id: picker.custom_id, values: [value] }, 'panel-storm-user', [], 3)
  assert.equal(step.body.type, 7)
  assert.equal(step.body.data.flags, 64)
  stormWizard = step.body.data
}

assert.equal(stormWizard.components[4].components[0].disabled, undefined)
const stormSubmitId = stormWizard.components[4].components[0].custom_id
const stormCleanupFetch = globalThis.fetch
const stormCleanupCalls = []
globalThis.fetch = async (url, options = {}) => {
  stormCleanupCalls.push({ url: String(url), options })
  return new Response(null, { status: 204 })
}
const stormWizardResult = await invoke({ custom_id: stormSubmitId }, 'panel-storm-user', [], 3)
await Promise.all(stormWizardResult.pending)
globalThis.fetch = stormCleanupFetch
assert.equal(stormWizardResult.body.type, 4)
assert.equal(stormWizardResult.body.data.flags, 64)
assert.equal(stormWizardResult.body.data.embeds[0].title, '⚡ STORM READ // ROTATE WINDOW')
assert.equal(stormWizardResult.body.data.allowed_mentions.parse.length, 0)
assert.equal(stormCleanupCalls.length, 1)
assert.equal(stormCleanupCalls[0].options.method, 'DELETE')

const reviewCommand = await invoke({ name: 'review' }, 'review-command-user', [], 2, 'fixture-review-channel')
assert.equal(reviewCommand.response.status, 200)
assert.equal(reviewCommand.body.type, 9)
assert.equal(reviewCommand.body.data.custom_id, REVIEW_MODAL_ID)
assert.equal(reviewCommand.body.data.components.length, 3)

const reviewButton = await invoke({ custom_id: REVIEW_BUTTON_ID }, 'review-button-user', [], 3, 'fixture-review-channel')
assert.equal(reviewButton.response.status, 200)
assert.equal(reviewButton.body.type, 9)
assert.equal(reviewButton.body.data.custom_id, REVIEW_MODAL_ID)
assert.equal(reviewButton.body.data.components.length, 3)

const reviewCalls = []
const reviewFetch = globalThis.fetch
globalThis.fetch = async (url, options = {}) => {
  reviewCalls.push({ url: String(url), options })
  if (String(url).endsWith('/channels/fixture-review-channel')) {
    return new Response(JSON.stringify({ id: 'fixture-review-channel', type: 0 }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }
  if (String(url).endsWith('/channels/fixture-review-channel/messages')) {
    return new Response(JSON.stringify({ id: 'fixture-review-message' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }
  return new Response(null, { status: 204 })
}
try {
  const reviewSubmit = await invoke({
    custom_id: REVIEW_MODAL_ID,
    components: [
      { type: 1, components: [{ type: 4, custom_id: 'rating', value: '5' }] },
      { type: 1, components: [{ type: 4, custom_id: 'product', value: 'Optimizationmaxxing' }] },
      { type: 1, components: [{ type: 4, custom_id: 'comment', value: 'Fast and useful.' }] },
    ],
  }, 'review-submit-user', [], 5, 'fixture-review-channel')
  assert.equal(reviewSubmit.response.status, 200)
  assert.equal(reviewSubmit.body.type, 5)
  await Promise.all(reviewSubmit.pending)
  const reviewMessageCall = reviewCalls.find(call => call.options.method === 'POST' && call.url.endsWith('/channels/fixture-review-channel/messages'))
  assert(reviewMessageCall)
  const reviewMessageBody = JSON.parse(reviewMessageCall.options.body)
  assert.equal(reviewMessageBody.flags, 4096)
  assert.equal(reviewMessageBody.allowed_mentions.parse.length, 0)
  assert.equal(reviewMessageBody.embeds[0].fields[0].name, 'Review by:')
  assert(reviewCalls.some(call => call.options.method === 'PUT' && call.url.includes('/reactions/')))
} finally {
  globalThis.fetch = reviewFetch
}

const liveFetch = globalThis.fetch
const liveCalls = []
globalThis.fetch = async (url, options = {}) => {
  liveCalls.push({ url: String(url), options })
  if (String(url).startsWith(WINDOWS_API)) {
    if (String(url).includes('region=NAW')) {
      return new Response(JSON.stringify({ error: 'legacy upstream detail' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      })
    }
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
  assert.equal(throttled.pending.length, 2)
  assert.equal(liveCalls.length, 5)
  const throttleFollowupCall = liveCalls.findLast(call => call.options.method !== 'DELETE' && String(call.url).includes('/webhooks/'))
  const throttleFollowup = JSON.parse(throttleFollowupCall.options.body)
  assert(throttleFollowup.content.includes('one lookup every 30 seconds'))
  assert.equal(throttleFollowup.allowed_mentions.parse.length, 0)
  assert(liveCalls.some(call => call.options.method === 'DELETE'))

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
  assert.equal(callsAfterVip, 8)

  const vipThrottled = await invoke(vipUserOptions, 'vip-fixture-user', ['fixture-vip-role'])
  assert.equal(vipThrottled.response.status, 200)
  await Promise.all(vipThrottled.pending)
  assert.equal(vipThrottled.pending.length, 2)
  assert.equal(liveCalls.length, callsAfterVip + 2)
  const vipThrottleCall = liveCalls.findLast(call => call.options.method !== 'DELETE' && String(call.url).includes('/webhooks/'))
  const vipThrottleFollowup = JSON.parse(vipThrottleCall.options.body)
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
  assert.equal(regionRefresh.pending.length, 2)
  assert.equal(liveCalls.length, panelRegionStart + 4)
  const regionThrottleCall = liveCalls.findLast(call => call.options.method !== 'DELETE' && String(call.url).includes('/webhooks/'))
  const regionThrottleFollowup = JSON.parse(regionThrottleCall.options.body)
  assert(regionThrottleFollowup.content.includes('one refresh every 5 seconds'))
  assert.equal(regionThrottleFollowup.allowed_mentions.parse.length, 0)

  const unavailableStart = liveCalls.length
  const unavailable = await invoke({ custom_id: PANEL_IDS.liveRegion, values: ['NAW'] }, 'panel-error-user', [], 3)
  assert.equal(unavailable.body.type, 5)
  await Promise.all(unavailable.pending)
  assert.equal(liveCalls.length, unavailableStart + 2)
  const unavailableCall = liveCalls.findLast(call => call.options.method !== 'DELETE' && String(call.url).includes('/webhooks/'))
  const unavailableBody = JSON.parse(unavailableCall.options.body)
  assert.equal(unavailableBody.embeds[0].title, '⏳ LIVE LIST // TRY AGAIN')
  assert(unavailableBody.embeds[0].description.includes('taking a moment'))
  assert(!JSON.stringify(unavailableBody).includes('HTTP 404'))

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
