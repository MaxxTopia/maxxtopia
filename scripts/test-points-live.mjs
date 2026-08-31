import assert from 'node:assert/strict'
import {
  CUTOFF_API,
  QUALIFY_API,
  REGIONS,
  SCORE_API,
  STANDING_API,
  TOURNAMENTS_API,
  WINDOWS_API,
  loadLiveWindows,
  loadLivePoints,
  normalizeRegion,
  selectLiveWindow,
} from '../tickets-worker/points-live.js'
import { formatPointsDiscord, formatPointsEmbed } from '../tickets-worker/points-calculator.js'

const accountId = '0123456789abcdef0123456789abcdef'
const qualificationWindow = {
  live: true,
  region: 'EU',
  name: 'CrashBandicootCup ZB',
  roundType: 'Qualifiers',
  eventId: 'epicgames_S42_CrashBandicootCup_ZB_EU',
  windowId: 'S42_CrashBandicootCup_ZB_EU',
  threshold: { type: 'rank', rank: 500, label: 'Top 500 advance' },
}
const finalsWindow = {
  live: true,
  region: 'EU',
  name: 'CrashBandicootCup Finals',
  roundType: 'Finals',
  eventId: 'epicgames_S42_CrashBandicootCup_Finals_EU',
  windowId: 'S42_CrashBandicootCup_Finals_EU',
  threshold: { type: 'final', label: 'Finals - place for prizes (no qualification)' },
}
const unsupportedWindow = {
  ...qualificationWindow,
  name: 'Unsupported Session',
  eventId: 'epicgames_unsupported',
  windowId: 'unsupported',
  threshold: { type: 'none' },
}

const response = (payload, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  async json() { return payload },
})

function modernFixtureFetch(callLog = []) {
  return async (url, options = {}) => {
    const value = String(url)
    callLog.push({ url: value, options })
    if (value.startsWith(TOURNAMENTS_API)) {
      return response({
        region: 'EU',
        windows: [qualificationWindow, finalsWindow, unsupportedWindow],
        fetched: '2026-08-31T18:00:00.000Z',
      })
    }
    if (value.startsWith(SCORE_API)) {
      const query = new URL(value).searchParams
      assert.equal(query.get('ign'), 'Exact Epic Name')
      assert.equal(query.get('region'), 'EU')
      return response({
        found: true,
        ign: 'Exact Epic Name',
        accountId,
        points: 120,
        rank: 700,
        games: 4,
      })
    }
    if (value === QUALIFY_API) {
      assert.equal(options.method, 'POST')
      const body = JSON.parse(options.body)
      assert.deepEqual(body.accountIds, [accountId])
      const isFinal = body.eventId === finalsWindow.eventId
      return response({
        eventId: body.eventId,
        windowId: body.windowId,
        region: 'EU',
        roundType: isFinal ? 'Finals' : 'Qualifiers',
        beginTime: '2026-08-31T17:00:00.000Z',
        endTime: '2026-08-31T21:00:00.000Z',
        threshold: isFinal ? finalsWindow.threshold : qualificationWindow.threshold,
        standings: {
          [accountId]: isFinal
            ? { points: 90, rank: 700, games: 4, gamesLeft: 3 }
            : { points: 120, rank: 700, games: 4, gamesLeft: 3 },
        },
      })
    }
    if (value.startsWith(CUTOFF_API)) {
      return response({
        region: 'EU',
        fetched: '2026-08-31T18:00:03.000Z',
        windows: [{
          ...qualificationWindow,
          threshold: { ...qualificationWindow.threshold, cutoffPoints: 160 },
        }],
      })
    }
    throw new Error(`unexpected URL ${value}`)
  }
}

const calls = []
const live = await loadLivePoints({
  ign: 'Exact Epic Name',
  region: 'EU',
  tournament: qualificationWindow.name,
  games: 9,
  buffer: 10,
}, { fetchImpl: modernFixtureFetch(calls) })
assert.equal(live.ok, true, live.error)
assert.equal(live.source, 'live')
assert.equal(live.format, 'qualification')
assert.equal(live.currentPoints, 120)
assert.equal(live.targetPoints, 160)
assert.equal(live.targetWithBuffer, 170)
assert.equal(live.requiredPerGame, 50 / 3)
assert.equal(live.rank, 700)
assert.equal(live.gamesPlayed, 4)
assert.equal(live.gamesLeft, 3)
assert.equal(live.eventId, qualificationWindow.eventId)
assert.equal(live.windowId, qualificationWindow.windowId)
assert.equal(live.windowFetchedAt, '2026-08-31T18:00:03.000Z')
assert.deepEqual(calls.map(call => new URL(call.url).pathname), ['/tournaments', '/myscore', '/qualify', '/cutoffs'])

const finalCalls = []
const final = await loadLivePoints({
  accountId: accountId.toUpperCase(),
  region: 'EU',
  tournament: finalsWindow.name,
  games: 99,
}, { fetchImpl: modernFixtureFetch(finalCalls) })
assert.equal(final.ok, true, final.error)
assert.equal(final.source, 'live')
assert.equal(final.format, 'final')
assert.equal(final.raceType, 'final')
assert.equal(final.currentPoints, 90)
assert.equal(final.rank, 700)
assert.equal(final.gamesLeft, 3)
assert.equal(final.statusLabel, 'PRIZE INFO UNAVAILABLE')
assert.equal(final.currentTier, null)
assert.equal(final.targetTier, null)
assert.equal(final.targetPoints, null)
assert.equal(final.pointsToTarget, null)
assert.equal(final.requiredPerGame, null)
assert.equal(final.prizeLadderVerified, false)
assert.deepEqual(finalCalls.map(call => new URL(call.url).pathname), ['/tournaments', '/qualify'])
assert(formatPointsDiscord(final).includes('no payout ladder exposed'))
const finalEmbed = formatPointsEmbed(final)
assert(finalEmbed.fields.some(field => field.name === 'CURRENT PRIZE BAND' && field.value.includes('Unavailable')))
assert(!JSON.stringify(finalEmbed).includes('top band reached'))

assert.equal(selectLiveWindow([qualificationWindow], '').windowId, qualificationWindow.windowId)
assert.equal(selectLiveWindow([qualificationWindow, finalsWindow], finalsWindow.name).windowId, finalsWindow.windowId)
assert.throws(
  () => selectLiveWindow([qualificationWindow, finalsWindow], ''),
  error => error.code === 'ambiguousWindow',
)

const liveWindows = await loadLiveWindows('EU', { fetchImpl: modernFixtureFetch([]) })
assert.deepEqual(liveWindows.windows.map(window => window.windowId), [qualificationWindow.windowId, finalsWindow.windowId])
assert.equal(liveWindows.fetched, '2026-08-31T18:00:00.000Z')
assert.equal(liveWindows.contract, 'tournaments')

const exactWindowOnly = await loadLivePoints({
  ign: 'Exact Epic Name',
  region: 'EU',
  eventId: qualificationWindow.eventId,
  windowId: qualificationWindow.windowId,
  games: 3,
}, { fetchImpl: modernFixtureFetch([]) })
assert.equal(exactWindowOnly.ok, true, exactWindowOnly.error)
assert.equal(exactWindowOnly.eventId, qualificationWindow.eventId)
assert.equal(normalizeRegion('all'), 'ALL')
assert.deepEqual(REGIONS, ['NAC', 'EU', 'NAW', 'BR', 'ASIA', 'OCE', 'ME'])

// A retired modern route may fall back only to the legacy contract for the
// same exact event/window/region.
const legacyCalls = []
const legacyFetch = async (url, options = {}) => {
  const value = String(url)
  legacyCalls.push({ url: value, options })
  if (value.startsWith(TOURNAMENTS_API)) return response({ error: 'not found' }, 404)
  if (value.startsWith(WINDOWS_API)) {
    return response({
      region: 'EU',
      windows: [{ ...qualificationWindow, threshold: { ...qualificationWindow.threshold, cutoffPoints: 160 } }],
      fetched: 'legacy-feed',
    })
  }
  if (value.startsWith(SCORE_API) || value === QUALIFY_API || value.startsWith(CUTOFF_API)) {
    return response({ error: 'not found' }, 404)
  }
  if (value.startsWith(STANDING_API)) {
    return response({
      found: true,
      ign: 'Legacy Player',
      accountId,
      region: 'EU',
      points: 120,
      rank: 700,
      games: 4,
      gamesLeft: 3,
    })
  }
  throw new Error(`unexpected legacy URL ${value}`)
}
const legacyWindows = await loadLiveWindows('EU', { fetchImpl: legacyFetch })
assert.equal(legacyWindows.contract, 'windows')
const legacy = await loadLivePoints({
  ign: 'Legacy Player',
  region: 'EU',
  tournament: qualificationWindow.name,
  games: 3,
}, { fetchImpl: legacyFetch })
assert.equal(legacy.ok, true, legacy.error)
assert.equal(legacy.targetPoints, 160)
assert(legacyCalls.some(call => call.url.startsWith(STANDING_API)))

const noLive = await loadLivePoints({ ign: 'Player', region: 'EU', games: 1 }, {
  fetchImpl: async url => String(url).startsWith(TOURNAMENTS_API)
    ? response({ region: 'EU', windows: [unsupportedWindow] })
    : response({ error: 'not found' }, 404),
})
assert.equal(noLive.ok, false)
assert.equal(noLive.code, 'noLiveWindow')

const missingCutoff = await loadLivePoints({ ign: 'Player', region: 'EU', tournament: qualificationWindow.name }, {
  fetchImpl: async (url, options = {}) => {
    const value = String(url)
    if (value.startsWith(TOURNAMENTS_API)) return response({ region: 'EU', windows: [qualificationWindow] })
    if (value.startsWith(SCORE_API)) return response({ found: true, ign: 'Player', accountId, points: 120, rank: 700, games: 4 })
    if (value === QUALIFY_API) return response({ region: 'EU', threshold: qualificationWindow.threshold, standings: { [accountId]: { points: 120, rank: 700, games: 4, gamesLeft: 3 } } })
    if (value.startsWith(CUTOFF_API)) return response({ region: 'EU', windows: [] })
    throw new Error(`unexpected missing-cutoff URL ${value} ${options.method || 'GET'}`)
  },
})
assert.equal(missingCutoff.ok, false)
assert.equal(missingCutoff.code, 'missingCutoff')

const scoreMissing = await loadLivePoints({ ign: 'Player', region: 'EU', tournament: qualificationWindow.name, games: 1 }, {
  fetchImpl: async url => String(url).startsWith(TOURNAMENTS_API)
    ? response({ region: 'EU', windows: [qualificationWindow] })
    : response({ found: false, note: 'Player is not on this leaderboard yet.' }),
})
assert.equal(scoreMissing.ok, false)
assert.equal(scoreMissing.code, 'scoreNotFound')
assert(scoreMissing.error.includes('not on this leaderboard'))

const upstreamFailure = await loadLivePoints({ ign: 'Player', region: 'EU', tournament: qualificationWindow.name, games: 1 }, {
  fetchImpl: async () => { throw new Error('offline') },
  sleepImpl: async () => {},
})
assert.equal(upstreamFailure.ok, false)
assert(['upstreamError', 'liveFeedUnavailable'].includes(upstreamFailure.code))

await assert.rejects(
  () => loadLiveWindows('EU', {
    fetchImpl: async () => response({ error: 'not found' }, 404),
  }),
  error => {
    assert.equal(error.code, 'liveFeedUnavailable')
    assert.equal(error.message, 'The live tournament list is temporarily unavailable. Try again shortly.')
    assert(!error.message.includes('HTTP 404'))
    return true
  },
)

let clientErrorAttempts = 0
await assert.rejects(
  () => loadLiveWindows('EU', {
    fetchImpl: async () => {
      clientErrorAttempts += 1
      return response({ error: 'bad request detail should stay private' }, 400)
    },
    sleepImpl: async () => {},
  }),
  error => {
    assert.equal(error.code, 'liveFeedUnavailable')
    assert.equal(error.message, 'The live tournament list could not be loaded. Check your region and try again.')
    return true
  },
)
assert.equal(clientErrorAttempts, 2)

let retryAttempts = 0
const retriedWindows = await loadLiveWindows('EU', {
  fetchImpl: async () => {
    retryAttempts += 1
    return retryAttempts === 1
      ? response({ error: 'temporary upstream response' }, 503)
      : response({ region: 'EU', windows: [qualificationWindow], fetched: 'retry-success' })
  },
  sleepImpl: async () => {},
})
assert.equal(retryAttempts, 2)
assert.equal(retriedWindows.windows[0].windowId, qualificationWindow.windowId)

const failedSelectedRegion = await loadLivePoints({ ign: 'Player', region: 'EU', tournament: qualificationWindow.name, games: 1 }, {
  fetchImpl: async url => String(url).startsWith(TOURNAMENTS_API)
    ? response({ windows: [qualificationWindow], regionsFailed: ['EU'], partial: true })
    : response({ error: 'not found' }, 404),
})
assert.equal(failedSelectedRegion.ok, false)
assert.equal(failedSelectedRegion.code, 'upstreamError')
assert(failedSelectedRegion.error.includes('unavailable for that region'))

const failedAllRegions = await loadLivePoints({ ign: 'Player', region: 'ALL', tournament: qualificationWindow.name, games: 1 }, {
  fetchImpl: async url => (String(url).startsWith(TOURNAMENTS_API) || String(url).startsWith(WINDOWS_API))
    ? response({ windows: [qualificationWindow], regionsFailed: REGIONS, partial: true })
    : response({ found: true }),
})
assert.equal(failedAllRegions.ok, false)
assert.equal(failedAllRegions.code, 'upstreamError')
assert(failedAllRegions.error.includes('unavailable for every region'))

assert.equal((await loadLivePoints({ region: 'EU', games: 1 })).code, 'missingIgn')
assert.equal((await loadLivePoints({ ign: 'Player', region: 'NAE', games: 1 })).code, 'invalidRegion')
assert.equal((await loadLivePoints({ ign: 'Player', accountId: 'not-an-id', region: 'EU', games: 1 })).code, 'invalidAccountId')

console.log('live points fixture: modern routes, legacy fallback, exact identity, finals fail-closed, and failure paths passed')
