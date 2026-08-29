// Pure Fortnite storm math shared by the HTTP worker's /storm command.
// Keep this manual-input only: it does not read a game client or live lobby.
// The reference timing tables are useful defaults, but the in-game timer and
// current damage tick always win when a playlist or patch differs.

const STANDARD_THRESHOLDS = Object.freeze({
  warningDamage: 500,
  sicknessDamage: 600,
  sicknessMultiplier: 3,
})

const RULESETS = Object.freeze({
  battleRoyale: Object.freeze({
    key: 'battleRoyale',
    label: 'Battle Royale',
    note: '12-zone reference timing table; verify the live in-game countdown.',
    timingWarning: 'Reference timings can change after a patch or playlist change. Use the in-game countdown and the DPS override when they differ.',
    thresholdNote: 'Storm Sickness baseline: 500 warning / 600 sickness / 3x damage. Damage is cumulative, not player HP. This read stops at the practical leave-now sickness rule and does not model a hard-stop cap.',
    thresholds: STANDARD_THRESHOLDS,
    zones: Object.freeze([
      Object.freeze({ zone: 1, wait: 120, close: 110, dps: 1 }),
      Object.freeze({ zone: 2, wait: 90, close: 110, dps: 1 }),
      Object.freeze({ zone: 3, wait: 95, close: 95, dps: 1 }),
      Object.freeze({ zone: 4, wait: 90, close: 90, dps: 1 }),
      Object.freeze({ zone: 5, wait: 50, close: 70, dps: 1 }),
      Object.freeze({ zone: 6, wait: 50, close: 70, dps: 2 }),
      Object.freeze({ zone: 7, wait: 50, close: 70, dps: 5 }),
      Object.freeze({ zone: 8, wait: 35, close: 60, dps: 8 }),
      Object.freeze({ zone: 9, wait: 20, close: 60, dps: 10 }),
      Object.freeze({ zone: 10, wait: 0, close: 55, dps: 10 }),
      Object.freeze({ zone: 11, wait: 0, close: 50, dps: 10 }),
      Object.freeze({ zone: 12, wait: 0, close: 80, dps: 10 }),
    ]),
  }),
  reload: Object.freeze({
    key: 'reload',
    label: 'Reload',
    note: 'Standard 12-zone Reload reference timing table; current Mini-Venture pacing is faster.',
    timingWarning: 'Current Reload maps are not one timing track. The v42.00 notes call out faster Mini-Venture pacing, so use the in-game countdown or enter the current DPS override for Mini-Venture.',
    thresholdNote: 'Storm Sickness baseline: 500 warning / 600 sickness / 3x damage. Damage is cumulative, not player HP. This read stops at the practical leave-now sickness rule and does not model a hard-stop cap.',
    thresholds: STANDARD_THRESHOLDS,
    zones: Object.freeze([
      Object.freeze({ zone: 1, wait: 50, close: 90, dps: 1 }),
      Object.freeze({ zone: 2, wait: 60, close: 50, dps: 1 }),
      Object.freeze({ zone: 3, wait: 50, close: 45, dps: 1 }),
      Object.freeze({ zone: 4, wait: 50, close: 45, dps: 1 }),
      Object.freeze({ zone: 5, wait: 45, close: 40, dps: 1 }),
      Object.freeze({ zone: 6, wait: 40, close: 35, dps: 2 }),
      Object.freeze({ zone: 7, wait: 40, close: 35, dps: 5 }),
      Object.freeze({ zone: 8, wait: 35, close: 35, dps: 8 }),
      Object.freeze({ zone: 9, wait: 30, close: 35, dps: 10 }),
      Object.freeze({ zone: 10, wait: 0, close: 65, dps: 10 }),
      Object.freeze({ zone: 11, wait: 0, close: 75, dps: 10 }),
      Object.freeze({ zone: 12, wait: 0, close: 70, dps: 10 }),
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

function calculateStormForecast(input = {}) {
  const profile = getProfile(input.mode)
  const thresholds = profile.thresholds || THRESHOLDS
  const zone = Math.floor(finite(input.zone, 0))
  const entry = profile.zones.find(item => item.zone === zone)
  const phase = input.phase === 'closing' ? 'closing' : input.phase === 'waiting' ? 'waiting' : ''
  const timeLeftSeconds = Math.max(0, finite(input.timeLeftSeconds, NaN))
  const damageTaken = Math.max(0, finite(input.damageTaken, NaN))
  const dpsOverride = optionalNumber(input.dpsOverride)

  if (!entry) return { ok: false, error: `Choose a zone from 1 to ${profile.zones.length}.` }
  if (!phase) return { ok: false, error: 'Choose waiting or closing for the phase.' }
  if (!Number.isFinite(timeLeftSeconds)) return { ok: false, error: 'Enter the seconds left in the phase.' }
  if (!Number.isFinite(damageTaken)) return { ok: false, error: 'Enter cumulative storm damage taken.' }
  if (dpsOverride != null && (!(dpsOverride >= 0) || dpsOverride > 100)) return { ok: false, error: 'DPS override must be between 0 and 100.' }

  const time = Math.min(3600, timeLeftSeconds)
  const damage = damageTaken
  const baseDps = dpsOverride == null ? entry.dps : dpsOverride
  const status = statusForDamage(damage, thresholds)
  const result = {
    ok: true,
    mode: profile.key,
    modeLabel: profile.label,
    profileNote: profile.note,
    timingWarning: profile.timingWarning,
    thresholdNote: profile.thresholdNote,
    zone,
    phase,
    phaseLabel: phase === 'waiting' ? 'WAITING' : 'CLOSING',
    phaseDurationSeconds: phase === 'waiting' ? entry.wait : entry.close,
    referenceDps: entry.dps,
    timeLeftSeconds: time,
    damageTaken: damage,
    baseDps,
    activeDps: status === 'sickness' ? baseDps * thresholds.sicknessMultiplier : baseDps,
    dpsOverridden: dpsOverride != null,
    warningDamage: thresholds.warningDamage,
    sicknessDamage: thresholds.sicknessDamage,
    sicknessMultiplier: thresholds.sicknessMultiplier,
    timeToWarningSeconds: timeToThreshold(damage, thresholds.warningDamage, baseDps, thresholds),
    timeToSicknessSeconds: timeToThreshold(damage, thresholds.sicknessDamage, baseDps, thresholds),
    forecastAtPhaseEnd: forecastDamage(damage, baseDps, time, thresholds),
    status,
  }
  result.statusLabel = {
    safe: 'BELOW WARNING',
    warning: 'ROTATE SOON',
    sickness: 'LEAVE NOW',
  }[status]
  result.guidance = status === 'sickness'
    ? `Leave storm now. Storm Sickness is active at ${formatDamage(result.sicknessDamage)} damage; white heals are only a bridge while rotating.`
    : result.timeToSicknessSeconds != null && result.timeToSicknessSeconds <= result.timeLeftSeconds
      ? `Rotate before ${formatDuration(result.timeToSicknessSeconds)}. At ${formatDamage(result.sicknessDamage)} damage, Storm Sickness starts and the tick becomes ${formatDamage(result.activeDps)} DPS.`
      : result.timeToWarningSeconds != null && result.timeToWarningSeconds <= result.timeLeftSeconds
        ? `The ${formatDamage(result.warningDamage)} warning is reached in ${formatDuration(result.timeToWarningSeconds)}. Treat it as rotate-soon; do not plan to touch storm after ${formatDamage(result.sicknessDamage)}.`
        : `Below warning. You can stay temporarily at ${formatDamage(result.baseDps)} DPS, but re-check when the phase or DPS changes.`
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

function formatStormDiscord(result) {
  if (!result || !result.ok) return `Storm calculator: ${result?.error || 'check your inputs.'}`
  const dps = `${result.baseDps} DPS${result.dpsOverridden ? ' (override)' : ''}`
  const leaveBy = result.status === 'sickness'
    ? 'Leave-by: NOW'
    : `Leave-by: ${formatDuration(result.timeToSicknessSeconds)} before sickness`
  return [
    `Storm Sickness Calculator - ${result.modeLabel}`,
    `Zone ${result.zone} / ${result.phaseLabel} / ${formatDuration(result.timeLeftSeconds)} left / ${dps}`,
    `Read: ${result.statusLabel}`,
    `Damage: ${formatDamage(result.damageTaken)} / ${result.warningDamage} warning / ${result.sicknessDamage} sickness`,
    leaveBy,
    `Warning: ${formatDuration(result.timeToWarningSeconds)} | Sickness: ${formatDuration(result.timeToSicknessSeconds)} | After sickness: ${result.sicknessMultiplier}x damage`,
    `At phase end: ${formatDamage(result.forecastAtPhaseEnd)} damage`,
    `Playbook: ${result.guidance}`,
    result.thresholdNote,
    result.timingWarning,
  ].join('\n')
}

function formatStormEmbed(result) {
  if (!result || !result.ok) return null
  const warning = result.status === 'warning' || result.status === 'sickness'
    ? 'REACHED'
    : formatDuration(result.timeToWarningSeconds)
  const sickness = result.status === 'sickness'
    ? 'ACTIVE'
    : formatDuration(result.timeToSicknessSeconds)
  const leaveBy = result.status === 'sickness'
    ? 'NOW'
    : formatDuration(result.timeToSicknessSeconds)
  const color = result.status === 'sickness'
    ? 0xff4d6d
    : result.status === 'warning'
      ? 0xffc857
      : 0x30d158
  const emoji = result.status === 'sickness' ? '🛑' : result.status === 'warning' ? '⚠️' : '✅'
  const dps = `${result.baseDps} DPS${result.dpsOverridden ? ' (override)' : ''}`
  const damage = Math.max(0, Number(result.damageTaken) || 0)
  const sicknessDamage = Math.max(1, Number(result.sicknessDamage) || 1)
  const progress = Math.min(10, Math.max(0, Math.round(damage / sicknessDamage * 10)))
  const damageBar = `${'█'.repeat(progress)}${'░'.repeat(10 - progress)}`

  return {
    author: { name: 'MAXX BOT  ·  FORTNITE TOOLS' },
    title: '⚡ STORM READ // ROTATE WINDOW',
    description: [
      `**${emoji} ${result.statusLabel}**`,
      `> ${result.guidance}`,
      '',
      `\`${damageBar}\` **${formatDamage(damage)} / ${formatDamage(sicknessDamage)}** cumulative`,
    ].join('\n'),
    color,
    fields: [
      {
        name: 'MATCH SNAPSHOT',
        value: `**Zone ${result.zone}** · ${result.phaseLabel}\n${formatDuration(result.timeLeftSeconds)} left · ${dps}`,
        inline: true,
      },
      {
        name: 'DAMAGE TRACKER',
        value: `**${formatDamage(damage)}** now\n${result.warningDamage} warning · ${result.sicknessDamage} sickness\nAfter sickness: **${result.sicknessMultiplier}x** damage`,
        inline: true,
      },
      {
        name: 'ROTATE WINDOW',
        value: `Leave before sickness: **${leaveBy}**\nWarning: ${warning} · Sickness: ${sickness}`,
        inline: true,
      },
      {
        name: 'PHASE OUTLOOK',
        value: `Stay through this phase → **${formatDamage(result.forecastAtPhaseEnd)}** cumulative damage`,
        inline: true,
      },
      {
        name: 'RULES OF THE READ',
        value: `${result.warningDamage} warning → ${result.sicknessDamage} sickness → ${result.sicknessMultiplier}x damage after sickness`,
        inline: true,
      },
      {
        name: 'FIELD NOTE',
        value: `${result.thresholdNote}\n${result.timingWarning}`,
        inline: false,
      },
    ],
    footer: { text: 'Manual snapshot · private to you · verify the in-game timer and DPS' },
  }
}

export { RULESETS, THRESHOLDS, calculateStormForecast, advanceDamage, formatStormDiscord, formatStormEmbed }
