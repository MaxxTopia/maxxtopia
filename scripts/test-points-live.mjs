import assert from 'node:assert/strict'
import { CUTOFF_API, SCORE_API, loadLivePoints, selectLiveWindow } from '../tickets-worker/points-live.js'

const liveWindows = [
  {
    live: true,
    name: 'CrashBandicootCup',
    roundType: 'Qualifiers',
    eventId: 'epicgames_S42_CrashBandicootCup_EU',
    windowId: 'S42_CrashBandicootCup_EU',
    threshold: { type: 'rank', label: 'Top 500 advance', cutoffPoints: 156 },
  },
  {
    live: true,
    name: 'CrashBandicootCup ZB',
    roundType: 'Qualifiers',
    eventId: 'epicgames_S42_CrashBandicootCup_ZB_EU',
    windowId: 'S42_CrashBandicootCup_ZB_EU',
    threshold: { type: 'rank', label: 'Top 500 advance', cutoffPoints: 160 },
  },
  {
    live: false,
    name: 'Finished cup',
    eventId: 'finished-event',
    windowId: 'finished-window',
    threshold: { type: 'rank', label: 'Top 500 advance', cutoffPoints: 200 },
  },
]

const response = (payload, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  async json() { return payload },
})

const calls = []
const fetchImpl = async url => {
  calls.push(String(url))
  if (String(url).startsWith(CUTOFF_API)) return response({ region: 'EU', windows: liveWindows })
  if (String(url).startsWith(SCORE_API)) return response({ found: true, points: 120, rank: 700, games: 4 })
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
assert.equal(live.currentPoints, 120)
assert.equal(live.targetPoints, 160)
assert.equal(live.targetWithBuffer, 170)
assert.equal(live.requiredPerGame, 50 / 3)
assert.equal(live.rank, 700)
assert.equal(live.gamesPlayed, 4)
assert.equal(live.eventId, 'epicgames_S42_CrashBandicootCup_ZB_EU')
assert.equal(live.windowId, 'S42_CrashBandicootCup_ZB_EU')
assert.equal(calls.length, 2)
assert(calls[0].includes('region=EU'))
assert(calls[1].includes('eventId=epicgames_S42_CrashBandicootCup_ZB_EU'))
assert(calls[1].includes('windowId=S42_CrashBandicootCup_ZB_EU'))
assert(calls[1].includes('ign=Exact%20Epic%20Name'))

assert.equal(selectLiveWindow(liveWindows, 'CrashBandicootCup ZB').windowId, 'S42_CrashBandicootCup_ZB_EU')
assert.equal(selectLiveWindow(liveWindows, 'CrashBandicootCup').windowId, 'S42_CrashBandicootCup_EU')
assert.throws(
  () => selectLiveWindow(liveWindows, ''),
  error => error.code === 'ambiguousWindow',
)

const noLive = await loadLivePoints({ ign: 'Player', region: 'EU', games: 1 }, {
  fetchImpl: async () => response({ windows: [] }),
})
assert.equal(noLive.ok, false)
assert.equal(noLive.code, 'noLiveWindow')

const missingCutoff = await loadLivePoints({ ign: 'Player', region: 'EU', tournament: 'CrashBandicootCup' }, {
  fetchImpl: async () => response({ windows: [{ ...liveWindows[0], threshold: { label: 'Top 500 advance' } }] }),
})
assert.equal(missingCutoff.ok, false)
assert.equal(missingCutoff.code, 'missingCutoff')

const scoreMissing = await loadLivePoints({ ign: 'Player', region: 'EU', tournament: 'CrashBandicootCup', games: 1 }, {
  fetchImpl: async url => String(url).startsWith(CUTOFF_API)
    ? response({ windows: [liveWindows[0]] })
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

assert.equal((await loadLivePoints({ region: 'EU', games: 1 })).code, 'missingIgn')
assert.equal((await loadLivePoints({ ign: 'Player', region: 'NAE', games: 1 })).code, 'invalidRegion')

console.log('live points fixture: exact-window and failure-path checks passed')
