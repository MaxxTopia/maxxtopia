/*
 * Convert the existing #feedback Forum post into the Maxxtopia review wall.
 *
 * This is deliberately narrow: it renames one known post, preserves the
 * Forum channel and every existing post/message, and creates or updates only
 * the bot's own instruction message inside that post. The default mode is a
 * read-only dry run.
 *
 * Usage:
 *   node scripts/post-feedback-review-wall.mjs
 *   $env:MAXX_BOT_ENV_PATH = 'C:\\Users\\Diggy\\projects\\maxxtopia\\.bot-setup.local.env'
 *   node scripts/post-feedback-review-wall.mjs --execute
 */

import { readFileSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client, GatewayIntentBits, ChannelType } from 'discord.js'
import {
  buildReviewInstruction,
  buildReviewInstructionComponents,
  REVIEW_BUTTON_ID,
  REVIEW_CHANNEL_SIGNATURE,
} from '../tickets-worker/reviews.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const FEEDBACK_FORUM_CHANNEL_ID = '1502867387962101812'
const EXISTING_FEEDBACK_THREAD_ID = '1539270897024897075'
const REVIEW_POST_NAME = 'reviews'
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
  console.error(`[feedback-review-wall] Missing ${envPath}`)
  process.exit(1)
}

if (!env.DISCORD_BOT_TOKEN || !env.DISCORD_GUILD_ID) {
  console.error(`[feedback-review-wall] DISCORD_BOT_TOKEN and DISCORD_GUILD_ID are required in ${envPath}`)
  process.exit(1)
}

if (DRY) console.log('[feedback-review-wall] DRY RUN — no Discord changes. Pass --execute to convert the existing post.')

function isForumPost(channel) {
  return channel && (channel.type === ChannelType.PublicThread || channel.type === ChannelType.PrivateThread)
}

async function findInstruction(post, botUserId) {
  const messages = await post.messages.fetch({ limit: 100 })
  return messages.find(message => (
    message.author?.id === botUserId &&
    message.content?.includes(REVIEW_CHANNEL_SIGNATURE)
  )) || null
}

function instructionHasReviewButton(message) {
  return (message?.components || []).some(row => (
    (row.components || []).some(component => (
      component.customId === REVIEW_BUTTON_ID || component.custom_id === REVIEW_BUTTON_ID
    ))
  ))
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
})

client.once('clientReady', async () => {
  try {
    console.log(`[feedback-review-wall] Logged in as ${client.user.tag}`)
    const guild = await client.guilds.fetch(env.DISCORD_GUILD_ID)
    const forum = await guild.channels.fetch(FEEDBACK_FORUM_CHANNEL_ID)
    if (!forum || forum.type !== ChannelType.GuildForum || forum.name !== 'feedback') {
      throw new Error(`#feedback (${FEEDBACK_FORUM_CHANNEL_ID}) was not found as the expected Forum channel`)
    }

    const post = await guild.channels.fetch(EXISTING_FEEDBACK_THREAD_ID)
    if (!isForumPost(post) || post.parentId !== forum.id) {
      throw new Error(`Existing feedback post ${EXISTING_FEEDBACK_THREAD_ID} was not found under #feedback`)
    }

    if (post.name !== REVIEW_POST_NAME) {
      console.log(`[feedback-review-wall] [would] rename existing post #${post.name} → #${REVIEW_POST_NAME}`)
      if (!DRY) {
        await post.setName(REVIEW_POST_NAME, 'Convert existing Maxxtopia feedback post into the review wall')
        console.log('[feedback-review-wall] [do] existing post renamed silently.')
      }
    } else {
      console.log(`[feedback-review-wall] existing post is already #${REVIEW_POST_NAME} (id ${post.id}).`)
    }

    const instruction = buildReviewInstruction()
    const existing = await findInstruction(post, client.user.id)
    if (existing && existing.content === instruction && instructionHasReviewButton(existing)) {
      console.log(`[feedback-review-wall] instruction already current (id ${existing.id}). No message edit needed.`)
    } else if (existing) {
      console.log(`[feedback-review-wall] [would] update bot instruction message (id ${existing.id})`)
      if (!DRY) {
        await existing.edit({
          content: instruction,
          components: buildReviewInstructionComponents(),
          flags: SILENT,
          allowedMentions: { parse: [] },
        })
        console.log('[feedback-review-wall] [do] instruction updated silently.')
      }
    } else {
      console.log(`[feedback-review-wall] [would] post review instructions inside #${post.name} (id ${post.id})`)
      if (!DRY) {
        const sent = await post.send({
          content: instruction,
          components: buildReviewInstructionComponents(),
          flags: SILENT,
          allowedMentions: { parse: [] },
        })
        console.log(`[feedback-review-wall] [do] instructions posted silently (id ${sent.id}).`)
      }
    }

    console.log(`[feedback-review-wall] Review destination: #${post.name} thread ${post.id}`)
    if (DRY) console.log('[feedback-review-wall] Re-run with --execute to apply the narrow rename/instruction update.')
  } catch (error) {
    console.error(`[feedback-review-wall] ${error?.message || error}`)
    process.exitCode = 1
  } finally {
    await client.destroy()
  }
})

client.on('error', error => console.error('[feedback-review-wall] Discord client error', error))
await client.login(env.DISCORD_BOT_TOKEN)
