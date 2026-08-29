// Live Fortnite points lookup for Maxx Bot.
//
// The public snipemaxxer-brain routes are deliberately used as a narrow
// adapter: first select one exact live window, then ask for one exact Epic
// display name in that same event/window. If any part is missing or
// ambiguous, fail closed instead of choosing a nearby tournament or using an
// old estimate.

import { calculatePointsForecast, calculatePrizeRace } from './points-calculator.js'

const CUTOFF_API = 'https://snipemaxxer-brain.maxxtopia.workers.dev/cutoffs'
const WINDOWS_API = 'https://snipemaxxer-brain.maxxtopia.workers.dev/windows'
const STANDING_API = 'https://snipemaxxer-brain.maxxtopia.workers.dev/standing'
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
  return region === 'ALL' || REGIONS.includes(region) ? region : null
}

function normalizedSearch(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function displayWindow(window) {
  const name = String(window?.name || 'Unnamed tournament').trim()
  const round = String(window?.roundType || '').trim()
  const region = String(window?.region || '').trim()
  const suffix = [region, round].filter(Boolean).join(' · ')
  return suffix ? `${name} · ${suffix}` : name
}

function describeWindows(windows) {
  return windows.slice(0, 5).map(displayWindow).join(', ')
}

function selectLiveWindow(windows, tournament, exactEventId = '', exactWindowId = '') {
  const live = (Array.isArray(windows) ? windows : []).filter(window => window?.live === true)
  if (!live.length) {
    throw new LivePointsError('No live tournament window was found in that region. Use manual mode or check the region.', 'noLiveWindow')
  }

  const requestedEventId = String(exactEventId ?? '').trim()
  const requestedWindowId = String(exactWindowId ?? '').trim()
  if (requestedEventId || requestedWindowId) {
    const exactMatches = live.filter(window => {
      const eventMatches = !requestedEventId || String(window?.eventId || '').trim() === requestedEventId
      const windowMatches = !requestedWindowId || String(window?.windowId || '').trim() === requestedWindowId
      return eventMatches && windowMatches
    })
    if (exactMatches.length === 1) return exactMatches[0]
    if (exactMatches.length > 1) {
      throw new LivePointsError('The selected live window identity is ambiguous; no leaderboard was queried.', 'ambiguousWindow')
    }
    throw new LivePointsError('That live tournament window is no longer available. Choose it again from the fresh live list.', 'windowNotFound')
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

function supportedWindowFormat(window) {
  const format = String(window?.format || (window?.threshold?.type === 'final' ? 'final' : 'qualification')).trim()
  return ['qualification', 'final'].includes(format) ? format : null
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
    if (!response?.ok) {
      let payload = null
      try { payload = await response.json() } catch { /* keep the status-only message */ }
      const message = String(payload?.error || payload?.note || '').trim()
      throw new LivePointsError(message || `${label} returned HTTP ${response?.status || 'error'}.`, payload?.found === false ? 'scoreNotFound' : 'upstreamError')
    }
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

async function loadLiveWindows(regionInput, deps = {}) {
  const region = normalizeRegion(regionInput)
  if (!region) {
    throw new LivePointsError(`Choose a current region or ALL: ${REGIONS.join(', ')}, ALL.`, 'invalidRegion')
  }

  const fetchImpl = deps.fetchImpl || globalThis.fetch
  if (typeof fetchImpl !== 'function') throw new LivePointsError('Live tournament choices are unavailable in this environment.', 'noFetch')

  const windowsData = await fetchJson(
    `${WINDOWS_API}?region=${encodeURIComponent(region)}`,
    fetchImpl,
    'the live tournament feed',
  )
  if (windowsData.error) throw new LivePointsError(String(windowsData.error), 'upstreamError')

  const failedRegions = Array.isArray(windowsData.regionsFailed)
    ? windowsData.regionsFailed.map(value => String(value).trim().toUpperCase()).filter(Boolean)
    : []
  if (region !== 'ALL' && failedRegions.includes(region)) {
    throw new LivePointsError('The live tournament feed is unavailable for that region. Try again in a moment.', 'upstreamError')
  }
  if (region === 'ALL' && failedRegions.length === REGIONS.length) {
    throw new LivePointsError('The live tournament feed is unavailable for every region. Try again in a moment.', 'upstreamError')
  }

  const responseRegion = String(windowsData.region || '').trim().toUpperCase()
  const windows = (Array.isArray(windowsData.windows) ? windowsData.windows : [])
    .filter(window => window?.live === true)
    .map(window => {
      const windowRegion = String(window.region || (region === 'ALL' ? responseRegion : region)).trim().toUpperCase()
      return { ...window, region: windowRegion }
    })
    .filter(window => REGIONS.includes(window.region))
    .filter(window => region === 'ALL' || window.region === region)
    .filter(window => String(window.eventId || '').trim() && String(window.windowId || '').trim())
    .filter(window => supportedWindowFormat(window))

  if (!windows.length) {
    throw new LivePointsError('No supported live tournament window was found in that region. Use manual mode or try again later.', 'noLiveWindow')
  }

  return {
    region,
    windows,
    fetched: windowsData.fetched || null,
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
  const accountId = String(input.accountId ?? '').trim().toLowerCase()
  if (!ign && !accountId) return { ok: false, error: 'Enter your exact Epic display name or 32-character Epic account ID for live mode.', code: 'missingIgn' }
  if (accountId && !/^[0-9a-f]{32}$/.test(accountId)) {
    return { ok: false, error: 'Epic account ID must be exactly 32 hexadecimal characters.', code: 'invalidAccountId' }
  }

  const region = normalizeRegion(input.region)
  if (!region) return { ok: false, error: `Choose a current region or ALL: ${REGIONS.join(', ')}, ALL.`, code: 'invalidRegion' }

  const fetchImpl = deps.fetchImpl || globalThis.fetch
  if (typeof fetchImpl !== 'function') return { ok: false, error: 'Live lookup is unavailable in this environment.', code: 'noFetch' }

  try {
    const windowsUrl = `${WINDOWS_API}?region=${encodeURIComponent(region)}`
    const windowsData = await fetchJson(windowsUrl, fetchImpl, 'the live tournament feed')
    if (windowsData.error) throw new LivePointsError(String(windowsData.error), 'upstreamError')
    const failedRegions = Array.isArray(windowsData.regionsFailed)
      ? windowsData.regionsFailed.map(value => String(value).trim().toUpperCase()).filter(Boolean)
      : []
    if (region !== 'ALL' && failedRegions.includes(region)) {
      throw new LivePointsError('The live tournament feed is unavailable for that region. Try again in a moment.', 'upstreamError')
    }
    if (region === 'ALL' && failedRegions.length === REGIONS.length) {
      throw new LivePointsError('The live tournament feed is unavailable for every region. Try again in a moment.', 'upstreamError')
    }

    const window = selectLiveWindow(windowsData.windows, input.tournament, input.eventId, input.windowId)
    const eventId = String(window.eventId || '').trim()
    const windowId = String(window.windowId || '').trim()
    if (!eventId || !windowId) throw new LivePointsError('The selected live tournament is missing its exact window identity.', 'invalidWindow')
    const windowRegion = String(window.region || (region === 'ALL' ? '' : region)).trim().toUpperCase()
    if (!REGIONS.includes(windowRegion)) throw new LivePointsError('The selected live tournament is missing its exact region.', 'invalidWindow')
    if (region !== 'ALL' && windowRegion !== region) throw new LivePointsError('The selected tournament belongs to a different region than the requested lookup.', 'regionMismatch')

    const format = String(window.format || (window.threshold?.type === 'final' ? 'final' : 'qualification')).trim()
    if (!['qualification', 'final'].includes(format)) {
      throw new LivePointsError('The selected tournament does not expose a supported qualification or Finals prize format.', 'unsupportedFormat')
    }

    const params = new URLSearchParams({ eventId, windowId, region: windowRegion })
    if (accountId) params.set('accountId', accountId)
    else params.set('ign', ign)
    const standingUrl = `${STANDING_API}?${params.toString()}`
    const standing = await fetchJson(standingUrl, fetchImpl, 'the Epic leaderboard')
    if (standing.error) throw new LivePointsError(String(standing.error), standing.found === false ? 'scoreNotFound' : 'upstreamError')
    if (standing.found !== true) {
      throw new LivePointsError(
        String(standing.note || 'That Epic identity is not on this tournament leaderboard yet. Play a game, then try again.'),
        'scoreNotFound',
      )
    }
    const standingRegion = String(standing.region || windowRegion).trim().toUpperCase()
    if (standingRegion !== windowRegion) throw new LivePointsError('Epic returned a standing from a different region; no result was claimed.', 'regionMismatch')

    const current = finiteWhole(standing.points)
    if (current == null) throw new LivePointsError('Epic returned an invalid points total for that player.', 'invalidScore')
    const gamesLeft = finiteWhole(standing.gamesLeft)
    const games = gamesLeft == null ? input.games : gamesLeft
    const rawRoundType = String(standing.roundType || window.roundType || '').trim() || null

    const common = {
      source: 'live',
      ign: String(standing.ign || ign || accountId).trim(),
      accountId: String(standing.accountId || accountId || '').trim() || null,
      region: standingRegion,
      tournamentName: String(standing.name || window.name || 'Live tournament'),
      roundType: format === 'final' ? 'Finals' : rawRoundType,
      rank: finiteWhole(standing.rank),
      gamesPlayed: finiteWhole(standing.games) ?? 0,
      eventId,
      windowId,
      windowBeginTime: standing.beginTime || window.beginTime || null,
      windowEndTime: standing.endTime || window.endTime || null,
      windowFetchedAt: standing.boundaryFetchedAt || standing.fetchedAt || windowsData.fetched || null,
    }

    if (format === 'final') {
      const prize = calculatePrizeRace({
        current,
        rank: common.rank,
        games,
        prizeLadder: standing.prizeLadder || window.prizeLadder || [],
        prizeLadderVerified: standing.prizeLadderVerified === true,
        boundaryFetchedAt: standing.boundaryFetchedAt || null,
      })
      if (!prize.ok) return prize
      return {
        ...prize,
        ...common,
        format: 'final',
        targetType: 'final',
        targetLabel: standing.threshold?.label || window.threshold?.label || 'Finals - place for prizes',
        pointsSourceNote: 'Live score, published prize ladder, and same-region leaderboard boundaries from this exact Epic event/window; boundaries can move until the window closes.',
        targetSource: prize.prizeLadderVerified ? 'Epic payout ladder + live regional leaderboard' : 'Epic live leaderboard; prize amount not verified',
      }
    }

    const cutoff = cutoffValue(window) ?? cutoffValue(standing)
    if (cutoff == null) {
      const note = String(window.threshold?.cutoffNote || standing.threshold?.cutoffNote || '').trim()
      throw new LivePointsError(
        `The live leaderboard has not published a qualifying point yet${note ? ` (${note})` : ''}. Try again after more scores are posted.`,
        'missingCutoff',
      )
    }

    const forecast = calculatePointsForecast({
      current,
      target: cutoff,
      games,
      buffer: input.buffer,
    })
    if (!forecast.ok) return forecast

    return {
      ...forecast,
      ...common,
      format: 'qualification',
      targetType: window.threshold?.type || null,
      targetLabel: standing.threshold?.label || window.threshold?.label || null,
      pointsSourceNote: 'Live qualifying line from the public Epic leaderboard feed; it can move as the board fills.',
      targetSource: 'Epic live leaderboard',
    }
  } catch (error) {
    return liveErrorResult(error)
  }
}

export {
  CUTOFF_API,
  WINDOWS_API,
  STANDING_API,
  SCORE_API,
  REGIONS,
  LivePointsError,
  normalizeRegion,
  selectLiveWindow,
  loadLiveWindows,
  loadLivePoints,
}
