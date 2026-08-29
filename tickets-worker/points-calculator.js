// Pure tournament-points math shared by the HTTP worker's /points command.
// Live data is resolved by points-live.js; this module never guesses a
// tournament, cutoff, scoring table, or placement/elimination conversion.

const MAX_POINTS = 1_000_000_000
const MAX_GAMES = 1_000
const POINTS_SOURCE_NOTE = 'Use the current Epic/Streammaxxing cutoff; older-region estimates are not a live qualifying line.'

function formatPoints(value) {
  if (!Number.isFinite(Number(value))) return '-'
  return Math.round(Number(value)).toLocaleString('en-US')
}

function parseWholeNumber(value, label, max, optional = false) {
  if (optional && (value == null || String(value).trim() === '')) return { ok: true, value: 0 }
  if (value == null || String(value).trim() === '') return { ok: false, error: `Enter ${label}.` }

  const number = Number(value)
  if (!Number.isSafeInteger(number) || number < 0 || number > max) {
    return {
      ok: false,
      error: `${label[0].toUpperCase()}${label.slice(1)} must be a whole number from 0 to ${formatPoints(max)}.`,
    }
  }
  return { ok: true, value: number }
}

function formatAverage(value, digits = 2) {
  if (value == null || !Number.isFinite(Number(value))) return '—'
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function progressBar(percent, slots = 12) {
  const filled = Math.min(slots, Math.max(0, Math.round((percent / 100) * slots)))
  return `${'█'.repeat(filled)}${'░'.repeat(slots - filled)}`
}

function calculatePointsForecast(input = {}) {
  const currentInput = input.current ?? input.currentPoints
  const targetInput = input.target ?? input.targetPoints
  const gamesInput = input.games ?? input.gamesLeft

  const current = parseWholeNumber(currentInput, 'current points', MAX_POINTS)
  if (!current.ok) return current
  const target = parseWholeNumber(targetInput, 'target points', MAX_POINTS)
  if (!target.ok) return target
  const games = parseWholeNumber(gamesInput, 'games left', MAX_GAMES)
  if (!games.ok) return games
  const buffer = parseWholeNumber(input.buffer, 'buffer points', MAX_POINTS, true)
  if (!buffer.ok) return buffer

  const targetWithBuffer = target.value + buffer.value
  const toQualify = Math.max(0, target.value - current.value)
  const toSafeLine = Math.max(0, targetWithBuffer - current.value)
  const requiredPerGame = toSafeLine > 0 && games.value > 0
    ? toSafeLine / games.value
    : toSafeLine > 0
      ? null
      : 0
  const projectedAtPace = requiredPerGame == null
    ? null
    : current.value + requiredPerGame * games.value
  const progressPercent = targetWithBuffer > 0
    ? Math.min(100, Math.max(0, Math.round((current.value / targetWithBuffer) * 100)))
    : 100

  let status
  let statusLabel
  let guidance
  if (current.value >= targetWithBuffer) {
    status = 'qualified'
    statusLabel = buffer.value > 0 ? 'ABOVE THE SAFE LINE' : 'ABOVE THE RACE LINE'
    guidance = buffer.value > 0
      ? `You are ${formatPoints(current.value - targetWithBuffer)} points above your requested cushion.`
      : `You are ${formatPoints(current.value - target.value)} points above the qualifying line.`
  } else if (games.value === 0) {
    status = 'noGames'
    statusLabel = 'NO GAMES LEFT'
    guidance = `You are ${formatPoints(toQualify)} points short of the qualifying line with no games left in this snapshot.`
  } else if (current.value >= target.value) {
    status = 'buffer'
    statusLabel = 'AT THE LINE · BUILD BUFFER'
    guidance = `You are on the qualifying line. Add ${formatPoints(toSafeLine)} more points for your requested cushion.`
  } else {
    status = 'chase'
    statusLabel = 'CHASE THE RACE LINE'
    const cushionNote = buffer.value > 0
      ? ` The pace includes your ${formatPoints(buffer.value)}-point cushion.`
      : ''
    guidance = `Need ${formatPoints(toQualify)} more points across ${games.value} games.${cushionNote}`
  }

  return {
    ok: true,
    currentPoints: current.value,
    targetPoints: target.value,
    bufferPoints: buffer.value,
    targetWithBuffer,
    gamesLeft: games.value,
    toQualify,
    toSafeLine,
    requiredPerGame,
    projectedAtPace,
    progressPercent,
    status,
    statusLabel,
    guidance,
    pointsSourceNote: POINTS_SOURCE_NOTE,
    targetSource: 'Manual cutoff',
    source: 'manual',
  }
}

const MAX_RANK = 1_000_000_000

function parseOptionalRank(value) {
  if (value == null || String(value).trim() === '') return { ok: true, value: null }
  return parseWholeNumber(value, 'current rank', MAX_RANK)
}

function normalizedPrizeLadder(value) {
  if (!Array.isArray(value)) return []
  return value
    .map(tier => ({
      ...tier,
      minRank: Number(tier?.minRank),
      maxRank: Number(tier?.maxRank),
    }))
    .filter(tier => Number.isSafeInteger(tier.maxRank) && tier.maxRank > 0)
    .sort((a, b) => a.maxRank - b.maxRank)
}

function prizeTierForRank(ladder, rank) {
  if (rank == null) return null
  return ladder.find(tier => rank <= tier.maxRank) || null
}

function nextPrizeTier(ladder, rank) {
  if (!ladder.length) return null
  if (rank == null) return null
  const current = prizeTierForRank(ladder, rank)
  if (!current) return ladder[ladder.length - 1]
  const index = ladder.indexOf(current)
  return index > 0 ? ladder[index - 1] : null
}

function prizeTierName(tier) {
  if (!tier) return 'a paid prize band'
  return tier.maxRank === 1 ? 'Top 1' : `Top ${formatPoints(tier.maxRank)}`
}

function prizeTierReward(tier) {
  if (!tier) return 'No published paid tier'
  return String(tier.rewardLabel || '').trim() || (tier.verified ? 'Prize details available' : 'Prize amount unavailable')
}

function prizeTierLine(tier) {
  return tier ? `${prizeTierName(tier)} — ${prizeTierReward(tier)}` : 'Outside the published paid bands'
}

// Finals are a rank/prize race, not a qualification race. The function only
// computes a points gap when the boundary score was read from this exact live
// leaderboard; it never estimates a cross-region or historical cutoff.
function calculatePrizeRace(input = {}) {
  const current = parseWholeNumber(input.current ?? input.currentPoints, 'current points', MAX_POINTS)
  if (!current.ok) return current
  const games = parseWholeNumber(input.games ?? input.gamesLeft, 'games left', MAX_GAMES)
  if (!games.ok) return games
  const rank = parseOptionalRank(input.rank)
  if (!rank.ok) return rank

  const prizeLadder = normalizedPrizeLadder(input.prizeLadder)
  const currentTier = prizeTierForRank(prizeLadder, rank.value)
  const targetTier = nextPrizeTier(prizeLadder, rank.value)
  const boundary = targetTier?.livePointsAtBoundary
  const targetPoints = targetTier && boundary != null && Number.isSafeInteger(Number(boundary))
    ? Number(targetTier.livePointsAtBoundary)
    : null
  const pointsToTarget = targetTier && targetPoints != null
    ? Math.max(0, targetPoints - current.value)
    : null
  const requiredPerGame = pointsToTarget == null
    ? null
    : pointsToTarget > 0 && games.value > 0
      ? pointsToTarget / games.value
      : pointsToTarget > 0
        ? null
        : 0
  const prizeLadderVerified = input.prizeLadderVerified === true || prizeLadder.some(tier => tier.verified === true)
  const projection = targetPoints == null ? 'live-standing-only' : 'live-boundary'

  let status = 'unavailable'
  let statusLabel = 'PRIZE INFO UNAVAILABLE'
  let guidance = 'Live points are available, but Epic did not expose enough prize metadata to identify a paid tier.'
  if (!prizeLadder.length) {
    status = 'unavailable'
  } else if (rank.value == null) {
    status = games.value === 0 ? 'noGames' : 'unavailable'
    statusLabel = games.value === 0 ? 'RANK UNAVAILABLE · NO GAMES LEFT' : 'RANK UNAVAILABLE'
    guidance = 'The live points total is available, but Epic did not return a rank for this snapshot; no prize band is claimed.'
  } else if (games.value === 0) {
    status = 'noGames'
    statusLabel = currentTier ? 'CURRENT PRIZE BAND · NO GAMES LEFT' : 'NO GAMES LEFT'
    guidance = currentTier
      ? `Final snapshot: ${prizeTierName(currentTier)} is the current rank band, but the board can still settle on ties.`
      : 'No remaining-game projection is available for this snapshot.'
  } else if (currentTier) {
    status = 'inPrize'
    statusLabel = 'CURRENTLY IN A PRIZE BAND'
    guidance = targetTier && targetPoints != null
      ? `Current rank is in ${prizeTierName(currentTier)}. Need ${formatPoints(pointsToTarget)} more live points to match the ${prizeTierName(targetTier)} boundary.`
      : targetTier
        ? `Current rank is in ${prizeTierName(currentTier)}. The next ${prizeTierName(targetTier)} boundary is not available yet.`
        : 'Current rank is in the top published prize band. The board can still move until the window closes.'
  } else {
    status = 'chase'
    statusLabel = 'CHASE THE NEXT PRIZE BAND'
    guidance = targetTier && targetPoints != null
      ? `Need ${formatPoints(pointsToTarget)} more live points to match the ${prizeTierName(targetTier)} boundary.`
      : targetTier
        ? `The nearest target is ${prizeTierName(targetTier)}, but its live boundary score is not available yet.`
        : 'No published paid rank target is available for this snapshot.'
  }

  return {
    ok: true,
    raceType: 'final',
    currentPoints: current.value,
    rank: rank.value,
    gamesLeft: games.value,
    currentTier,
    targetTier,
    targetPoints,
    pointsToTarget,
    requiredPerGame,
    projectedAtPace: requiredPerGame == null ? null : current.value + requiredPerGame * games.value,
    status,
    statusLabel,
    guidance,
    prizeLadder,
    prizeLadderVerified,
    boundaryFetchedAt: input.boundaryFetchedAt || null,
    projection,
    pointsSourceNote: 'Live points and same-window prize boundaries only; no cross-region or historical estimate was substituted.',
    targetSource: prizeLadderVerified ? 'Epic payout ladder + live regional leaderboard' : 'Epic live leaderboard; prize amount not verified',
  }
}

function liveContextLine(result) {
  if (result.source !== 'live') return ''
  const tournament = result.tournamentName || 'Live tournament'
  const round = result.roundType ? ` · ${result.roundType}` : ''
  const rank = result.rank == null ? '' : ` · rank #${formatPoints(result.rank)}`
  return `${tournament}${round} · ${result.region} · ${result.ign}${rank}`
}

function liveTargetLine(result) {
  if (result.source !== 'live') return ''
  const label = result.targetLabel || (result.targetType === 'rank' ? 'Live rank line' : 'Live target')
  return `${label} · ${formatPoints(result.targetPoints)} pts`
}

function formatFinalPointsDiscord(result) {
  const currentPrize = prizeTierLine(result.currentTier)
  const nextPrize = result.targetTier
    ? `${prizeTierLine(result.targetTier)}${result.targetPoints == null ? ' · live boundary unavailable' : ` · boundary ${formatPoints(result.targetPoints)} pts`}`
    : 'No better published tier than the current top band'
  const gap = result.pointsToTarget == null
    ? 'unavailable until Epic publishes this live boundary'
    : `${formatPoints(result.pointsToTarget)} more live points`
  const pace = result.requiredPerGame == null
    ? 'unavailable'
    : `${formatAverage(result.requiredPerGame)} points/game`
  const freshness = result.boundaryFetchedAt ? ` Boundary read: ${result.boundaryFetchedAt}.` : ''
  return [
    `Tournament Points Calculator - ${result.statusLabel}`,
    `Live Finals: ${liveContextLine(result)}`,
    `Current: ${formatPoints(result.currentPoints)} points | ${result.rank == null ? 'rank unavailable' : `rank #${formatPoints(result.rank)}`} | ${formatPoints(result.gamesPlayed ?? 0)} games recorded`,
    `Current prize band: ${currentPrize}`,
    `Next better tier: ${nextPrize}`,
    `Gap to that tier: ${gap} | Required pace: ${pace}`,
    `Games left: ${formatPoints(result.gamesLeft)}`,
    result.prizeLadderVerified
      ? 'Prize tiers come from Epic payout metadata; all point boundaries are live projections and can move before the window closes.'
      : 'The live standing is real, but Epic prize amounts were not readable in this response. No dollar amount is being guessed.',
    `${result.guidance}${freshness}`,
    'Refresh after each game. Ties and late scores can move both rank and the boundary.',
  ].filter(Boolean).join('\n')
}

function formatPointsDiscord(result) {
  if (!result || !result.ok) return `Points calculator: ${result?.error || 'check your inputs.'}`
  if (result.raceType === 'final') return formatFinalPointsDiscord(result)
  const pace = result.toSafeLine === 0
    ? 'not needed'
    : result.requiredPerGame == null
      ? 'no remaining-game pace'
      : `${formatAverage(result.requiredPerGame)} points/game`
  const sourceLine = result.source === 'live'
    ? `Live: ${liveContextLine(result)}`
    : `Source: ${result.pointsSourceNote}`
  return [
    result.source === 'live' ? `Tournament Points Calculator - ${result.statusLabel}` : `Tournament Points Calculator - ${result.statusLabel}`,
    sourceLine,
    `Current: ${formatPoints(result.currentPoints)} | Target: ${formatPoints(result.targetPoints)}`,
    result.toQualify > 0
      ? `Need ${formatPoints(result.toQualify)} more points to qualify.`
      : 'You are at or above the qualifying line.',
    `Games left: ${formatPoints(result.gamesLeft)} | Required pace: ${pace}`,
    result.bufferPoints > 0 ? `Safety cushion: ${formatPoints(result.bufferPoints)} points.` : '',
    result.guidance,
    result.source === 'live'
      ? `Target: ${liveTargetLine(result)}. Refresh after each game because the live line can move.`
      : result.pointsSourceNote,
    'Run it again after each game with your new cumulative points and games left.',
  ].filter(Boolean).join('\n')
}

function formatPointsEmbed(result) {
  if (!result || !result.ok) return null
  if (result.raceType === 'final') return formatFinalsEmbed(result)

  const color = result.status === 'qualified'
    ? 0x30d158
    : result.status === 'noGames'
      ? 0xff4d6d
      : 0xffc857
  const emoji = result.status === 'qualified'
    ? '✅'
    : result.status === 'noGames'
      ? '🛑'
      : '🏁'
  const pace = result.toSafeLine === 0
    ? 'not needed'
    : result.requiredPerGame == null
      ? '—'
      : `${formatAverage(result.requiredPerGame, 1)} PPG`
  const raceValue = result.toQualify > 0
    ? `**${formatPoints(result.toQualify)}** to qualify`
    : `**${formatPoints(Math.max(0, result.currentPoints - result.targetPoints))}** above the line`
  const gamePlan = result.status === 'qualified'
    ? 'Keep checking the live cutoff; a rank-based line can move while the cup is live.'
    : result.status === 'noGames'
      ? 'No remaining-game plan is available for this snapshot.'
      : `Average **${formatAverage(result.requiredPerGame, 1)}** points across each of **${formatPoints(result.gamesLeft)}** games.`
  const isLive = result.source === 'live'
  const title = isLive ? '🏆 POINTS READ // LIVE QUALIFICATION' : '🏆 POINTS READ // QUALIFICATION RACE'
  const snapshot = isLive
    ? `**${result.tournamentName || 'Live tournament'}**${result.roundType ? ` · ${result.roundType}` : ''}\n${result.region} · Epic leaderboard\n${result.ign}`
    : '**Manual snapshot**\nEnter the current cutoff from Epic or Streammaxxing.'
  const playerRead = isLive
    ? `**${formatPoints(result.currentPoints)}** current points\n${result.rank == null ? 'Rank unavailable' : `Rank **#${formatPoints(result.rank)}**`}\n${formatPoints(result.gamesPlayed)} games recorded`
    : `**${formatPoints(result.currentPoints)}** current points\nNo live player lookup\nUpdate after every game`
  const targetSource = isLive
    ? `**${liveTargetLine(result)}**\nExact event/window match\nCutoff can move as the board fills`
    : `**Manual cutoff**\n${result.pointsSourceNote}`
  const fieldNote = isLive
    ? `Exact live lookup for **${result.eventId}** / **${result.windowId}**. Run again after each game; the live qualifying line is not a fixed estimate.`
    : result.projectedAtPace == null
      ? 'Previous regions are not substituted for a current cutoff. This read is arithmetic only.'
      : `At the required pace, the snapshot finishes at **${formatPoints(result.projectedAtPace)}** points. Run again after every game with your new cumulative total.`

  return {
    author: { name: 'MAXX BOT  ·  FORTNITE TOOLS' },
    title,
    description: [
      `**${emoji} ${result.statusLabel}**`,
      `> ${result.guidance}`,
      '',
      `\`${progressBar(result.progressPercent)}\` **${formatPoints(result.currentPoints)} / ${formatPoints(result.targetWithBuffer)}** target line`,
      `*${result.progressPercent}% of the requested line*`,
    ].join('\n'),
    color,
    fields: [
      {
        name: 'TOURNAMENT SNAPSHOT',
        value: snapshot,
        inline: true,
      },
      {
        name: 'PLAYER READ',
        value: playerRead,
        inline: true,
      },
      {
        name: 'POINTS RACE',
        value: `${raceValue}\nSafe-line gap: **${formatPoints(result.toSafeLine)}**`,
        inline: true,
      },
      {
        name: 'GAMES LEFT',
        value: `**${formatPoints(result.gamesLeft)}** remaining\nRequired pace: **${pace}**`,
        inline: true,
      },
      {
        name: 'TARGET SOURCE',
        value: targetSource,
        inline: true,
      },
      {
        name: 'GAME PLAN',
        value: gamePlan,
        inline: true,
      },
      {
        name: 'FIELD NOTE',
        value: fieldNote,
        inline: false,
      },
    ],
    footer: { text: isLive ? 'Live Epic snapshot · private to you · update after every game' : 'Manual snapshot · private to you · update after every game' },
  }
}

function formatFinalsEmbed(result) {
  const color = result.status === 'noGames' ? 0xff4d6d : result.status === 'inPrize' ? 0xffc857 : 0xffa62b
  const currentPrize = prizeTierLine(result.currentTier)
  const nextPrize = result.targetTier
    ? `${prizeTierLine(result.targetTier)}\n${result.targetPoints == null ? 'Live boundary unavailable' : `Boundary: **${formatPoints(result.targetPoints)} pts**`}`
    : 'No better published tier than the current top band.'
  const gap = result.pointsToTarget == null ? 'Unavailable' : `${formatPoints(result.pointsToTarget)} live points`
  const pace = result.requiredPerGame == null ? 'Unavailable' : `${formatAverage(result.requiredPerGame, 1)} PPG`
  const freshness = result.boundaryFetchedAt ? `Boundary read: ${result.boundaryFetchedAt}` : 'Boundary timestamp unavailable'
  const prizeNote = result.prizeLadderVerified
    ? 'Amounts are from Epic payout metadata. Rank and boundary points are live projections.'
    : 'Epic returned a live standing, but prize amounts were not readable; no amount is guessed.'

  return {
    author: { name: 'MAXX BOT  ·  FORTNITE TOOLS' },
    title: '🏆 POINTS READ // FINALS PRIZE RACE',
    description: [
      `**${result.statusLabel}**`,
      `> ${result.guidance}`,
      '',
      `**${formatPoints(result.currentPoints)}** points · ${result.rank == null ? 'rank unavailable' : `rank **#${formatPoints(result.rank)}**`}`,
      `*Live Finals projection · ${result.region} · refresh after each game*`,
    ].join('\n'),
    color,
    fields: [
      {
        name: 'TOURNAMENT SNAPSHOT',
        value: `**${result.tournamentName || 'Finals'}**${result.roundType ? ` · ${result.roundType}` : ''}\n${result.region} · Epic leaderboard\n${result.ign || 'Epic account ID'}`,
        inline: true,
      },
      {
        name: 'PLAYER READ',
        value: `**${formatPoints(result.currentPoints)}** current points\n${result.rank == null ? 'Rank unavailable' : `Rank **#${formatPoints(result.rank)}**`}\n${formatPoints(result.gamesPlayed ?? 0)} games recorded`,
        inline: true,
      },
      {
        name: 'CURRENT PRIZE BAND',
        value: currentPrize,
        inline: true,
      },
      {
        name: 'NEXT BETTER TIER',
        value: nextPrize,
        inline: true,
      },
      {
        name: 'PRIZE RACE',
        value: `Gap: **${gap}**\nRequired pace: **${pace}**\nGames left: **${formatPoints(result.gamesLeft)}**`,
        inline: true,
      },
      {
        name: 'SOURCE & FRESHNESS',
        value: `${prizeNote}\n${freshness}\nNo other region or prior tournament is substituted.`,
        inline: true,
      },
      {
        name: 'FIELD NOTE',
        value: 'This is a live projection, not a final cutoff. Ties, late scores, and remaining games can move the rank and every boundary.',
        inline: false,
      },
    ],
    footer: { text: 'Live Epic Finals snapshot · private to you · update after every game' },
  }
}

export { calculatePointsForecast, calculatePrizeRace, formatPointsDiscord, formatPointsEmbed }
