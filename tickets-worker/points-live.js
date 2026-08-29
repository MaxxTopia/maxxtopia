// Live Fortnite points lookup for Maxx Bot.
//
// The public snipemaxxer-brain routes are deliberately used as a narrow
// adapter: first select one exact live window, then ask for one exact Epic
// display name in that same event/window. If any part is missing or
// ambiguous, fail closed instead of choosing a nearby tournament or using an
// old estimate.

import { calculatePointsForecast } from './points-calculator.js'

const CUTOFF_API = 'https://snipemaxxer-brain.maxxtopia.workers.dev/cutoffs'
const SCORE_API = 'https://snipemaxxer-brain.maxxtopia.workers.dev/myscore'
const REQUEST_TIMEOUT_MS = 8_000
const REGIONS = Object.freeze(['NAC', 'EU', 'NAW', 'BR', 'ASIA', 'OCE', 'ME'])

class LivePointsError extends Error {
  constructor(message, code = 'liveUnavailable') {
    super(message)
    this.name = 'LivePointsError'
    this.code = code
  }
}

function normalizeRegion(value) {
  const region = String(value ?? '').trim().toUpperCase()
  return REGIONS.includes(region) ? region : null
}

function normalizedSearch(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function displayWindow(window) {
  const name = String(window?.name || 'Unnamed tournament').trim()
  const round = String(window?.roundType || '').trim()
  return round ? `${name} · ${round}` : name
}

function describeWindows(windows) {
  return windows.slice(0, 5).map(displayWindow).join(', ')
}

function selectLiveWindow(windows, tournament) {
  const live = (Array.isArray(windows) ? windows : []).filter(window => window?.live === true)
  if (!live.length) {
    throw new LivePointsError('No live tournament window was found in that region. Use manual mode or check the region.', 'noLiveWindow')
  }

  const filter = String(tournament ?? '').trim()
  if (!filter) {
    if (live.length > 1) {
      throw new LivePointsError(
        `More than one tournament is live: ${describeWindows(live)}. Enter the exact tournament name to choose one.`,
        'ambiguousWindow',
      )
    }
    return live[0]
  }

  const wanted = normalizedSearch(filter)
  if (!wanted) throw new LivePointsError('Enter a real tournament name, or leave the tournament filter blank.', 'invalidTournament')
  const exactMatches = live.filter(window => {
    const exactFields = [window.name, window.eventId, window.windowId].map(normalizedSearch)
    return exactFields.includes(wanted)
  })
  if (exactMatches.length === 1) return exactMatches[0]
  if (exactMatches.length > 1) {
    throw new LivePointsError(
      `"${filter}" matches more than one live tournament: ${describeWindows(exactMatches)}. Include the round or mode suffix.`,
      'ambiguousWindow',
    )
  }

  const matches = live.filter(window => {
    const haystack = normalizedSearch(`${window.name} ${window.eventId} ${window.windowId} ${window.roundType || ''}`)
    return haystack.includes(wanted)
  })

  if (!matches.length) {
    throw new LivePointsError(
      `No live tournament matched "${filter}". Live options: ${describeWindows(live)}.`,
      'windowNotFound',
    )
  }
  if (matches.length > 1) {
    throw new LivePointsError(
      `"${filter}" matches more than one live tournament: ${describeWindows(matches)}. Include the mode suffix such as "ZB".`,
      'ambiguousWindow',
    )
  }
  return matches[0]
}

async function fetchJson(url, fetchImpl, label) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetchImpl(url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    })
    if (!response?.ok) throw new LivePointsError(`${label} returned HTTP ${response?.status || 'error'}.`, 'upstreamError')
    const data = await response.json()
    if (!data || typeof data !== 'object') throw new LivePointsError(`${label} returned an invalid response.`, 'invalidResponse')
    return data
  } catch (error) {
    if (error instanceof LivePointsError) throw error
    if (error?.name === 'AbortError') throw new LivePointsError(`${label} timed out. Try again in a moment.`, 'timeout')
    throw new LivePointsError(`Could not reach ${label}. Try again in a moment.`, 'upstreamError')
  } finally {
    clearTimeout(timeout)
  }
}

function finiteWhole(value) {
  const number = Number(value)
  return Number.isSafeInteger(number) && number >= 0 ? number : null
}

function cutoffValue(window) {
  const threshold = window?.threshold || {}
  const candidates = [threshold.cutoffPoints, threshold.points]
  for (const candidate of candidates) {
    const value = finiteWhole(candidate)
    if (value != null) return value
  }
  return null
}

function liveErrorResult(error) {
  return {
    ok: false,
    error: error instanceof Error ? error.message : 'Live points are unavailable right now.',
    code: error?.code || 'liveUnavailable',
  }
}

async function loadLivePoints(input = {}, deps = {}) {
  const ign = String(input.ign ?? '').trim()
  if (!ign) return { ok: false, error: 'Enter your exact Epic display name for live mode.', code: 'missingIgn' }

  const region = normalizeRegion(input.region)
  if (!region) return { ok: false, error: `Choose a current region: ${REGIONS.join(', ')}.`, code: 'invalidRegion' }

  const fetchImpl = deps.fetchImpl || globalThis.fetch
  if (typeof fetchImpl !== 'function') return { ok: false, error: 'Live lookup is unavailable in this environment.', code: 'noFetch' }

  try {
    const cutoffUrl = `${CUTOFF_API}?region=${encodeURIComponent(region)}`
    const cutoffData = await fetchJson(cutoffUrl, fetchImpl, 'the live tournament feed')
    if (cutoffData.error) throw new LivePointsError(String(cutoffData.error), 'upstreamError')

    const window = selectLiveWindow(cutoffData.windows, input.tournament)
    const eventId = String(window.eventId || '').trim()
    const windowId = String(window.windowId || '').trim()
    if (!eventId || !windowId) throw new LivePointsError('The selected live tournament is missing its exact window identity.', 'invalidWindow')

    const cutoff = cutoffValue(window)
    if (cutoff == null) {
      const note = String(window.threshold?.cutoffNote || '').trim()
      throw new LivePointsError(
        `The live leaderboard has not published a qualifying point yet${note ? ` (${note})` : ''}. Try again after more scores are posted.`,
        'missingCutoff',
      )
    }

    const scoreUrl = `${SCORE_API}?ign=${encodeURIComponent(ign)}&eventId=${encodeURIComponent(eventId)}&windowId=${encodeURIComponent(windowId)}`
    const score = await fetchJson(scoreUrl, fetchImpl, 'the Epic leaderboard')
    if (score.error) throw new LivePointsError(String(score.error), score.found === false ? 'scoreNotFound' : 'upstreamError')
    if (score.found !== true) {
      throw new LivePointsError(
        String(score.note || 'Your Epic name is not on this tournament leaderboard yet. Play a game, then try again.'),
        'scoreNotFound',
      )
    }

    const current = finiteWhole(score.points)
    if (current == null) throw new LivePointsError('Epic returned an invalid points total for that player.', 'invalidScore')

    const forecast = calculatePointsForecast({
      current,
      target: cutoff,
      games: input.games,
      buffer: input.buffer,
    })
    if (!forecast.ok) return forecast

    return {
      ...forecast,
      source: 'live',
      ign,
      region,
      tournamentName: String(window.name || 'Live tournament'),
      roundType: String(window.roundType || '').trim() || null,
      rank: finiteWhole(score.rank),
      gamesPlayed: finiteWhole(score.games) ?? 0,
      eventId,
      windowId,
      windowBeginTime: window.beginTime || null,
      windowEndTime: window.endTime || null,
      targetType: window.threshold?.type || null,
      targetLabel: window.threshold?.label || null,
      pointsSourceNote: 'Live qualifying line from the public Epic leaderboard feed; it can move as the board fills.',
      targetSource: 'Epic live leaderboard',
    }
  } catch (error) {
    return liveErrorResult(error)
  }
}

export { CUTOFF_API, SCORE_API, REGIONS, LivePointsError, normalizeRegion, selectLiveWindow, loadLivePoints }
