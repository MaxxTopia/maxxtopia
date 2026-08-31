// Pure Fortnite storm math shared by the HTTP worker's /storm command.
// Keep this manual-input only: it does not read a game client or live lobby.
// The reference timing tables are useful defaults, but the in-game timer and
// current damage tick always win when a playlist or patch differs.

const STANDARD_THRESHOLDS = Object.freeze({
  warningDamage: 500,
  sicknessDamage: 600,
  sicknessMultiplier: 3,
})

const COMP_REFERENCE_LABEL = 'Chapter 7 Season 1 · Comp'

const RULESETS = Object.freeze({
  battleRoyale: Object.freeze({
    key: 'battleRoyale',
    label: 'Battle Royale',
    referenceLabel: COMP_REFERENCE_LABEL,
    openingWaitSeconds: 60,
    note: 'Chapter 7 Season 1 Comp reference (user-supplied Kinch Analytics table). Damage values follow merged phase cells in that table; use the advanced override only when the in-game tick differs.',
    timingWarning: 'This is a Comp timing reference, not a live game feed. Ranked, pubs, and playlist/map variants can use another timing track; trust the in-game countdown and damage tick.',
    thresholdNote: 'Storm Sickness baseline: 500 warning / 600 sickness / 3x damage. Damage is cumulative, not player HP. This read stops at the practical leave-now sickness rule and does not model a hard-stop cap.',
    thresholds: STANDARD_THRESHOLDS,
    zones: Object.freeze([
      Object.freeze({ zone: 1, wait: 110, close: 85, total: 255, dps: 1 }),
      Object.freeze({ zone: 2, wait: 60, close: 90, total: 405, dps: 1 }),
      Object.freeze({ zone: 3, wait: 50, close: 100, total: 555, dps: 1 }),
      Object.freeze({ zone: 4, wait: 70, close: 85, total: 710, dps: 1 }),
      Object.freeze({ zone: 5, wait: 40, close: 70, total: 820, dps: 2 }),
      Object.freeze({ zone: 6, wait: 40, close: 70, total: 930, dps: 5 }),
      Object.freeze({ zone: 7, wait: 35, close: 60, total: 1025, dps: 8 }),
      Object.freeze({ zone: 8, wait: 20, close: 60, total: 1105, dps: 10 }),
      Object.freeze({ zone: 9, wait: 0, close: 55, total: 1160, dps: 10 }),
      Object.freeze({ zone: 10, wait: 0, close: 50, total: 1210, dps: 10 }),
      Object.freeze({ zone: 11, wait: 0, close: 50, total: 1260, dps: 10 }),
      Object.freeze({ zone: 12, wait: 0, close: 90, total: 1350, dps: 10 }),
    ]),
  }),
  reload: Object.freeze({
    key: 'reload',
    label: 'Reload',
    referenceLabel: COMP_REFERENCE_LABEL,
    openingWaitSeconds: 0,
    note: 'Chapter 7 Season 1 Comp Reload reference (user-supplied Kinch Analytics table). Damage values follow merged phase cells in that table; use the advanced override only when the in-game tick differs.',
    timingWarning: 'This is a Comp Reload timing reference, not a live game feed. Reload maps and variants are not one timing track (including faster Mini-Venture pacing); trust the in-game countdown and damage tick.',
    thresholdNote: 'Storm Sickness baseline: 500 warning / 600 sickness / 3x damage. Damage is cumulative, not player HP. This read stops at the practical leave-now sickness rule and does not model a hard-stop cap.',
    thresholds: STANDARD_THRESHOLDS,
    zones: Object.freeze([
      Object.freeze({ zone: 1, wait: 40, close: 80, total: 120, dps: 1 }),
      Object.freeze({ zone: 2, wait: 40, close: 70, total: 230, dps: 1 }),
      Object.freeze({ zone: 3, wait: 25, close: 70, total: 325, dps: 1 }),
      Object.freeze({ zone: 4, wait: 25, close: 70, total: 420, dps: 1 }),
      Object.freeze({ zone: 5, wait: 50, close: 70, total: 540, dps: 1 }),
      Object.freeze({ zone: 6, wait: 50, close: 70, total: 660, dps: 2 }),
      Object.freeze({ zone: 7, wait: 35, close: 60, total: 755, dps: 5 }),
      Object.freeze({ zone: 8, wait: 20, close: 60, total: 835, dps: 8 }),
      Object.freeze({ zone: 9, wait: 0, close: 55, total: 890, dps: 10 }),
      Object.freeze({ zone: 10, wait: 0, close: 50, total: 940, dps: 10 }),
      Object.freeze({ zone: 11, wait: 0, close: 50, total: 990, dps: 10 }),
      Object.freeze({ zone: 12, wait: 0, close: 90, total: 1080, dps: 10 }),
    ]),
  }),
})

const THRESHOLDS = STANDARD_THRESHOLDS

function getProfile(mode) {
  return RULESETS[mode] || RULESETS.battleRoyale
}

function finite(value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function optionalNumber(value) {
  if (value == null || String(value).trim() === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function timeToThreshold(damage, threshold, dps, thresholds = THRESHOLDS) {
  if (damage >= threshold) return 0
  if (!(dps > 0)) return null
  if (threshold <= thresholds.sicknessDamage) return (threshold - damage) / dps
  if (damage < thresholds.sicknessDamage) {
    return (thresholds.sicknessDamage - damage) / dps
      + (threshold - thresholds.sicknessDamage) / (dps * thresholds.sicknessMultiplier)
  }
  return (threshold - damage) / (dps * thresholds.sicknessMultiplier)
}

function forecastDamage(damage, dps, seconds, thresholds = THRESHOLDS) {
  let projected = damage
  let remaining = Math.max(0, seconds)
  if (!(dps > 0) || remaining <= 0) return projected
  if (projected < thresholds.sicknessDamage) {
    const secondsToSickness = (thresholds.sicknessDamage - projected) / dps
    const beforeSickness = Math.min(remaining, secondsToSickness)
    projected += beforeSickness * dps
    remaining -= beforeSickness
  }
  if (remaining > 0 && projected >= thresholds.sicknessDamage) {
    projected += remaining * dps * thresholds.sicknessMultiplier
  }
  return projected
}

function statusForDamage(damage, thresholds = THRESHOLDS) {
  if (damage >= thresholds.sicknessDamage) return 'sickness'
  if (damage >= thresholds.warningDamage) return 'warning'
  return 'safe'
}

function advanceDamage(damage, dps, seconds, thresholds = THRESHOLDS) {
  return forecastDamage(damage, dps, seconds, thresholds)
}

function buildReferenceSegments(profile, entry, zone, phase, time, dpsOverride) {
  const segments = [{
    label: `Zone ${zone} ${phase}`,
    seconds: time,
    dps: dpsOverride == null ? entry.dps : dpsOverride,
  }]
  if (dpsOverride != null) return { segments, available: false }

  if (phase === 'waiting') {
    segments.push({ label: `Zone ${zone} closing`, seconds: entry.close, dps: entry.dps })
  }
  for (const next of profile.zones) {
    if (next.zone <= zone) continue
    segments.push({ label: `Zone ${next.zone} waiting`, seconds: next.wait, dps: next.dps })
    segments.push({ label: `Zone ${next.zone} closing`, seconds: next.close, dps: next.dps })
  }
  return { segments, available: true }
}

function findThresholdAcrossSegments(damage, segments, threshold, thresholds = THRESHOLDS) {
  let projected = damage
  let elapsed = 0
  for (const segment of segments) {
    const seconds = Math.max(0, Number(segment.seconds) || 0)
    const toThreshold = timeToThreshold(projected, threshold, segment.dps, thresholds)
    if (toThreshold != null && toThreshold <= seconds) {
      return {
        seconds: elapsed + Math.max(0, toThreshold),
        segment: segment.label,
      }
    }
    projected = forecastDamage(projected, segment.dps, seconds, thresholds)
    elapsed += seconds
  }
  return null
}

function formatStormTimer(seconds) {
  if (seconds == null || !Number.isFinite(Number(seconds))) return '--:--'
  const value = Math.max(0, Math.ceil(Number(seconds)))
  const minutes = Math.floor(value / 60)
  const remainder = value % 60
  return `${minutes}:${String(remainder).padStart(2, '0')}`
}

function calculateStormForecast(input = {}) {
  const profile = getProfile(input.mode)
  const thresholds = profile.thresholds || THRESHOLDS
  const zone = Math.floor(finite(input.zone, 0))
  const entry = profile.zones.find(item => item.zone === zone)
  const phase = input.phase === 'closing' ? 'closing' : input.phase === 'waiting' ? 'waiting' : ''
  const timeLeftSeconds = Math.max(0, finite(input.timeLeftSeconds, NaN))
  const damageTaken = Math.max(0, finite(input.damageTaken, NaN))
  const dpsOverride = optionalNumber(input.dpsOverride)
  const exposure = input.exposure === 'safe' ? 'safe' : 'inStorm'
  const isInStorm = exposure === 'inStorm'

  if (!entry) return { ok: false, error: `Choose a zone from 1 to ${profile.zones.length}.` }
  if (!phase) return { ok: false, error: 'Choose waiting or closing for the phase.' }
  if (!Number.isFinite(timeLeftSeconds)) return { ok: false, error: 'Enter the seconds left in the phase.' }
  if (!Number.isFinite(damageTaken)) return { ok: false, error: 'Enter cumulative storm damage taken.' }
  if (dpsOverride != null && (!(dpsOverride >= 0) || dpsOverride > 100)) return { ok: false, error: 'DPS override must be between 0 and 100.' }

  const time = Math.min(3600, timeLeftSeconds)
  const damage = damageTaken
  const baseDps = dpsOverride == null ? entry.dps : dpsOverride
  const status = statusForDamage(damage, thresholds)
  const reference = buildReferenceSegments(profile, entry, zone, phase, time, dpsOverride)
  const warningCrossing = findThresholdAcrossSegments(damage, reference.segments, thresholds.warningDamage, thresholds)
  const sicknessCrossing = findThresholdAcrossSegments(damage, reference.segments, thresholds.sicknessDamage, thresholds)
  const referenceTimeToWarningInPhase = timeToThreshold(damage, thresholds.warningDamage, baseDps, thresholds)
  const referenceTimeToSicknessInPhase = timeToThreshold(damage, thresholds.sicknessDamage, baseDps, thresholds)
  const timeToWarningSeconds = isInStorm ? referenceTimeToWarningInPhase : null
  const timeToSicknessSeconds = isInStorm ? referenceTimeToSicknessInPhase : null
  const leaveTimerSeconds = !isInStorm
    ? null
    : status === 'sickness'
    ? 0
    : timeToSicknessSeconds != null && timeToSicknessSeconds <= time
      ? Math.max(0, time - timeToSicknessSeconds)
      : null
  const referencePhaseEndDamage = forecastDamage(damage, baseDps, time, thresholds)
  const forecastAtPhaseEnd = isInStorm ? referencePhaseEndDamage : damage
  const referenceTimelineDurationSeconds = reference.segments.reduce((total, segment) => total + Math.max(0, Number(segment.seconds) || 0), 0)
  const referenceEndDamage = reference.segments.reduce(
    (projected, segment) => forecastDamage(projected, segment.dps, segment.seconds, thresholds),
    damage,
  )
  const result = {
    ok: true,
    mode: profile.key,
    modeLabel: profile.label,
    referenceLabel: profile.referenceLabel,
    profileNote: profile.note,
    timingWarning: profile.timingWarning,
    thresholdNote: profile.thresholdNote,
    zone,
    phase,
    phaseLabel: phase === 'waiting' ? 'WAITING' : 'CLOSING',
    phaseDurationSeconds: phase === 'waiting' ? entry.wait : entry.close,
    referenceOpeningWaitSeconds: profile.openingWaitSeconds,
    // `entry.total` is the table's absolute match-clock timestamp at the end
    // of this zone. It is not the amount of time remaining in the phase; the
    // player-entered countdown above is the source of truth for that.
    referenceZoneEndMatchClockSeconds: entry.total,
    referencePhaseEndSeconds: entry.total,
    referenceDps: entry.dps,
    timeLeftSeconds: time,
    damageTaken: damage,
    exposure,
    isInStorm,
    timersRunning: isInStorm,
    baseDps,
    activeDps: isInStorm ? (status === 'sickness' ? baseDps * thresholds.sicknessMultiplier : baseDps) : 0,
    dpsOverridden: dpsOverride != null,
    warningDamage: thresholds.warningDamage,
    sicknessDamage: thresholds.sicknessDamage,
    sicknessMultiplier: thresholds.sicknessMultiplier,
    timeToWarningSeconds,
    timeToSicknessSeconds,
    referenceTimeToWarningSeconds: warningCrossing?.seconds ?? null,
    referenceTimeToSicknessSeconds: sicknessCrossing?.seconds ?? null,
    referenceWarningSegment: warningCrossing?.segment || null,
    referenceSicknessSegment: sicknessCrossing?.segment || null,
    referenceTimelineAvailable: reference.available,
    referenceTimelineDurationSeconds,
    leaveTimerSeconds,
    forecastAtPhaseEnd,
    referenceForecastAtPhaseEnd: referencePhaseEndDamage,
    forecastAtReferenceEnd: referenceEndDamage,
    status,
  }
  result.statusLabel = {
    safe: `SAFE · UNDER ${formatDamage(result.warningDamage)}`,
    warning: `WARNING · ${formatDamage(result.warningDamage)}–${formatDamage(result.sicknessDamage - 1)}`,
    sickness: `MAX THREAT · ${formatDamage(result.sicknessDamage)}+`,
  }[status]
  result.threatLabel = {
    safe: 'SAFE',
    warning: 'WARNING',
    sickness: 'MAX THREAT',
  }[status]
  result.guidance = !isInStorm
    ? `Storm clocks are paused while you are safe. If you enter now and stay exposed, the ${formatDamage(result.warningDamage)} warning is about ${formatDuration(result.referenceTimeToWarningSeconds)} away${result.referenceWarningSegment ? ` during ${result.referenceWarningSegment}` : ''}.`
    : status === 'sickness'
    ? `Leave storm now. ${formatDamage(result.sicknessDamage)} cumulative damage is MAX THREAT; the storm tick is now ${formatDamage(result.activeDps)} damage/sec.`
    : result.leaveTimerSeconds != null
      ? `Leave when the storm timer shows ${formatStormTimer(result.leaveTimerSeconds)} — about ${formatDuration(result.timeToSicknessSeconds)} from now. ${formatDamage(result.sicknessDamage)} is MAX THREAT and triples storm damage.`
      : result.referenceTimeToSicknessSeconds != null
        ? `${result.threatLabel === 'WARNING' ? 'WARNING: keep rotating.' : 'Below warning.'} MAX THREAT starts in about ${formatDuration(result.referenceTimeToSicknessSeconds)} on the reference timeline; recheck when the phase changes.`
        : result.referenceTimeToWarningSeconds != null
          ? `Below warning. The ${formatDamage(result.warningDamage)} warning starts in about ${formatDuration(result.referenceTimeToWarningSeconds)}; recheck when the phase changes.`
          : result.baseDps === 0
            ? 'No damage is expected on this reference during the current phase. Verify the in-game tick before staying longer.'
            : 'No threshold crossing is forecast on the remaining reference timeline. Recheck the in-game timer and storm tick when the phase changes.'
  return result
}

function formatDuration(seconds) {
  if (seconds == null || !Number.isFinite(Number(seconds))) return 'never'
  const value = Math.max(0, Math.ceil(Number(seconds)))
  if (value === 0) return 'now'
  const hours = Math.floor(value / 3600)
  const minutes = Math.floor((value % 3600) / 60)
  const remainder = value % 60
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`
  return `${minutes}:${String(remainder).padStart(2, '0')}`
}

function formatDamage(value) {
  if (!Number.isFinite(Number(value))) return '-'
  return Math.round(Number(value)).toLocaleString('en-US')
}

function leaveCallText(result) {
  if (!result.isInStorm) {
    return `No active leave countdown while safe. If you enter now, recheck the timer and plan around the ${formatDamage(result.sicknessDamage)} max-threat line.`
  }
  if (result.status === 'sickness') {
    return `LEAVE NOW — ${formatDamage(result.sicknessDamage)}+ is MAX THREAT; the storm tick is ${formatDamage(result.activeDps)} damage/sec.`
  }
  if (result.leaveTimerSeconds != null) {
    return `Leave when the storm timer shows ${formatStormTimer(result.leaveTimerSeconds)} (about ${formatDuration(result.timeToSicknessSeconds)} from now).`
  }
  if (result.referenceTimeToSicknessSeconds != null) {
    return `No immediate leave timer. MAX THREAT starts in about ${formatDuration(result.referenceTimeToSicknessSeconds)} on the reference timeline; recheck when the phase changes.`
  }
  return 'No 600 crossing is forecast on the remaining reference timeline. Verify the in-game tick before staying longer.'
}

function thresholdTimeText(seconds, reached = 'REACHED') {
  return seconds === 0 ? reached : formatDuration(seconds)
}

function formatStormDiscord(result) {
  if (!result || !result.ok) return `Storm calculator: ${result?.error || 'check your inputs.'}`
  return [
    `Storm Sickness Calculator · ${result.modeLabel}`,
    `${result.threatLabel} — ${result.statusLabel}`,
    `LEAVE CALL: ${leaveCallText(result)}`,
    `Now: Zone ${result.zone} · ${result.phaseLabel} · ${formatDuration(result.timeLeftSeconds)} left · ${formatDamage(result.damageTaken)} damage · ${result.isInStorm ? 'IN STORM' : 'SAFE NOW'}`,
    `Active tick: ${formatDamage(result.activeDps)} damage/sec${result.dpsOverridden ? ' (custom reference)' : ''}`,
    `${result.isInStorm ? 'Continuous-exposure timers' : 'If entering now and staying exposed'}: 500 warning ${thresholdTimeText(result.referenceTimeToWarningSeconds)} · 600 MAX THREAT ${thresholdTimeText(result.referenceTimeToSicknessSeconds)}`,
    `At current timer 0 (${formatStormTimer(result.timeLeftSeconds)}): ${formatDamage(result.forecastAtPhaseEnd)} damage${result.isInStorm ? '' : ` (enter-now reference: ${formatDamage(result.referenceForecastAtPhaseEnd)})`}`,
    `Table reference: Zone ${result.zone} ends at match clock ${formatStormTimer(result.referenceZoneEndMatchClockSeconds)}; your in-game timer is the live source of truth.`,
    `Read: ${result.guidance}`,
    `Reference: ${result.referenceLabel}. ${result.timingWarning}`,
  ].join('\n')
}

function formatStormEmbed(result) {
  if (!result || !result.ok) return null
  const color = result.status === 'sickness'
    ? 0xff4d6d
    : result.status === 'warning'
      ? 0xffc857
      : 0x30d158
  const emoji = result.status === 'sickness' ? '🛑' : result.status === 'warning' ? '⚠️' : '✅'
  const damage = Math.max(0, Number(result.damageTaken) || 0)
  const sicknessDamage = Math.max(1, Number(result.sicknessDamage) || 1)
  const progress = Math.min(10, Math.max(0, Math.round(damage / sicknessDamage * 10)))
  const damageBar = `${'█'.repeat(progress)}${'░'.repeat(10 - progress)}`
  const warning = thresholdTimeText(result.referenceTimeToWarningSeconds)
  const sickness = thresholdTimeText(result.referenceTimeToSicknessSeconds)
  const referenceDetails = [
    result.referenceWarningSegment ? `500 starts during ${result.referenceWarningSegment}.` : '',
    result.referenceSicknessSegment ? `600 starts during ${result.referenceSicknessSegment}.` : '',
  ].filter(Boolean).join(' ')

  return {
    author: { name: 'MAXX BOT  ·  FORTNITE TOOLS' },
    title: '⚡ STORM SICKNESS CALCULATOR',
    description: [
      `**${emoji} ${result.statusLabel}**`,
      `> ${result.guidance}`,
      '',
      `\`${damageBar}\` **${formatDamage(damage)} / ${formatDamage(sicknessDamage)}** cumulative`,
    ].join('\n'),
    color,
    fields: [
      {
        name: 'LEAVE CALL',
        value: `**${leaveCallText(result)}**`,
        inline: false,
      },
      {
        name: 'CURRENT READ',
        value: `**Zone ${result.zone}** · ${result.phaseLabel} · **${result.isInStorm ? 'IN STORM' : 'SAFE NOW'}**\n${formatStormTimer(result.timeLeftSeconds)} left · active tick ${formatDamage(result.activeDps)}/sec${result.dpsOverridden ? ' · custom reference' : ''}`,
        inline: true,
      },
      {
        name: 'THREAT TIERS',
        value: `✅ SAFE · 0–${formatDamage(result.warningDamage - 1)}\n⚠️ WARNING · ${formatDamage(result.warningDamage)}–${formatDamage(result.sicknessDamage - 1)}\n🛑 MAX THREAT · ${formatDamage(result.sicknessDamage)}+ → ${result.sicknessMultiplier}x damage`,
        inline: true,
      },
      {
        name: result.isInStorm ? 'CONTINUOUS-EXPOSURE TIMERS' : 'IF YOU ENTER NOW',
        value: `500 warning: **${warning}**\n600 max threat: **${sickness}**\nPhase end: **${formatDamage(result.forecastAtPhaseEnd)}** damage${result.isInStorm ? '' : ` · entry-now ref **${formatDamage(result.referenceForecastAtPhaseEnd)}**`}`,
        inline: true,
      },
      {
        name: 'REFERENCE TIMELINE',
        value: `${result.referenceLabel}. Your current phase ends in **${formatStormTimer(result.timeLeftSeconds)}**; the table places the end of Zone ${result.zone} at match clock **${formatStormTimer(result.referenceZoneEndMatchClockSeconds)}**. ${referenceDetails || 'No threshold crossing is forecast on the remaining continuous-exposure timeline.'}\n${result.timingWarning}`,
        inline: false,
      },
    ],
    footer: { text: `Private quick read · ${result.isInStorm ? 'timers assume continuous exposure' : 'clocks paused while safe'} · verify the in-game timer and tick` },
  }
}

export { RULESETS, THRESHOLDS, calculateStormForecast, advanceDamage, formatStormDiscord, formatStormEmbed }
