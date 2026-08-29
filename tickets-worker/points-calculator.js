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

function formatPointsDiscord(result) {
  if (!result || !result.ok) return `Points calculator: ${result?.error || 'check your inputs.'}`
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

export { calculatePointsForecast, formatPointsDiscord, formatPointsEmbed }
