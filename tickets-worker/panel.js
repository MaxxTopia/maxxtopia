// Shared Discord UI for the private Maxx Bot utility panel.
//
// The panel is intentionally a control surface, not a chat channel: users
// choose a tool, fill a private modal, and receive an ephemeral result. Keep
// the slash commands registered as a fallback for users who prefer them.

import { REGIONS } from './points-live.js'

const MSG_FLAG_EPHEMERAL = 1 << 6
// Searchable in the message payload while remaining invisible in Discord.
const PANEL_SIGNATURE = '\u200b\u200c\u200d\ufeff'
const STORM_WIZARD_PREFIX = 'maxx:storm:wizard:'

const PANEL_IDS = Object.freeze({
  livePoints: 'maxx:points:live',
  manualPoints: 'maxx:points:manual',
  stormBattleRoyale: 'maxx:storm:br',
  stormReload: 'maxx:storm:reload',
  liveRegion: 'maxx:points:live:region',
  liveWindowPrefix: 'maxx:points:live:window:',
  liveSubmitPrefix: 'maxx:points:live:submit:',
  manualSubmit: 'maxx:points:manual:submit',
  stormSubmitPrefix: 'maxx:storm:submit:',
  stormWizardPrefix: STORM_WIZARD_PREFIX,
})

const PANEL_REGION_OPTIONS = Object.freeze(['ALL', ...REGIONS])

const REGION_DETAILS = Object.freeze({
  ALL: ['All regions', 'All supported regions'],
  NAC: ['North America Central', 'NAC leaderboard'],
  EU: ['Europe', 'EU leaderboard'],
  NAW: ['North America West', 'NAW leaderboard'],
  BR: ['Brazil', 'BR leaderboard'],
  ASIA: ['Asia', 'ASIA leaderboard'],
  OCE: ['Oceania', 'OCE leaderboard'],
  ME: ['Middle East', 'ME leaderboard'],
})

const STORM_ZONE_OPTIONS = Object.freeze(Array.from({ length: 12 }, (_, index) => ({
  value: String(index + 1),
  label: `Zone ${index + 1}`,
  description: index === 0 ? 'First closing zone' : index === 11 ? 'Final zone' : 'Current storm zone',
})))

const STORM_PHASE_OPTIONS = Object.freeze([
  { value: 'w', label: 'Waiting', description: 'The zone has not started closing' },
  { value: 'c', label: 'Closing', description: 'The zone is moving now' },
])

const STORM_TIME_OPTIONS = Object.freeze([
  { value: '120', label: '2:00 left', description: 'About two minutes remaining' },
  { value: '90', label: '1:30 left', description: 'About ninety seconds remaining' },
  { value: '60', label: '1:00 left', description: 'About one minute remaining' },
  { value: '45', label: '0:45 left', description: 'About forty-five seconds remaining' },
  { value: '30', label: '0:30 left', description: 'About thirty seconds remaining' },
  { value: '15', label: '0:15 left', description: 'About fifteen seconds remaining' },
  { value: '5', label: '0:05 left', description: 'Almost finished' },
  { value: '0', label: '0:00 left', description: 'Closing now' },
  { value: 'manual', label: 'Enter exact seconds', description: 'Type any whole number, such as 25' },
])

const STORM_DAMAGE_OPTIONS = Object.freeze([
  { value: '0', label: 'Fresh · 0', description: 'No storm damage taken' },
  { value: '250', label: 'Light · 250', description: 'A little storm damage taken' },
  { value: '500', label: 'Warning · 500', description: 'The warning threshold' },
  { value: '600', label: 'Sickness · 600', description: 'The sickness threshold' },
  { value: '900', label: 'Heavy · 900', description: 'Heavy accumulated damage' },
  { value: '1200', label: 'Critical · 1,200', description: 'Very heavy accumulated damage' },
  { value: 'manual', label: 'Enter exact damage', description: 'Type damage already taken, such as 25' },
])

function regionLabel(region) {
  return REGION_DETAILS[region]?.[0] || region
}

function regionDescription(region) {
  return REGION_DETAILS[region]?.[1] || 'Live regional leaderboard'
}

function encodeSegment(value) {
  return encodeURIComponent(String(value ?? '').trim())
}

function decodeSegment(value) {
  try {
    return decodeURIComponent(String(value ?? ''))
  } catch {
    return ''
  }
}

function truncate(value, max) {
  const text = String(value ?? '').trim()
  return text.length <= max ? text : `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`
}

function button(style, label, customId, emoji, options = {}) {
  return {
    type: 2,
    style,
    label,
    custom_id: customId,
    emoji: { name: emoji },
    ...(options.disabled ? { disabled: true } : {}),
  }
}

function textInput(customId, label, style = 1, options = {}) {
  return {
    type: 4,
    custom_id: customId,
    label,
    style,
    required: options.required !== false,
    placeholder: options.placeholder,
    value: options.value,
    min_length: options.minLength,
    max_length: options.maxLength,
  }
}

function row(...components) {
  return { type: 1, components: components.filter(Boolean) }
}

function select(customId, placeholder, options, selectedValue) {
  return {
    type: 3,
    custom_id: customId,
    placeholder,
    min_values: 1,
    max_values: 1,
    options: options.map(option => ({
      ...option,
      ...(option.value === selectedValue ? { default: true } : {}),
    })),
  }
}

function privateMessage({ embeds, content, components }) {
  return {
    ...(content ? { content } : {}),
    ...(embeds ? { embeds } : {}),
    ...(components ? { components } : {}),
    flags: MSG_FLAG_EPHEMERAL,
    allowed_mentions: { parse: [] },
  }
}

function buildFreeToolsPanel() {
  return {
    embed: {
      author: { name: 'MAXX BOT  ·  FORTNITE TOOLS' },
      title: '🎮 MAXX DESK // PRIVATE TOOLS',
      description: [
        '**Fast reads for comp. No channel spam.**',
        'Choose a tool below. Your form and result stay visible only to you.',
        '',
        'Live points: choose your region and event, then enter your Epic display name.',
        'Storm timing: choose BR or Reload, then your zone, phase, time left, and storm damage taken.',
        PANEL_SIGNATURE,
      ].join('\n'),
      color: 0x16c7b7,
      fields: [
        {
          name: '🏆 LIVE TOURNAMENT POINTS',
          value: 'Choose the exact live event and enter your Epic display name as shown in Fortnite. See your rank, target, and pace.',
          inline: true,
        },
        {
          name: '⚡ STORM TIMING',
          value: 'Choose BR or Reload, then pick your zone, phase, time left, and storm damage taken. Presets or exact values.',
          inline: true,
        },
      ],
      footer: { text: 'Maxx Bot · private tools · your newest result replaces the previous one' },
    },
    components: [
      row(
        button(1, 'Live tournament points', PANEL_IDS.livePoints, '🏆'),
        button(3, 'Storm · BR', PANEL_IDS.stormBattleRoyale, '⚡'),
        button(2, 'Storm · Reload', PANEL_IDS.stormReload, '🔁'),
      ),
    ],
  }
}

function buildLiveRegionPrompt() {
  const options = PANEL_REGION_OPTIONS.map(region => ({
    label: `${regionLabel(region)} (${region})`,
    value: region,
    description: regionDescription(region),
    emoji: { name: '🌐' },
  }))
  return privateMessage({
    embeds: [{
      author: { name: 'MAXX BOT  ·  LIVE POINTS' },
      title: '🏆 CHOOSE YOUR REGION',
      description: 'Choose a region. The next menu shows only exact live Epic windows; your selection is private.',
      color: 0x4d7cff,
      footer: { text: 'Exact region first · no cross-region cutoff is substituted' },
    }],
    components: [row({
      type: 3,
      custom_id: PANEL_IDS.liveRegion,
      placeholder: 'Choose a region',
      min_values: 1,
      max_values: 1,
      options,
    })],
  })
}

function encodeWindowValue(window) {
  const windowId = String(window?.windowId || '').trim()
  const value = encodeSegment(windowId)
  if (!windowId || value.length > 100) {
    const error = new Error('A live tournament window has an unsupported identity length.')
    error.code = 'invalidWindow'
    throw error
  }
  return value
}

function decodeWindowValue(value) {
  return decodeSegment(value)
}

function formatWindowRound(window) {
  const format = String(window?.format || '').trim().toLowerCase()
  if (format === 'final' || String(window?.roundType || '').toLowerCase().includes('final')) return 'FINALS · prize race'
  return 'QUALIFIERS · moving line'
}

function buildLiveTournamentPrompt(region, windows) {
  const liveWindows = Array.isArray(windows) ? windows : []
  const values = liveWindows.map(encodeWindowValue)
  if (new Set(values).size !== values.length) {
    const error = new Error('More than one live tournament shares the same window identity. Use /points live with the exact tournament name.')
    error.code = 'ambiguousWindow'
    throw error
  }
  if (liveWindows.length > 25) {
    const error = new Error('Too many live tournament windows to show in one menu. Use /points live with the exact tournament name.')
    error.code = 'tooManyWindows'
    throw error
  }

  const options = liveWindows.map((window, index) => {
    const round = formatWindowRound(window)
    const name = truncate(window.name || 'Unnamed tournament', 76)
    const windowRegion = String(window.region || region || '').trim().toUpperCase()
    const regionPrefix = region === 'ALL' && windowRegion ? `${regionLabel(windowRegion)} · ` : ''
    return {
      label: truncate(`${regionPrefix}${name} · ${round}`, 100),
      value: values[index],
      description: truncate(`${windowRegion || region} · exact live window · enter your Epic display name next`, 100),
      emoji: { name: round.startsWith('FINALS') ? '🏆' : '🏁' },
    }
  })

  return privateMessage({
    embeds: [{
      author: { name: 'MAXX BOT  ·  LIVE POINTS' },
      title: `🏆 LIVE WINDOWS // ${region}`,
      description: `Choose the exact live tournament. **${regionLabel(region)}** is locked for this lookup; Finals are marked as a prize race.`,
      color: 0xffc857,
      footer: { text: 'Fresh window list · the final lookup re-checks that it is still live' },
    }],
    components: [row({
      type: 3,
      custom_id: `${PANEL_IDS.liveWindowPrefix}${encodeSegment(region)}`,
      placeholder: 'Choose the live tournament',
      min_values: 1,
      max_values: 1,
      options,
    })],
  })
}

function buildLivePointsModal(region, windowId) {
  const encodedRegion = encodeSegment(region)
  const encodedWindowId = encodeSegment(windowId)
  const customId = `${PANEL_IDS.liveSubmitPrefix}${encodedRegion}:${encodedWindowId}`
  if (customId.length > 100) {
    const error = new Error('This live window identity is too long for a Discord form.')
    error.code = 'invalidWindow'
    throw error
  }
  return {
    custom_id: customId,
    title: `Live points · ${region}`,
    components: [
      row(textInput('epic_identity', 'Epic display name', 1, {
        placeholder: 'Exact name shown in Fortnite',
        maxLength: 100,
      })),
      row(textInput('games_left', 'Games left', 1, {
        placeholder: 'Example: 3',
        maxLength: 4,
      })),
      row(textInput('safety_cushion', 'Safety cushion (optional)', 1, {
        required: false,
        placeholder: 'Example: 10 points',
        maxLength: 10,
      })),
    ],
  }
}

function buildManualPointsModal() {
  return {
    custom_id: PANEL_IDS.manualSubmit,
    title: 'Manual points pace',
    components: [
      row(textInput('current_points', 'Current points', 1, { placeholder: 'Example: 120', maxLength: 12 })),
      row(textInput('target_points', 'Target points', 1, { placeholder: 'Example: 200', maxLength: 12 })),
      row(textInput('games_left', 'Games left', 1, { placeholder: 'Example: 3', maxLength: 4 })),
      row(textInput('safety_cushion', 'Safety cushion (optional)', 1, {
        required: false,
        placeholder: 'Example: 10 points',
        maxLength: 10,
      })),
    ],
  }
}

function buildStormModal(mode) {
  const modeKey = mode === 'reload' ? 'reload' : 'battleRoyale'
  return {
    custom_id: `${PANEL_IDS.stormSubmitPrefix}${modeKey}`,
    title: `${mode === 'reload' ? 'Reload' : 'Battle Royale'} storm timing`,
    components: [
      row(textInput('zone', 'Current zone (1–12)', 1, { placeholder: 'Example: 7', maxLength: 2 })),
      row(textInput('phase', 'Is the zone waiting or closing?', 1, { placeholder: 'Example: closing', maxLength: 7 })),
      row(textInput('time_left', 'Time left (seconds)', 1, { placeholder: 'Example: 30', maxLength: 4 })),
      row(textInput('damage_taken', 'Storm damage taken', 1, { placeholder: 'Example: 550', maxLength: 12 })),
      row(textInput('dps_override', 'Storm tick override (advanced)', 1, {
        required: false,
        placeholder: 'Leave blank unless you know exact damage/sec',
        maxLength: 8,
      })),
    ],
  }
}

function stormModeKey(mode) {
  return mode === 'reload' ? 'reload' : 'br'
}

function stormModeFromKey(modeKey) {
  return modeKey === 'reload' ? 'reload' : modeKey === 'br' ? 'battleRoyale' : null
}

function normalizeWholeNumber(value, max) {
  const text = String(value ?? '').trim()
  if (!/^\d+$/.test(text)) return ''
  const number = Number(text)
  return Number.isSafeInteger(number) && number <= max ? String(number) : ''
}

function normalizeStormWizardState(input = {}) {
  const zone = STORM_ZONE_OPTIONS.some(option => option.value === String(input.zone ?? ''))
    ? String(input.zone)
    : ''
  const phase = input.phase === 'waiting' || input.phase === 'closing' ? input.phase : ''
  const time = normalizeWholeNumber(input.time, 3600)
  const damage = normalizeWholeNumber(input.damage, 1000000)
  return { zone, phase, time, damage }
}

function stormWizardComplete(state) {
  return Boolean(state.zone && state.phase && state.time !== '' && state.damage !== '')
}

function stormPhaseToken(phase) {
  return phase === 'waiting' ? 'w' : phase === 'closing' ? 'c' : 'x'
}

function stormStateToken(value) {
  return value ? encodeSegment(value) : 'x'
}

function stormWizardCustomId(mode, inputState, action) {
  const state = normalizeStormWizardState(inputState)
  return [
    STORM_WIZARD_PREFIX.replace(/:$/, ''),
    stormModeKey(mode),
    stormStateToken(state.zone),
    stormPhaseToken(state.phase),
    stormStateToken(state.time),
    stormStateToken(state.damage),
    action,
  ].join(':')
}

function selectedLabel(options, value, empty = 'Not selected') {
  return options.find(option => option.value === value)?.label || empty
}

function formatNumber(value) {
  return Number(value).toLocaleString('en-US')
}

function stormTimeLabel(value) {
  const preset = selectedLabel(STORM_TIME_OPTIONS, value)
  return preset !== 'Not selected'
    ? preset
    : value !== '' && value != null
      ? `${formatNumber(value)}s left`
      : 'Not selected'
}

function stormDamageLabel(value) {
  const preset = selectedLabel(STORM_DAMAGE_OPTIONS, value)
  return preset !== 'Not selected'
    ? preset
    : value !== '' && value != null
      ? `${formatNumber(value)} damage`
      : 'Not selected'
}

function withCurrentOption(options, value, label, description) {
  if (value == null || value === '' || options.some(option => option.value === value)) return options
  return [...options, { value, label, description }]
}

function buildStormManualModal(mode, field, inputState = {}) {
  const modeKey = mode === 'reload' ? 'reload' : 'br'
  const state = normalizeStormWizardState(inputState)
  const isTime = field === 'time'
  const action = isTime ? 'manualTime' : field === 'damage' ? 'manualDamage' : null
  if (!action) return null
  const modeLabel = modeKey === 'reload' ? 'Reload' : 'Battle Royale'
  return {
    custom_id: stormWizardCustomId(modeKey, state, action),
    title: `${modeLabel} · ${isTime ? 'Exact time left' : 'Storm damage taken'}`,
    components: [row(textInput(
      'storm_manual_value',
      isTime ? 'Seconds left' : 'Damage already taken',
      1,
      {
        placeholder: 'Example: 25',
        value: isTime
          ? state.time !== '' ? state.time : undefined
          : state.damage !== '' ? state.damage : undefined,
        maxLength: isTime ? 4 : 7,
      },
    ))],
  }
}

function buildStormWizard(mode, inputState = {}, options = {}) {
  const modeKey = mode === 'reload' ? 'reload' : 'battleRoyale'
  const state = normalizeStormWizardState(inputState)
  const modeLabel = modeKey === 'reload' ? 'Reload' : 'Battle Royale'
  const zoneLabel = selectedLabel(STORM_ZONE_OPTIONS, state.zone)
  const phaseLabel = selectedLabel(STORM_PHASE_OPTIONS.map(option => ({
    ...option,
    value: option.value === 'w' ? 'waiting' : 'closing',
  })), state.phase)
  const timeLabel = stormTimeLabel(state.time)
  const damageLabel = stormDamageLabel(state.damage)
  const timeOptions = withCurrentOption(STORM_TIME_OPTIONS, state.time, `Exact · ${formatNumber(state.time)}s left`, 'Your exact time entry')
  const damageOptions = withCurrentOption(STORM_DAMAGE_OPTIONS, state.damage, `Exact · ${formatNumber(state.damage)} damage`, 'Your exact damage entry')
  const complete = stormWizardComplete(state)

  return privateMessage({
    embeds: [{
      author: { name: 'MAXX BOT  ·  STORM TIMING' },
      title: `⚡ ${modeLabel.toUpperCase()} // QUICK STORM READ`,
      description: [
        'Pick four quick values from your screen. Use **Enter exact** when a preset does not fit.',
        'Your result stays private and gives a leave call using the Chapter 7 Comp timing reference.',
        ...(options.notice ? ['', `⚠️ ${options.notice}`] : []),
      ].join('\n'),
      color: modeKey === 'reload' ? 0x7c67ff : 0xff8a3d,
      fields: [
        {
          name: 'CURRENT READ',
          value: `**${zoneLabel}** · ${phaseLabel} · ${timeLabel} · ${damageLabel}`,
          inline: false,
        },
        {
          name: complete ? 'READY' : 'NEXT',
          value: complete ? 'Tap **Get storm read** for your warning and leave timing.' : 'Choose one item in each menu, then tap **Get storm read**.',
          inline: false,
        },
      ],
      footer: { text: 'Quick reference · always confirm the in-game timer and storm tick' },
    }],
    components: [
      row(select(
        stormWizardCustomId(modeKey, state, 'zone'),
        `1/4 · Current zone${state.zone ? ` · ${zoneLabel}` : ''}`,
        STORM_ZONE_OPTIONS,
        state.zone,
      )),
      row(select(
        stormWizardCustomId(modeKey, state, 'phase'),
        `2/4 · Phase${state.phase ? ` · ${phaseLabel}` : ''}`,
        STORM_PHASE_OPTIONS,
        state.phase === 'waiting' ? 'w' : state.phase === 'closing' ? 'c' : undefined,
      )),
      row(select(
        stormWizardCustomId(modeKey, state, 'time'),
        `3/4 · Time left${state.time !== '' ? ` · ${timeLabel}` : ''}`,
        timeOptions,
        state.time,
      )),
      row(select(
        stormWizardCustomId(modeKey, state, 'damage'),
        `4/4 · Storm damage taken${state.damage !== '' ? ` · ${damageLabel}` : ''}`,
        damageOptions,
        state.damage,
      )),
      row(
        button(1, 'Get storm read', stormWizardCustomId(modeKey, state, 'submit'), '✅', { disabled: !complete }),
        button(2, 'Start over', stormWizardCustomId(modeKey, state, 'reset'), '↩️'),
      ),
    ],
  })
}

function buildLiveFeedUnavailablePrompt(region, error) {
  const regionText = regionLabel(String(region || '').toUpperCase())
  const noLiveWindow = error?.code === 'noLiveWindow'
  return privateMessage({
    embeds: [{
      author: { name: 'MAXX BOT  ·  LIVE POINTS' },
      title: noLiveWindow ? `🏁 NO LIVE EVENT // ${String(region || '').toUpperCase()}` : '⏳ LIVE LIST // TRY AGAIN',
      description: noLiveWindow
        ? `There is no supported tournament live in **${regionText}** right now. Nothing is broken — reopen Live tournament points when your event is running.`
        : 'The live tournament list is taking a moment to respond. Try again shortly; no leaderboard lookup was made from incomplete data.',
      color: noLiveWindow ? 0x64748b : 0xffc857,
      fields: [{
        name: 'WHAT TO DO',
        value: 'Check that your region is correct, then use **Refresh live events**. Finals and qualifiers appear only while their exact Epic window is live.',
      }],
      footer: { text: 'Private status · no cross-region or finished-event guess' },
    }],
    components: [row(button(1, 'Refresh live events', PANEL_IDS.livePoints, '🔄'))],
  })
}

function parseWindowPickerCustomId(customId) {
  const prefix = PANEL_IDS.liveWindowPrefix
  if (!String(customId).startsWith(prefix)) return null
  const region = decodeSegment(String(customId).slice(prefix.length))
  return region ? { region } : null
}

function parseLiveSubmitCustomId(customId) {
  const prefix = PANEL_IDS.liveSubmitPrefix
  if (!String(customId).startsWith(prefix)) return null
  const parts = String(customId).slice(prefix.length).split(':')
  if (parts.length !== 2) return null
  const region = decodeSegment(parts[0])
  const windowId = decodeSegment(parts[1])
  return region && windowId ? { region, windowId } : null
}

function parseStormSubmitCustomId(customId) {
  const prefix = PANEL_IDS.stormSubmitPrefix
  if (!String(customId).startsWith(prefix)) return null
  const mode = String(customId).slice(prefix.length)
  return mode === 'reload' || mode === 'battleRoyale' ? { mode } : null
}

function parseStormWizardCustomId(customId) {
  const prefix = `${STORM_WIZARD_PREFIX}`
  if (!String(customId).startsWith(prefix)) return null
  const parts = String(customId).slice(prefix.length).split(':')
  if (parts.length !== 6) return null
  const [modeKey, zoneToken, phaseToken, timeToken, damageToken, action] = parts
  const mode = stormModeFromKey(modeKey)
  if (!mode || !['zone', 'phase', 'time', 'damage', 'manualTime', 'manualDamage', 'submit', 'reset'].includes(action)) return null
  const zone = zoneToken === 'x' ? '' : decodeSegment(zoneToken)
  const time = timeToken === 'x' ? '' : decodeSegment(timeToken)
  const damage = damageToken === 'x' ? '' : decodeSegment(damageToken)
  const phase = phaseToken === 'w' ? 'waiting' : phaseToken === 'c' ? 'closing' : ''
  const state = normalizeStormWizardState({ zone, phase, time, damage })
  if (zone && !state.zone) return null
  if (time && !state.time) return null
  if (damage && !state.damage) return null
  if (phaseToken !== 'x' && !state.phase) return null
  return { mode, state, action }
}

export {
  MSG_FLAG_EPHEMERAL,
  PANEL_IDS,
  PANEL_REGION_OPTIONS,
  PANEL_SIGNATURE,
  buildFreeToolsPanel,
  buildLiveRegionPrompt,
  buildLiveTournamentPrompt,
  buildLivePointsModal,
  buildManualPointsModal,
  buildStormModal,
  buildStormManualModal,
  buildStormWizard,
  buildLiveFeedUnavailablePrompt,
  decodeWindowValue,
  normalizeStormWizardState,
  parseLiveSubmitCustomId,
  parseStormSubmitCustomId,
  parseStormWizardCustomId,
  parseWindowPickerCustomId,
}
