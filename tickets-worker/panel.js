// Shared Discord UI for the private Maxx Bot utility panel.
//
// The panel is intentionally a control surface, not a chat channel: users
// choose a tool, fill a private modal, and receive an ephemeral result. Keep
// the slash commands registered as a fallback for users who prefer them.

import { REGIONS } from './points-live.js'

const MSG_FLAG_EPHEMERAL = 1 << 6
// Searchable in the message payload while remaining invisible in Discord.
const PANEL_SIGNATURE = '\u200b\u200c\u200d\ufeff'

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
})

const REGION_DETAILS = Object.freeze({
  NAC: ['North America Central', 'NAC leaderboard'],
  EU: ['Europe', 'EU leaderboard'],
  NAW: ['North America West', 'NAW leaderboard'],
  BR: ['Brazil', 'BR leaderboard'],
  ASIA: ['Asia', 'ASIA leaderboard'],
  OCE: ['Oceania', 'OCE leaderboard'],
  ME: ['Middle East', 'ME leaderboard'],
})

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

function button(style, label, customId, emoji) {
  return {
    type: 2,
    style,
    label,
    custom_id: customId,
    emoji: { name: emoji },
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
        '**One click → one private form → one useful read.**',
        'Choose a tool below. Your inputs and result stay visible only to you; nothing is posted as a channel message.',
        '',
        'Live tournament choices are loaded for the region you select. Qualifiers use the moving live line; Finals use the live prize race and never invent a finished cutoff.',
        PANEL_SIGNATURE,
      ].join('\n'),
      color: 0x16c7b7,
      fields: [
        {
          name: '🏆 LIVE TOURNAMENT POINTS',
          value: 'Pick a region and the exact live window. Enter your Epic display name or 32-character account ID, then see your current rank, target, and pace.',
          inline: true,
        },
        {
          name: '🧮 MANUAL POINTS PACE',
          value: 'Already know the line? Enter current points, target points, games left, and an optional safety cushion.',
          inline: true,
        },
        {
          name: '⚡ STORM TIMING',
          value: 'Choose Battle Royale or Reload, then get a private rotate-soon / leave-now timing read from your current zone state.',
          inline: true,
        },
      ],
      footer: { text: 'Maxx Bot · private forms · live reads can move after every game' },
    },
    components: [
      row(
        button(1, 'Live tournament points', PANEL_IDS.livePoints, '🏆'),
        button(2, 'Manual points pace', PANEL_IDS.manualPoints, '🧮'),
        button(3, 'Storm · BR', PANEL_IDS.stormBattleRoyale, '⚡'),
        button(2, 'Storm · Reload', PANEL_IDS.stormReload, '🔁'),
      ),
    ],
  }
}

function buildLiveRegionPrompt() {
  const options = REGIONS.map(region => ({
    label: `${regionLabel(region)} (${region})`,
    value: region,
    description: regionDescription(region),
    emoji: { name: '🌐' },
  }))
  return privateMessage({
    embeds: [{
      author: { name: 'MAXX BOT  ·  LIVE POINTS' },
      title: '🏆 CHOOSE YOUR REGION',
      description: 'The next menu is populated from the currently live Epic windows in this region. Your selection is private.',
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
    return {
      label: truncate(`${name} · ${round}`, 100),
      value: values[index],
      description: truncate(`${region} · exact live window · enter your Epic identity next`, 100),
      emoji: { name: round.startsWith('FINALS') ? '🏆' : '🏁' },
    }
  })

  return privateMessage({
    embeds: [{
      author: { name: 'MAXX BOT  ·  LIVE POINTS' },
      title: `🏆 LIVE WINDOWS // ${region}`,
      description: `Choose the exact live tournament. **${regionLabel(region)}** is locked for this lookup, and Finals are clearly marked as a prize race.`,
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
      row(textInput('epic_identity', 'Epic name or account ID', 1, {
        placeholder: 'Exact Epic display name or 32-character ID',
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
      row(textInput('phase', 'Phase: waiting or closing', 1, { placeholder: 'Example: closing', maxLength: 7 })),
      row(textInput('time_left', 'Seconds left in phase', 1, { placeholder: 'Example: 30', maxLength: 4 })),
      row(textInput('damage_taken', 'Cumulative storm damage', 1, { placeholder: 'Example: 550', maxLength: 12 })),
      row(textInput('dps_override', 'DPS override (optional)', 1, {
        required: false,
        placeholder: 'Leave blank for the zone reference',
        maxLength: 8,
      })),
    ],
  }
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

export {
  MSG_FLAG_EPHEMERAL,
  PANEL_IDS,
  PANEL_SIGNATURE,
  buildFreeToolsPanel,
  buildLiveRegionPrompt,
  buildLiveTournamentPrompt,
  buildLivePointsModal,
  buildManualPointsModal,
  buildStormModal,
  decodeWindowValue,
  parseLiveSubmitCustomId,
  parseStormSubmitCustomId,
  parseWindowPickerCustomId,
}
