/*
 * Refresh only the existing #reviews instruction message so it contains the
 * modal-opening button. This script never posts, deletes, renames, moves, or
 * changes permissions. It fails closed if any expected identity is missing.
 *
 * Dry run (default):
 *   node scripts/update-review-button.mjs
 * Apply the verified in-place edit:
 *   node scripts/update-review-button.mjs --execute
 */

import { readFileSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client, GatewayIntentBits, ChannelType } from 'discord.js'
import {
  REVIEW_BUTTON_ID,
  REVIEW_CHANNEL_SIGNATURE,
  buildReviewInstruction,
  buildReviewInstructionComponents,
} from '../tickets-worker/reviews.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const REVIEW_CHANNEL_ID = '1543384589106679871'
const REVIEW_INSTRUCTION_MESSAGE_ID = '1543384596740309164'
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

function normalizedComponents(message) {
  return (message?.components || []).map(row => ({
    type: row.type,
    components: (row.components || []).map(component => ({
      type: component.type,
      style: component.style,
      label: component.label,
      custom_id: component.customId || component.custom_id,
      emoji: component.emoji?.name ? { name: component.emoji.name } : undefined,
      disabled: component.disabled || undefined,
    })),
  }))
}

function desiredComponents() {
  return buildReviewInstructionComponents().map(row => ({
    ...row,
    components: row.components.map(component => ({ ...component })),
  }))
}

const envPath = process.env.MAXX_BOT_ENV_PATH || join(ROOT, '.bot-setup.local.env')
let env
try {
  env = parseEnv(envPath)
} catch {
  console.error(`[review-button] Missing ${envPath}`)
  process.exit(1)
}

if (!env.DISCORD_BOT_TOKEN || !env.DISCORD_GUILD_ID) {
  console.error(`[review-button] DISCORD_BOT_TOKEN and DISCORD_GUILD_ID are required in ${envPath}`)
  process.exit(1)
}

if (DRY) console.log('[review-button] DRY RUN — no Discord changes. Pass --execute for the verified in-place edit.')

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
})

client.once('clientReady', async () => {
  try {
    const guild = await client.guilds.fetch(env.DISCORD_GUILD_ID)
    const channel = await guild.channels.fetch(REVIEW_CHANNEL_ID)
    if (!channel || channel.type !== ChannelType.GuildText || channel.name !== 'reviews') {
      throw new Error(`Expected #reviews text channel ${REVIEW_CHANNEL_ID} was not found; no edit was attempted`)
    }

    const message = await channel.messages.fetch(REVIEW_INSTRUCTION_MESSAGE_ID)
    if (!message || message.channelId !== REVIEW_CHANNEL_ID || message.author?.id !== client.user.id) {
      throw new Error(`Expected bot-authored instruction ${REVIEW_INSTRUCTION_MESSAGE_ID} was not found; no edit was attempted`)
    }
    if (!String(message.content || '').includes(REVIEW_CHANNEL_SIGNATURE)) {
      throw new Error(`Message ${REVIEW_INSTRUCTION_MESSAGE_ID} is not the signed review instruction; no edit was attempted`)
    }

    const content = buildReviewInstruction()
    const components = desiredComponents()
    const hasExpectedButton = normalizedComponents(message).some(row => row.components.some(component => (
      component.custom_id === REVIEW_BUTTON_ID
    )))
    const alreadyCurrent = message.content === content
      && hasExpectedButton
      && JSON.stringify(normalizedComponents(message)) === JSON.stringify(components)

    if (alreadyCurrent) {
      console.log(`[review-button] Instruction ${message.id} already has the current review button. No edit needed.`)
      return
    }

    console.log(`[review-button] [would] edit existing instruction ${message.id} in #reviews; no post or notification will be created.`)
    if (DRY) return

    await message.edit({
      content,
      components,
      allowedMentions: { parse: [] },
    })

    const verified = await channel.messages.fetch({ message: REVIEW_INSTRUCTION_MESSAGE_ID, force: true })
    const verifiedButton = normalizedComponents(verified).some(row => row.components.some(component => (
      component.custom_id === REVIEW_BUTTON_ID
    )))
    if (verified.content !== content || !verifiedButton) {
      throw new Error('Discord accepted the edit but readback did not contain the expected review button')
    }
    console.log(`[review-button] [do] Existing instruction ${verified.id} updated and read back successfully.`)
  } catch (error) {
    console.error(`[review-button] ${error?.message || error}`)
    process.exitCode = 1
  } finally {
    await client.destroy()
  }
})

client.on('error', error => console.error('[review-button] Discord client error', error))
await client.login(env.DISCORD_BOT_TOKEN)
