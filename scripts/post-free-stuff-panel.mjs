/*
 * Refresh the private utility panel in #free-stuff.
 *
 * This edits only the known Maxx Bot guide message (or a prior message with
 * the panel signature). The original Viewmaxxing post is never searched for
 * or edited. The default mode is a read-only dry run; pass --execute only
 * after the Worker release is approved.
 *
 * Usage:
 *   node scripts/post-free-stuff-panel.mjs
 *   $env:MAXX_BOT_ENV_PATH = 'C:\\Users\\Diggy\\projects\\maxxtopia\\.bot-setup.local.env'
 *   node scripts/post-free-stuff-panel.mjs --execute
 */

import { readFileSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client, GatewayIntentBits, ChannelType } from 'discord.js'
import { buildFreeToolsPanel, PANEL_SIGNATURE } from '../tickets-worker/panel.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const FREE_STUFF_CHANNEL_ID = '1519790996559364307'
const EXISTING_PANEL_MESSAGE_ID = '1543352185092444191'
const SILENT = 1 << 12
const DRY = !new Set(process.argv.slice(2)).has('--execute')

function parseEnv(path) {
  const values = {}
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z_]+)\s*=\s*(.+?)\s*$/)
    if (!match) continue
    values[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
  }
  return values
}

const envPath = process.env.MAXX_BOT_ENV_PATH || join(ROOT, '.bot-setup.local.env')
let env
try {
  env = parseEnv(envPath)
} catch {
  console.error(`[free-stuff-panel] Missing ${envPath}`)
  process.exit(1)
}

if (!env.DISCORD_BOT_TOKEN || !env.DISCORD_GUILD_ID) {
  console.error(`[free-stuff-panel] DISCORD_BOT_TOKEN and DISCORD_GUILD_ID are required in ${envPath}`)
  process.exit(1)
}

if (DRY) console.log('[free-stuff-panel] DRY RUN — no Discord changes. Pass --execute to edit the guide.')

const panel = buildFreeToolsPanel()

function messageNeedsUpdate(message) {
  if (!message) return true
  const currentDescription = message.embeds[0]?.description || ''
  const currentTitle = message.embeds[0]?.title || ''
  const currentComponents = JSON.stringify(message.components?.map(component => component.toJSON?.() || component) || [])
  const nextComponents = JSON.stringify(panel.components)
  return currentTitle !== panel.embed.title || currentDescription !== panel.embed.description || currentComponents !== nextComponents
}

async function findPanel(channel, botUserId) {
  let known = null
  try {
    known = await channel.messages.fetch(EXISTING_PANEL_MESSAGE_ID)
  } catch {
    // The known id may be absent in a fresh server; use the signature fallback.
  }
  if (known?.author?.id === botUserId) return known

  const recent = await channel.messages.fetch({ limit: 50 })
  return recent.find(message => message.author?.id === botUserId && message.embeds[0]?.description?.includes(PANEL_SIGNATURE)) || null
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
})

client.once('clientReady', async () => {
  try {
    console.log(`[free-stuff-panel] Logged in as ${client.user.tag}`)
    const guild = await client.guilds.fetch(env.DISCORD_GUILD_ID)
    const channel = await guild.channels.fetch(FREE_STUFF_CHANNEL_ID)
    if (!channel || channel.type !== ChannelType.GuildText) {
      throw new Error(`#free-stuff (${FREE_STUFF_CHANNEL_ID}) was not found as a text channel`)
    }

    const existing = await findPanel(channel, client.user.id)
    if (existing && !messageNeedsUpdate(existing)) {
      console.log(`[free-stuff-panel] guide already current (id ${existing.id}). No edit needed.`)
    } else if (existing) {
      console.log(`[free-stuff-panel] [would] update guide in #${channel.name} (id ${existing.id})`)
      if (!DRY) {
        await existing.edit({
          embeds: [panel.embed],
          components: panel.components,
          flags: SILENT,
          allowedMentions: { parse: [] },
        })
        console.log('[free-stuff-panel] [do] guide updated silently.')
      }
    } else {
      console.log(`[free-stuff-panel] [would] post a new guide in #${channel.name}`)
      if (!DRY) {
        const sent = await channel.send({
          embeds: [panel.embed],
          components: panel.components,
          flags: SILENT,
          allowedMentions: { parse: [] },
        })
        console.log(`[free-stuff-panel] [do] guide posted silently (id ${sent.id}).`)
      }
    }
    if (DRY) console.log('[free-stuff-panel] Re-run with --execute to apply the panel update.')
  } catch (error) {
    console.error(`[free-stuff-panel] ${error?.message || error}`)
    process.exitCode = 1
  } finally {
    await client.destroy()
  }
})

client.on('error', error => console.error('[free-stuff-panel] Discord client error', error))
await client.login(env.DISCORD_BOT_TOKEN)
