import assert from 'node:assert/strict'
import {
  REGIONS,
  STANDING_API,
  WINDOWS_API,
  loadLiveWindows,
  loadLivePoints,
  normalizeRegion,
  selectLiveWindow,
} from '../tickets-worker/points-live.js'

const accountId = '0123456789abcdef0123456789abcdef'
const prizeLadder = [
  { minRank: 1, maxRank: 1, rewardLabel: 'USD 1,000', verified: true, livePointsAtBoundary: 300 },
  { minRank: 2, maxRank: 5, rewardLabel: '$500', verified: true, livePointsAtBoundary: 240 },
  { minRank: 6, maxRank: 25, rewardLabel: '$250', verified: true, livePointsAtBoundary: 180 },
  { minRank: 26, maxRank: 100, rewardLabel: '$100', verified: true, livePointsAtBoundary: 150 },
  { minRank: 101, maxRank: 500, rewardLabel: '$50', verified: true, livePointsAtBoundary: 120 },
]

const qualificationWindow = {
  live: true,
  region: 'EU',
  name: 'CrashBandicootCup ZB',
  roundType: 'Qualifiers',
  format: 'qualification',
  eventId: 'epicgames_S42_CrashBandicootCup_ZB_EU',
  windowId: 'S42_CrashBandicootCup_ZB_EU',
  threshold: { type: 'rank', label: 'Top 500 advance', cutoffPoints: 160 },
}

const finalsWindow = {
  live: true,
  region: 'EU',
  name: 'CrashBandicootCup Finals',
  roundType: 'Finals',
  format: 'final',
  eventId: 'epicgames_S42_CrashBandicootCup_Finals_EU',
  windowId: 'S42_CrashBandicootCup_Finals_EU',
  threshold: { type: 'final', label: 'Finals - place for prizes (no qualification)' },
  prizeLadder,
}

const response = (payload, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  async json() { return payload },
})

const calls = []
const fetchImpl = async url => {
  calls.push(String(url))
  if (String(url).startsWith(WINDOWS_API)) return response({ region: 'EU', windows: [qualificationWindow, finalsWindow], fetched: '2026-08-29T18:00:00.000Z' })
  if (String(url).startsWith(STANDING_API)) {
    const query = new URL(url).searchParams
    if (query.get('eventId') === qualificationWindow.eventId) {
      return response({
        found: true,
        ign: 'Exact Epic Name',
        accountId,
        region: 'EU',
        name: qualificationWindow.name,
        roundType: 'Qualifiers',
        points: 120,
        rank: 700,
        games: 4,
        gamesLeft: 3,
        beginTime: '2026-08-29T17:00:00.000Z',
        endTime: '2026-08-29T21:00:00.000Z',
      })
    }
    return response({
      found: true,
      accountId,
      region: 'EU',
      name: finalsWindow.name,
      roundType: 'Finals',
      format: 'final',
      points: 90,
      rank: 700,
      games: 4,
      gamesLeft: 3,
      prizeLadder,
      prizeLadderVerified: true,
      boundaryFetchedAt: '2026-08-29T18:00:03.000Z',
      beginTime: '2026-08-29T17:00:00.000Z',
      endTime: '2026-08-29T21:00:00.000Z',
    })
  }
  throw new Error(`unexpected URL ${url}`)
}

const live = await loadLivePoints({
  ign: 'Exact Epic Name',
  region: 'EU',
  tournament: 'CrashBandicootCup ZB',
  games: 3,
  buffer: 10,
}, { fetchImpl })
assert.equal(live.ok, true, live.error)
assert.equal(live.source, 'live')
assert.equal(live.format, 'qualification')
assert.equal(live.currentPoints, 120)
assert.equal(live.targetPoints, 160)
assert.equal(live.targetWithBuffer, 170)
assert.equal(live.requiredPerGame, 50 / 3)
assert.equal(live.rank, 700)
assert.equal(live.gamesPlayed, 4)
assert.equal(live.eventId, qualificationWindow.eventId)
assert.equal(live.windowId, qualificationWindow.windowId)
assert.equal(calls.length, 2)
assert(calls[0].includes('region=EU'))
assert(calls[1].includes(`eventId=${encodeURIComponent(qualificationWindow.eventId)}`))
assert(calls[1].includes(`windowId=${encodeURIComponent(qualificationWindow.windowId)}`))
assert(calls[1].includes('region=EU'))
assert(calls[1].includes('ign=Exact+Epic+Name'))

const final = await loadLivePoints({
  ign: 'console-only-alias',
  accountId: accountId.toUpperCase(),
  region: 'EU',
  tournament: 'CrashBandicootCup Finals',
  games: 99,
}, { fetchImpl })
assert.equal(final.ok, true, final.error)
assert.equal(final.source, 'live')
assert.equal(final.format, 'final')
assert.equal(final.raceType, 'final')
assert.equal(final.currentPoints, 90)
assert.equal(final.rank, 700)
assert.equal(final.gamesLeft, 3)
assert.equal(final.currentTier, null)
assert.equal(final.targetTier.maxRank, 500)
assert.equal(final.targetPoints, 120)
assert.equal(final.pointsToTarget, 30)
assert.equal(final.requiredPerGame, 10)
assert.equal(final.prizeLadderVerified, true)
assert.equal(final.boundaryFetchedAt, '2026-08-29T18:00:03.000Z')
assert(calls[3].includes(`accountId=${accountId}`))
assert(calls[3].includes('region=EU'))
assert(!calls[3].includes('ign='))

assert.equal(selectLiveWindow([qualificationWindow], '').windowId, qualificationWindow.windowId)
assert.equal(selectLiveWindow([qualificationWindow, finalsWindow], 'CrashBandicootCup Finals').windowId, finalsWindow.windowId)
assert.throws(
  () => selectLiveWindow([qualificationWindow, finalsWindow], ''),
  error => error.code === 'ambiguousWindow',
)
const liveWindows = await loadLiveWindows('EU', { fetchImpl })
assert.deepEqual(liveWindows.windows.map(window => window.windowId), [qualificationWindow.windowId, finalsWindow.windowId])
assert.equal(liveWindows.fetched, '2026-08-29T18:00:00.000Z')
const exactWindowOnly = await loadLivePoints({
  ign: 'Exact Epic Name',
  region: 'EU',
  windowId: qualificationWindow.windowId,
  games: 3,
}, { fetchImpl })
assert.equal(exactWindowOnly.ok, true, exactWindowOnly.error)
assert.equal(exactWindowOnly.eventId, qualificationWindow.eventId)
assert.equal(normalizeRegion('all'), 'ALL')
assert.deepEqual(REGIONS, ['NAC', 'EU', 'NAW', 'BR', 'ASIA', 'OCE', 'ME'])

const noLive = await loadLivePoints({ ign: 'Player', region: 'EU', games: 1 }, {
  fetchImpl: async url => String(url).startsWith(WINDOWS_API) ? response({ windows: [] }) : response({ found: true }),
})
assert.equal(noLive.ok, false)
assert.equal(noLive.code, 'noLiveWindow')

const missingCutoff = await loadLivePoints({ ign: 'Player', region: 'EU', tournament: 'CrashBandicootCup ZB' }, {
  fetchImpl: async url => String(url).startsWith(WINDOWS_API)
    ? response({ windows: [{ ...qualificationWindow, threshold: { type: 'rank', label: 'Top 500 advance' } }] })
    : response({ found: true, points: 120, rank: 700, games: 4, gamesLeft: 3 }),
})
assert.equal(missingCutoff.ok, false)
assert.equal(missingCutoff.code, 'missingCutoff')

const scoreMissing = await loadLivePoints({ ign: 'Player', region: 'EU', tournament: 'CrashBandicootCup ZB', games: 1 }, {
  fetchImpl: async url => String(url).startsWith(WINDOWS_API)
    ? response({ windows: [qualificationWindow] })
    : response({ found: false, note: 'Player is not on this leaderboard yet.' }),
})
assert.equal(scoreMissing.ok, false)
assert.equal(scoreMissing.code, 'scoreNotFound')
assert(scoreMissing.error.includes('not on this leaderboard'))

const upstreamFailure = await loadLivePoints({ ign: 'Player', region: 'EU', tournament: 'CrashBandicootCup', games: 1 }, {
  fetchImpl: async () => { throw new Error('offline') },
})
assert.equal(upstreamFailure.ok, false)
assert.equal(upstreamFailure.code, 'upstreamError')

await assert.rejects(
  () => loadLiveWindows('EU', {
    fetchImpl: async () => response({ error: 'legacy raw feed detail should stay private' }, 404),
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
assert.equal(clientErrorAttempts, 1)

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

const failedSelectedRegion = await loadLivePoints({ ign: 'Player', region: 'EU', tournament: 'CrashBandicootCup ZB', games: 1 }, {
  fetchImpl: async url => String(url).startsWith(WINDOWS_API)
    ? response({ windows: [qualificationWindow], regionsFailed: ['EU'], partial: true })
    : response({ found: true, points: 120, rank: 700, games: 4, gamesLeft: 3 }),
})
assert.equal(failedSelectedRegion.ok, false)
assert.equal(failedSelectedRegion.code, 'upstreamError')
assert(failedSelectedRegion.error.includes('unavailable for that region'))

const partialAllRegions = await loadLivePoints({ ign: 'Player', region: 'ALL', tournament: 'CrashBandicootCup ZB', games: 1 }, {
  fetchImpl: async url => String(url).startsWith(WINDOWS_API)
    ? response({ windows: [qualificationWindow], regionsFailed: ['NAC'], partial: true })
    : response({ found: true, ign: 'Player', accountId, region: 'EU', name: qualificationWindow.name, roundType: 'Qualifiers', points: 120, rank: 700, games: 4, gamesLeft: 3, threshold: qualificationWindow.threshold, cutoffPoints: 160 }),
})
assert.equal(partialAllRegions.ok, true, partialAllRegions.error)
assert.equal(partialAllRegions.region, 'EU')

const failedAllRegions = await loadLivePoints({ ign: 'Player', region: 'ALL', tournament: 'CrashBandicootCup ZB', games: 1 }, {
  fetchImpl: async url => String(url).startsWith(WINDOWS_API)
    ? response({ windows: [qualificationWindow], regionsFailed: REGIONS, partial: true })
    : response({ found: true }),
})
assert.equal(failedAllRegions.ok, false)
assert.equal(failedAllRegions.code, 'upstreamError')
assert(failedAllRegions.error.includes('unavailable for every region'))

assert.equal((await loadLivePoints({ region: 'EU', games: 1 })).code, 'missingIgn')
assert.equal((await loadLivePoints({ ign: 'Player', region: 'NAE', games: 1 })).code, 'invalidRegion')
assert.equal((await loadLivePoints({ ign: 'Player', accountId: 'not-an-id', region: 'EU', games: 1 })).code, 'invalidAccountId')

console.log('live points fixture: exact-window, finals prize-race, account-id, and failure-path checks passed')
