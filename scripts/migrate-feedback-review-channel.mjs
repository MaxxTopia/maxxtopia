/*
 * Move the review surface from the existing Forum post to a normal text
 * channel, preserving the original Forum post as a recoverable archive.
 *
 * This is deliberately narrow: it converts only the existing legacy review
 * authored by the user whose global display name is `!tonka`, does not delete
 * or edit that user's message, and never posts a public notification.
 * The default mode is a read-only dry run.
 *
 * Usage:
 *   node scripts/migrate-feedback-review-channel.mjs
 *   $env:MAXX_BOT_ENV_PATH = 'C:\\Users\\Diggy\\projects\\maxxtopia\\.bot-setup.local.env'
 *   node scripts/migrate-feedback-review-channel.mjs --execute
 */

import { readFileSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionFlagsBits,
} from 'discord.js'
import {
  buildReviewEmbed,
  buildReviewInstruction,
  REVIEW_CHANNEL_SIGNATURE,
} from '../tickets-worker/reviews.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const FEEDBACK_FORUM_CHANNEL_ID = '1502867387962101812'
const EXISTING_FEEDBACK_THREAD_ID = '1539270897024897075'
const REVIEW_CHANNEL_NAME = 'reviews'
const LEGACY_ARCHIVE_NAME = 'reviews-archive'
const LEGACY_PRODUCT = 'Optimizationmaxxing'
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
  console.error(`[feedback-review-migration] Missing ${envPath}`)
  process.exit(1)
}

if (!env.DISCORD_BOT_TOKEN || !env.DISCORD_GUILD_ID) {
  console.error(`[feedback-review-migration] DISCORD_BOT_TOKEN and DISCORD_GUILD_ID are required in ${envPath}`)
  process.exit(1)
}

if (DRY) {
  console.log('[feedback-review-migration] DRY RUN — no Discord changes. Pass --execute to create the channel and migrate the legacy review.')
}

function isTonka(author) {
  const names = [author?.globalName, author?.username, author?.displayName]
    .map(value => String(value || '').trim().toLowerCase())
  return names.includes('!tonka') || names.includes('tonks.rx')
}

function inferLegacyRating(message) {
  const content = String(message?.content || '')
  const explicit = content.match(/(?:rating|stars?)\s*[:=-]?\s*([1-5])\b/i)
  if (explicit) return Number(explicit[1])

  const filledStars = (content.match(/[⭐★]/g) || []).length
  if (filledStars >= 1 && filledStars <= 5) return filledStars

  // The legacy message has no numeric rating or star reaction. Its wording
  // is unambiguously positive, so the requested visual conversion uses the
  // five-star presentation while preserving the exact original sentence.
  return 5
}

function isConvertedReview(message, source) {
  if (message?.author?.id !== source.clientUserId) return false
  const mention = `<@${source.author.id}>`
  return (message.embeds || []).some(embed => (
    embed.fields?.some(field => field.name === 'Review by:' && field.value === mention) &&
    String(embed.description || '').includes(source.content)
  ))
}

async function findInstruction(channel, botUserId) {
  const messages = await channel.messages.fetch({ limit: 100 })
  return messages.find(message => (
    message.author?.id === botUserId &&
    message.content?.includes(REVIEW_CHANNEL_SIGNATURE)
  )) || null
}

async function ensureReadOnlySurface(channel, botUserId, guildId) {
  if (DRY) {
    console.log(`[feedback-review-migration] [would] enforce read-only members / bot-posts-only permissions on #${channel.name}`)
    return
  }

  await channel.permissionOverwrites.edit(guildId, {
    ViewChannel: true,
    ReadMessageHistory: true,
    SendMessages: false,
  }, { reason: 'Keep the Maxxtopia review wall command-only and notification-safe' })
  await channel.permissionOverwrites.edit(botUserId, {
    ViewChannel: true,
    ReadMessageHistory: true,
    SendMessages: true,
    EmbedLinks: true,
    AttachFiles: true,
    AddReactions: true,
  }, { reason: 'Allow Maxx Bot to publish review cards in the read-only review wall' })
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
})

client.once('clientReady', async () => {
  try {
    console.log(`[feedback-review-migration] Logged in as ${client.user.tag}`)
    const guild = await client.guilds.fetch(env.DISCORD_GUILD_ID)
    const forum = await guild.channels.fetch(FEEDBACK_FORUM_CHANNEL_ID)
    if (!forum || forum.type !== ChannelType.GuildForum || forum.name !== 'feedback') {
      throw new Error(`#feedback (${FEEDBACK_FORUM_CHANNEL_ID}) was not found as the expected Forum channel`)
    }

    const post = await guild.channels.fetch(EXISTING_FEEDBACK_THREAD_ID)
    if (!post || post.type !== ChannelType.PublicThread || post.parentId !== forum.id) {
      throw new Error(`Existing feedback post ${EXISTING_FEEDBACK_THREAD_ID} was not found under #feedback`)
    }

    const legacyMessages = await post.messages.fetch({ limit: 100 })
    const tonkaMessage = [...legacyMessages.values()]
      .filter(message => isTonka(message.author) && String(message.content || '').trim())
      .sort((left, right) => left.createdTimestamp - right.createdTimestamp)[0]
    if (!tonkaMessage) {
      throw new Error('Could not find a non-empty legacy review from !tonka in the existing Forum post')
    }

    console.log(`[feedback-review-migration] Legacy review: ${tonkaMessage.id} by ${tonkaMessage.author.globalName || tonkaMessage.author.username}: ${tonkaMessage.content}`)

    const channels = await guild.channels.fetch()
    let target = [...channels.values()].find(channel => (
      channel.type === ChannelType.GuildText &&
      channel.name === REVIEW_CHANNEL_NAME &&
      channel.parentId === forum.parentId
    )) || null

    if (!target) {
      console.log(`[feedback-review-migration] [${DRY ? 'would create' : 'creating'}] normal #${REVIEW_CHANNEL_NAME} in the existing category`)
      if (!DRY) {
        target = await guild.channels.create({
          name: REVIEW_CHANNEL_NAME,
          type: ChannelType.GuildText,
          parent: forum.parentId,
          topic: 'Share feedback with /review. Reviews are posted by Maxx Bot.',
          position: Number.isInteger(forum.rawPosition) ? forum.rawPosition : undefined,
          permissionOverwrites: [
            {
              id: guild.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
              deny: [PermissionFlagsBits.SendMessages],
            },
            {
              id: client.user.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.EmbedLinks,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.AddReactions,
              ],
            },
          ],
          reason: 'Create the normal Maxxtopia review wall requested by Diggy',
        })
      }
    } else {
      console.log(`[feedback-review-migration] Using existing normal #${target.name} (${target.id})`)
    }

    if (DRY) {
      console.log(`[feedback-review-migration] [would] convert ${tonkaMessage.author.globalName || tonkaMessage.author.username}'s text into a silent five-star review card in #${REVIEW_CHANNEL_NAME}`)
      console.log(`[feedback-review-migration] [would] preserve the original Forum post and archive it as #${LEGACY_ARCHIVE_NAME}`)
      return
    }

    await ensureReadOnlySurface(target, client.user.id, guild.id)
    const targetMessages = await target.messages.fetch({ limit: 100 })
    const source = {
      author: tonkaMessage.author,
      content: tonkaMessage.content,
      clientUserId: client.user.id,
    }
    let converted = [...targetMessages.values()].find(message => isConvertedReview(message, source)) || null
    if (converted) {
      console.log(`[feedback-review-migration] Converted review already present (id ${converted.id}); no duplicate posted.`)
    } else {
      converted = await target.send({
        embeds: [buildReviewEmbed({
          user: tonkaMessage.author,
          displayName: tonkaMessage.author.globalName || tonkaMessage.author.username,
          rating: inferLegacyRating(tonkaMessage),
          product: LEGACY_PRODUCT,
          comment: tonkaMessage.content,
          createdAt: tonkaMessage.createdAt.toISOString(),
        })],
        flags: SILENT,
        allowedMentions: { parse: [] },
      })
      await converted.react('✅')
      console.log(`[feedback-review-migration] Converted review posted silently (id ${converted.id}).`)
    }

    const instruction = buildReviewInstruction()
    const existingInstruction = await findInstruction(target, client.user.id)
    if (existingInstruction && existingInstruction.content === instruction) {
      console.log(`[feedback-review-migration] Instruction already present (id ${existingInstruction.id}); no duplicate posted.`)
    } else if (existingInstruction) {
      await existingInstruction.edit({
        content: instruction,
        flags: SILENT,
        allowedMentions: { parse: [] },
      })
      console.log(`[feedback-review-migration] Instruction refreshed silently (id ${existingInstruction.id}).`)
    } else {
      const sentInstruction = await target.send({
        content: instruction,
        flags: SILENT,
        allowedMentions: { parse: [] },
      })
      console.log(`[feedback-review-migration] Instruction posted silently (id ${sentInstruction.id}).`)
    }

    if (post.name !== LEGACY_ARCHIVE_NAME) {
      await post.setName(LEGACY_ARCHIVE_NAME, 'Preserve the former Forum review wall as an archive')
    }
    if (!post.archived) {
      await post.setArchived(true, 'Archive the former Forum review wall after safe migration')
    }
    console.log(`[feedback-review-migration] Original Forum post preserved and archived as #${post.name} (${post.id}).`)
    console.log(`[feedback-review-migration] New review destination: #${target.name} (${target.id}).`)
  } catch (error) {
    console.error(`[feedback-review-migration] ${error?.message || error}`)
    process.exitCode = 1
  } finally {
    await client.destroy()
  }
})

client.on('error', error => console.error('[feedback-review-migration] Discord client error', error))
await client.login(env.DISCORD_BOT_TOKEN)
