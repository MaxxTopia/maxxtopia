// Live Fortnite points lookup for Maxx Bot.
//
// The public snipemaxxer-brain routes are deliberately used as a narrow
// adapter: first select one exact live window, then ask for one exact Epic
// display name in that same event/window. If any part is missing or
// ambiguous, fail closed instead of choosing a nearby tournament or using an
// old estimate.

import { calculatePointsForecast, calculatePrizeRace } from './points-calculator.js'

const CUTOFF_API = 'https://snipemaxxer-brain.maxxtopia.workers.dev/cutoffs'
const TOURNAMENTS_API = 'https://snipemaxxer-brain.maxxtopia.workers.dev/tournaments'
const QUALIFY_API = 'https://snipemaxxer-brain.maxxtopia.workers.dev/qualify'
const WINDOWS_API = 'https://snipemaxxer-brain.maxxtopia.workers.dev/windows'
const STANDING_API = 'https://snipemaxxer-brain.maxxtopia.workers.dev/standing'
const SCORE_API = 'https://snipemaxxer-brain.maxxtopia.workers.dev/myscore'
const REQUEST_TIMEOUT_MS = 8_000
const REGIONS = Object.freeze(['NAC', 'EU', 'NAW', 'BR', 'ASIA', 'OCE', 'ME'])
const LIVE_FEED_LABEL = 'the live tournament feed'
const LIVE_FEED_RETRY_DELAYS_MS = Object.freeze([250])

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
    throw new LivePointsError('No supported tournament is live in that region right now. Re-open live points when your event is running.', 'noLiveWindow')
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

function retryableLiveFeedStatus(status) {
  const value = Number(status)
  return value === 404 || value === 408 || value === 425 || value === 429 || value >= 500
}

function routeMissingPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false
  const keys = Object.keys(payload)
  return keys.length === 1 && keys[0] === 'error' && String(payload.error).trim().toLowerCase() === 'not found'
}

function liveFeedError(response) {
  const status = Number(response?.status)
  const friendly = status === 429
    ? 'The live tournament list is busy. Try again in a moment.'
    : status === 404 || status >= 500
      ? 'The live tournament list is temporarily unavailable. Try again shortly.'
      : 'The live tournament list could not be loaded. Check your region and try again.'
  return new LivePointsError(friendly, 'liveFeedUnavailable')
}

async function fetchJson(url, fetchImpl, label, options = {}) {
  const retryDelays = label === LIVE_FEED_LABEL ? LIVE_FEED_RETRY_DELAYS_MS : []
  const sleepImpl = typeof options.sleepImpl === 'function'
    ? options.sleepImpl
    : milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))
  let attempt = 0
  while (true) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    let retry = false
    try {
      const response = await fetchImpl(url, {
        method: options.method || 'GET',
        cache: 'no-store',
        signal: controller.signal,
        ...(options.body === undefined ? {} : {
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(options.body),
        }),
      })
      if (!response?.ok) {
        let payload = null
        try { payload = await response.json() } catch { /* keep the status-only message */ }
        if (options.allowRouteMissing && Number(response?.status) === 404 && routeMissingPayload(payload)) {
          return null
        } else if (label === LIVE_FEED_LABEL && retryableLiveFeedStatus(response?.status) && attempt < retryDelays.length) {
          retry = true
        } else if (label === LIVE_FEED_LABEL) {
          throw liveFeedError(response)
        } else {
          const message = String(payload?.error || payload?.note || '').trim()
          throw new LivePointsError(message || `${label} returned HTTP ${response?.status || 'error'}.`, payload?.found === false ? 'scoreNotFound' : 'upstreamError')
        }
      } else {
        const data = await response.json()
        if (!data || typeof data !== 'object') throw new LivePointsError(`${label} returned an invalid response.`, 'invalidResponse')
        if (label === LIVE_FEED_LABEL && data.error) {
          if (attempt < retryDelays.length) {
            retry = true
          } else {
            throw new LivePointsError('The live tournament list is temporarily unavailable. Try again shortly.', 'liveFeedUnavailable')
          }
        } else {
          return data
        }
      }
    } catch (error) {
      if (error instanceof LivePointsError) {
        if (!retry) {
          throw error
        }
      } else if (label === LIVE_FEED_LABEL && attempt < retryDelays.length) {
        retry = true
      } else if (error?.name === 'AbortError') {
        throw new LivePointsError(`${label} timed out. Try again in a moment.`, 'timeout')
      } else {
        throw new LivePointsError(`Could not reach ${label}. Try again in a moment.`, 'upstreamError')
      }
    } finally {
      clearTimeout(timeout)
    }
    if (!retry) throw new LivePointsError(`Could not reach ${label}. Try again in a moment.`, 'upstreamError')
    await sleepImpl(retryDelays[attempt])
    attempt += 1
  }
}

function normalizeLiveFeed(windowsData, region, contract) {
  if (!windowsData || typeof windowsData !== 'object') {
    throw new LivePointsError('The live tournament list returned an invalid response.', 'invalidResponse')
  }

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
    .filter(window => String(window?.threshold?.type || '').trim().toLowerCase() !== 'none')

  return {
    region,
    windows,
    fetched: windowsData.fetched || null,
    contract,
  }
}

async function loadWindowFeed(regionInput, deps = {}) {
  const region = normalizeRegion(regionInput)
  if (!region) {
    throw new LivePointsError(`Choose a current region or ALL: ${REGIONS.join(', ')}, ALL.`, 'invalidRegion')
  }

  const fetchImpl = deps.fetchImpl || globalThis.fetch
  if (typeof fetchImpl !== 'function') throw new LivePointsError('Live tournament choices are unavailable in this environment.', 'noFetch')

  let modernError = null
  try {
    const modern = await fetchJson(
      `${TOURNAMENTS_API}?region=${encodeURIComponent(region)}`,
      fetchImpl,
      LIVE_FEED_LABEL,
      { sleepImpl: deps.sleepImpl, allowRouteMissing: true },
    )
    if (modern) return normalizeLiveFeed(modern, region, 'tournaments')
  } catch (error) {
    modernError = error
  }

  try {
    const legacy = await fetchJson(
      `${WINDOWS_API}?region=${encodeURIComponent(region)}`,
      fetchImpl,
      LIVE_FEED_LABEL,
      { sleepImpl: deps.sleepImpl, allowRouteMissing: true },
    )
    if (legacy) return normalizeLiveFeed(legacy, region, 'windows')
  } catch (legacyError) {
    throw modernError || legacyError
  }

  throw modernError || new LivePointsError('The live tournament list is temporarily unavailable. Try again shortly.', 'liveFeedUnavailable')
}

async function loadLiveWindows(regionInput, deps = {}) {
  const selection = await loadWindowFeed(regionInput, deps)
  if (!selection.windows.length) {
    throw new LivePointsError('No supported tournament is live in that region right now. Re-open live points when your event is running.', 'noLiveWindow')
  }
  return selection
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

async function loadExactScore({ ign, eventId, windowId, region }, fetchImpl) {
  // The modern /myscore contract resolves display names only. Account-ID
  // lookups use /qualify below, which accepts the exact 32-character id.
  if (!ign) return null
  const params = new URLSearchParams({ ign, eventId, windowId, region })
  const score = await fetchJson(
    `${SCORE_API}?${params.toString()}`,
    fetchImpl,
    'the Epic leaderboard',
    { allowRouteMissing: true },
  )
  if (!score) return null
  if (score.error || score.found !== true) {
    throw new LivePointsError(
      String(score.note || score.error || 'That Epic identity is not on this tournament leaderboard yet. Play a game, then try again.'),
      score.found === false ? 'scoreNotFound' : 'upstreamError',
    )
  }
  return score
}

async function loadLegacyStanding({ ign, accountId, eventId, windowId, region }, fetchImpl) {
  const params = new URLSearchParams({ eventId, windowId, region })
  if (accountId) params.set('accountId', accountId)
  else params.set('ign', ign)
  const standing = await fetchJson(
    `${STANDING_API}?${params.toString()}`,
    fetchImpl,
    'the Epic leaderboard',
    { allowRouteMissing: true },
  )
  if (!standing) return null
  if (standing.error || standing.found !== true) {
    throw new LivePointsError(
      String(standing.note || standing.error || 'That Epic identity is not on this tournament leaderboard yet. Play a game, then try again.'),
      standing.found === false ? 'scoreNotFound' : 'upstreamError',
    )
  }
  return standing
}

async function loadQualification(accountId, eventId, windowId, fetchImpl) {
  if (!/^[0-9a-f]{32}$/.test(String(accountId || '').toLowerCase())) return null
  const data = await fetchJson(
    QUALIFY_API,
    fetchImpl,
    'the exact tournament projection',
    {
      method: 'POST',
      body: { accountIds: [String(accountId).toLowerCase()], eventId, windowId },
      allowRouteMissing: true,
    },
  )
  if (!data) return null
  if (data.error) throw new LivePointsError(String(data.error), 'upstreamError')
  return data
}

async function loadExactCutoff(eventId, windowId, region, fetchImpl) {
  const data = await fetchJson(
    `${CUTOFF_API}?region=${encodeURIComponent(region)}`,
    fetchImpl,
    'the exact qualifying line',
    { allowRouteMissing: true },
  )
  if (!data) return null
  if (data.error) throw new LivePointsError(String(data.error), 'upstreamError')
  const matches = (Array.isArray(data.windows) ? data.windows : []).filter(window => (
    String(window?.eventId || '').trim() === eventId
    && String(window?.windowId || '').trim() === windowId
    && String(window?.region || region).trim().toUpperCase() === region
  ))
  if (matches.length > 1) {
    throw new LivePointsError('The exact qualifying line was ambiguous; no cutoff was claimed.', 'ambiguousCutoff')
  }
  return matches.length === 1 ? { window: matches[0], fetched: data.fetched || null } : null
}

function qualificationStanding(data, accountId) {
  if (!data || !accountId || !data.standings || typeof data.standings !== 'object') return null
  return data.standings[String(accountId).toLowerCase()] || null
}

async function loadLivePoints(input = {}, deps = {}) {
  const ign = String(input.ign ?? '').trim()
  const accountId = String(input.accountId ?? '').trim().toLowerCase()
  if (!ign && !accountId) return { ok: false, error: 'Enter your Epic display name for live mode.', code: 'missingIgn' }
  if (accountId && !/^[0-9a-f]{32}$/.test(accountId)) {
    return { ok: false, error: 'Epic account ID must be exactly 32 hexadecimal characters.', code: 'invalidAccountId' }
  }

  const region = normalizeRegion(input.region)
  if (!region) return { ok: false, error: `Choose a current region or ALL: ${REGIONS.join(', ')}, ALL.`, code: 'invalidRegion' }

  const fetchImpl = deps.fetchImpl || globalThis.fetch
  if (typeof fetchImpl !== 'function') return { ok: false, error: 'Live lookup is unavailable in this environment.', code: 'noFetch' }

  try {
    const windowsData = await loadWindowFeed(region, deps)
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

    const identity = { ign, accountId, eventId, windowId, region: windowRegion }
    let qualification = null
    let qualificationError = null
    if (/^[0-9a-f]{32}$/.test(accountId)) {
      try {
        qualification = await loadQualification(accountId, eventId, windowId, fetchImpl)
      } catch (error) {
        qualificationError = error
      }
    }

    let standing = await loadExactScore(identity, fetchImpl)
    if (!standing && ign) standing = await loadLegacyStanding(identity, fetchImpl)
    if (!standing && !ign && qualification) {
      const accountStanding = qualificationStanding(qualification, accountId)
      if (!accountStanding) {
        throw new LivePointsError('That Epic account is not on this tournament leaderboard yet. Play a game, then try again.', 'scoreNotFound')
      }
      standing = {
        found: true,
        accountId,
        ign: 'Epic account ID',
        region: qualification.region || windowRegion,
        roundType: qualification.roundType || window.roundType,
        beginTime: qualification.beginTime || window.beginTime,
        endTime: qualification.endTime || window.endTime,
        ...accountStanding,
      }
    }
    if (!standing && !ign) standing = await loadLegacyStanding(identity, fetchImpl)
    if (!standing) {
      throw qualificationError || new LivePointsError('The live score route is temporarily unavailable. No player result was guessed.', 'liveScoreUnavailable')
    }

    const resolvedAccountId = String(standing.accountId || accountId || '').trim().toLowerCase()
    if (!qualification && /^[0-9a-f]{32}$/.test(resolvedAccountId)) {
      try {
        qualification = await loadQualification(resolvedAccountId, eventId, windowId, fetchImpl)
      } catch (error) {
        qualificationError = error
      }
    }
    const exactStanding = qualificationStanding(qualification, resolvedAccountId)

    const standingRegion = String(qualification?.region || standing.region || windowRegion).trim().toUpperCase()
    if (standingRegion !== windowRegion) throw new LivePointsError('Epic returned a standing from a different region; no result was claimed.', 'regionMismatch')

    const current = finiteWhole(exactStanding?.points) ?? finiteWhole(standing.points)
    if (current == null) throw new LivePointsError('Epic returned an invalid points total for that player.', 'invalidScore')
    const gamesLeft = finiteWhole(exactStanding?.gamesLeft) ?? finiteWhole(standing.gamesLeft)
    const games = gamesLeft == null ? input.games : gamesLeft
    const rawRoundType = String(qualification?.roundType || standing.roundType || window.roundType || '').trim() || null

    const common = {
      source: 'live',
      ign: String(standing.ign || ign).trim() || 'Player lookup',
      accountId: resolvedAccountId || null,
      region: standingRegion,
      tournamentName: String(qualification?.name || standing.name || window.name || 'Live tournament'),
      roundType: format === 'final' ? 'Finals' : rawRoundType,
      rank: finiteWhole(exactStanding?.rank) ?? finiteWhole(standing.rank),
      gamesPlayed: finiteWhole(exactStanding?.games) ?? finiteWhole(standing.games) ?? 0,
      eventId,
      windowId,
      windowBeginTime: qualification?.beginTime || standing.beginTime || window.beginTime || null,
      windowEndTime: qualification?.endTime || standing.endTime || window.endTime || null,
      windowFetchedAt: qualification?.boundaryFetchedAt || standing.boundaryFetchedAt || standing.fetchedAt || windowsData.fetched || null,
    }

    if (format === 'final') {
      const prizeLadder = qualification?.prizeLadder || standing.prizeLadder || window.prizeLadder || []
      const prize = calculatePrizeRace({
        current,
        rank: common.rank,
        games,
        prizeLadder,
        prizeLadderVerified: qualification?.prizeLadderVerified === true || standing.prizeLadderVerified === true,
        boundaryFetchedAt: qualification?.boundaryFetchedAt || standing.boundaryFetchedAt || null,
      })
      if (!prize.ok) return prize
      return {
        ...prize,
        ...common,
        format: 'final',
        targetType: 'final',
        targetLabel: qualification?.threshold?.label || standing.threshold?.label || window.threshold?.label || 'Finals - place for prizes',
        pointsSourceNote: prize.prizeLadder.length
          ? 'Live score, published prize ladder, and same-region leaderboard boundaries from this exact Epic event/window; boundaries can move until the window closes.'
          : 'Live score and rank from this exact Epic event/window. The upstream feed did not expose a prize ladder, so no paid band or target was guessed.',
        targetSource: prize.prizeLadderVerified
          ? 'Epic payout ladder + live regional leaderboard'
          : prize.prizeLadder.length
            ? 'Epic live leaderboard; prize amount not verified'
            : 'Epic live score and rank only',
      }
    }

    let cutoffResult = null
    try {
      cutoffResult = await loadExactCutoff(eventId, windowId, windowRegion, fetchImpl)
    } catch (error) {
      if (!qualification) throw qualificationError || error
    }
    const cutoffWindow = cutoffResult?.window || null
    const cutoff = cutoffValue(cutoffWindow) ?? cutoffValue(qualification) ?? cutoffValue(window) ?? cutoffValue(standing)
    if (cutoff == null) {
      const note = String(cutoffWindow?.threshold?.cutoffNote || qualification?.threshold?.cutoffNote || window.threshold?.cutoffNote || standing.threshold?.cutoffNote || '').trim()
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
      targetType: cutoffWindow?.threshold?.type || qualification?.threshold?.type || window.threshold?.type || null,
      targetLabel: cutoffWindow?.threshold?.label || qualification?.threshold?.label || standing.threshold?.label || window.threshold?.label || null,
      windowFetchedAt: cutoffResult?.fetched || common.windowFetchedAt,
      pointsSourceNote: 'Live qualifying line from the public Epic leaderboard feed; it can move as the board fills.',
      targetSource: 'Epic live leaderboard',
    }
  } catch (error) {
    return liveErrorResult(error)
  }
}

export {
  CUTOFF_API,
  TOURNAMENTS_API,
  QUALIFY_API,
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
