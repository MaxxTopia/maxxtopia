/**
 * tickets-worker — self-hosted ticket system for the Maxxtopia Discord.
 *
 * Replaces TicketTool. Uses Discord HTTP-only interactions (no gateway
 * connection required → scales to zero on Cloudflare Workers, $0/mo).
 *
 * Flow:
 *   1. Maxx bot posts a styled embed in #open-ticket with a button
 *      (custom_id="vip-buy-optmaxxing"). One-shot — see
 *      `scripts/post-ticket-panel.mjs` in this repo.
 *   2. User clicks the button → Discord POSTs an interaction here.
 *   3. We verify the Ed25519 signature, ack with a deferred ephemeral
 *      response (we have 15 min to follow up — plenty for one REST call).
 *   4. Create a PRIVATE thread in #open-ticket (only mods + the user
 *      can see it). Add the user + Diggy as members.
 *   5. Post the welcome message in the thread (payment instructions).
 *   6. Edit the deferred reply with a link to the spawned thread.
 *
 * Discord dev-portal config (one-time, see README):
 *   - Interactions Endpoint URL: https://maxxtopia-tickets.<account>.workers.dev/
 *   - Public Key (paste into worker secret as DISCORD_PUBLIC_KEY)
 *   - Bot must already be in the guild with MANAGE_THREADS +
 *     CREATE_PRIVATE_THREADS + SEND_MESSAGES_IN_THREADS perms.
 *
 * Cap on rate-limit abuse: spawn no more than 1 ticket per user per 60s,
 * tracked in KV. Without this someone could spam-click and DOS our REST
 * quota.
 */

import { calculatePointsForecast, formatPointsDiscord, formatPointsEmbed } from './points-calculator.js'
import { loadLivePoints } from './points-live.js'
import { calculateStormForecast, formatStormDiscord, formatStormEmbed } from './storm-calculator.js'

const DISCORD_API = 'https://discord.com/api/v10'

// Interaction types (https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object-interaction-type)
const INTERACTION_PING = 1
const INTERACTION_APPLICATION_COMMAND = 2
const INTERACTION_MESSAGE_COMPONENT = 3

// Response types
const RESP_PONG = 1
const RESP_CHANNEL_MESSAGE = 4
const RESP_DEFERRED_CHANNEL_MESSAGE = 5

// Channel types
const CHANNEL_PRIVATE_THREAD = 12

// Message flags
const MSG_FLAG_EPHEMERAL = 1 << 6

// Per-user spam cap. KV write/read pricing makes this trivial.
const RATE_LIMIT_SECONDS = 60

// Live points is deliberately isolated from the ticket/VIP KV limiter. A
// short best-effort per-isolate cooldown protects refresh spam without
// allowing a public utility command to consume the ticket system's KV quota.
// This is a burst guard, not a global DDoS boundary; Cloudflare rate limiting
// remains the correct next layer for distributed abuse.
const LIVE_POINTS_COOLDOWN_SECONDS = 30
const LIVE_POINTS_VIP_COOLDOWN_SECONDS = 5
const LIVE_POINTS_MAX_IN_FLIGHT = 16
const LIVE_POINTS_MAX_COOLDOWNS = 4096
const livePointsCooldowns = new Map()
let livePointsInFlight = 0

// ─── Endpoint ───────────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') {
      return new Response('not found', { status: 404 })
    }
    // Discord requires us to verify the request signature on EVERY call,
    // before doing anything else. Bad sig → 401, no body parse, no logs.
    const sig = request.headers.get('X-Signature-Ed25519')
    const ts = request.headers.get('X-Signature-Timestamp')
    if (!sig || !ts) return new Response('missing signature', { status: 401 })

    const bodyText = await request.text()
    const valid = await verifyDiscordSignature(env.DISCORD_PUBLIC_KEY, sig, ts, bodyText)
    if (!valid) return new Response('bad signature', { status: 401 })

    let interaction
    try {
      interaction = JSON.parse(bodyText)
    } catch {
      return new Response('invalid body', { status: 400 })
    }

    // PING — Discord verifies the endpoint with this on save.
    if (interaction.type === INTERACTION_PING) {
      return jsonResponse({ type: RESP_PONG })
    }

    // Button click on the ticket panel.
    if (interaction.type === INTERACTION_MESSAGE_COMPONENT) {
      const customId = interaction.data?.custom_id ?? ''
      if (customId.startsWith('vip-buy-')) {
        // Defer first so Discord doesn't time-out on us, then do the work
        // in waitUntil so we can return immediately.
        ctx.waitUntil(handleBuyTicket(env, interaction, customId))
        return jsonResponse({
          type: RESP_DEFERRED_CHANNEL_MESSAGE,
          data: { flags: MSG_FLAG_EPHEMERAL },
        })
      }
      // Close-ticket button inside a spawned thread.
      if (customId === 'close-ticket') {
        ctx.waitUntil(handleCloseTicket(env, interaction))
        return jsonResponse({
          type: RESP_DEFERRED_CHANNEL_MESSAGE,
          data: { flags: MSG_FLAG_EPHEMERAL },
        })
      }
      // Mod-only "Grant VIP" button — encodes buyer_user_id in the
      // custom_id so we know who to grant without prompting.
      if (customId.startsWith('grant-vip:')) {
        ctx.waitUntil(handleGrantVip(env, interaction, customId))
        return jsonResponse({
          type: RESP_DEFERRED_CHANNEL_MESSAGE,
          data: { flags: MSG_FLAG_EPHEMERAL },
        })
      }
    }

    // Slash commands. /storm and /points are public utility commands;
    // /gen, /om, /33, /founderstatus, and /sccoins are registered via
    // scripts/register-slash-commands.mjs against the guild.
    // The public utility commands stay ephemeral and do not require a
    // Diggy-only gate. Administrative commands enforce their own gate
    // inside their handlers so a picker/role mistake cannot mint keys.
    if (interaction.type === INTERACTION_APPLICATION_COMMAND) {
      const name = interaction.data?.name ?? ''
      if (name === 'storm') {
        const result = calculateStormForecast({
          mode: getOption(interaction, 'mode') || 'battleRoyale',
          zone: getOption(interaction, 'zone'),
          phase: getOption(interaction, 'phase'),
          timeLeftSeconds: getOption(interaction, 'time'),
          damageTaken: getOption(interaction, 'damage'),
          dpsOverride: getOption(interaction, 'dps'),
        })
        return jsonResponse({
          type: RESP_CHANNEL_MESSAGE,
          data: {
            ...(result.ok ? { embeds: [formatStormEmbed(result)] } : { content: formatStormDiscord(result) }),
            flags: MSG_FLAG_EPHEMERAL,
            allowed_mentions: { parse: [] },
          },
        })
      }
      if (name === 'points') {
        const mode = getOption(interaction, 'mode') || 'manual'
        if (mode === 'live') {
          // The live path does two bounded upstream reads. Defer so Discord
          // gets its acknowledgement immediately, then edit the private
          // response when the exact event/window lookup finishes.
          ctx.waitUntil(handleLivePoints(env, interaction))
          return jsonResponse({
            type: RESP_DEFERRED_CHANNEL_MESSAGE,
            data: { flags: MSG_FLAG_EPHEMERAL },
          })
        }
        if (mode !== 'manual') {
          const result = { ok: false, error: 'Choose manual formula or live Epic lookup.' }
          return jsonResponse({
            type: RESP_CHANNEL_MESSAGE,
            data: { content: formatPointsDiscord(result), flags: MSG_FLAG_EPHEMERAL, allowed_mentions: { parse: [] } },
          })
        }
        const result = calculatePointsForecast({
          current: getOption(interaction, 'current'),
          target: getOption(interaction, 'target'),
          games: getOption(interaction, 'games'),
          buffer: getOption(interaction, 'buffer'),
        })
        return jsonResponse({
          type: RESP_CHANNEL_MESSAGE,
          data: {
            ...(result.ok ? { embeds: [formatPointsEmbed(result)] } : { content: formatPointsDiscord(result) }),
            flags: MSG_FLAG_EPHEMERAL,
            allowed_mentions: { parse: [] },
          },
        })
      }
      if (name === 'gen' || name === 'om') {
        ctx.waitUntil(handleGen(env, interaction, name))
        return jsonResponse({
          type: RESP_DEFERRED_CHANNEL_MESSAGE,
          data: { flags: MSG_FLAG_EPHEMERAL },
        })
      }
      if (name === '33') {
        ctx.waitUntil(handle33(env, interaction))
        return jsonResponse({
          type: RESP_DEFERRED_CHANNEL_MESSAGE,
          data: { flags: MSG_FLAG_EPHEMERAL },
        })
      }
      if (name === 'founderstatus') {
        ctx.waitUntil(handleFounderStatus(env, interaction))
        return jsonResponse({
          type: RESP_DEFERRED_CHANNEL_MESSAGE,
          data: { flags: MSG_FLAG_EPHEMERAL },
        })
      }
      if (name === 'sccoins') {
        ctx.waitUntil(handleSccoins(env, interaction))
        return jsonResponse({
          type: RESP_DEFERRED_CHANNEL_MESSAGE,
          data: { flags: MSG_FLAG_EPHEMERAL },
        })
      }
    }

    // Anything else — not implemented in v1.
    return jsonResponse({
      type: 4,
      data: { content: 'Unknown interaction.', flags: MSG_FLAG_EPHEMERAL },
    })
  },
}

// ─── Handlers ───────────────────────────────────────────────────────────

async function handleBuyTicket(env, interaction, customId) {
  const userId = interaction.member?.user?.id ?? interaction.user?.id
  const username = interaction.member?.user?.username ?? interaction.user?.username ?? 'buyer'
  const interactionToken = interaction.token
  const appId = interaction.application_id

  if (!userId) {
    await editFollowup(appId, interactionToken, {
      content: '⚠ Could not identify your user account. Try again?',
    })
    return
  }

  // Per-user rate limit. Without this, a click-spammer can fan-out
  // dozens of threads + chew our Discord REST quota.
  if (env.TICKETS_RATELIMIT) {
    const rateKey = `rl:${userId}`
    const recent = await env.TICKETS_RATELIMIT.get(rateKey)
    if (recent) {
      await editFollowup(appId, interactionToken, {
        content: `⏱ You opened a ticket recently — give it ${RATE_LIMIT_SECONDS}s before opening another. If this is urgent, ping <@${env.DIGGY_USER_ID}> in #vip-claim-help.`,
      })
      return
    }
    await env.TICKETS_RATELIMIT.put(rateKey, '1', { expirationTtl: RATE_LIMIT_SECONDS })
  }

  // Determine which product the panel is for. Today only
  // vip-buy-optmaxxing exists — but the prefix lets us add more
  // (vip-buy-discordmaxxer, vip-buy-clipmaxxer, ...) without forking
  // the worker.
  const product = customId.replace(/^vip-buy-/, '') // 'optmaxxing'
  const productLabel = productLabelFor(product)

  // Create a private thread in #open-ticket.
  const threadName = `vip-${product}-${username}`.slice(0, 100)
  const thread = await discordFetch(env, `/channels/${env.OPEN_TICKET_CHANNEL_ID}/threads`, {
    method: 'POST',
    body: JSON.stringify({
      name: threadName,
      type: CHANNEL_PRIVATE_THREAD,
      auto_archive_duration: 1440, // 24h — closes automatically if abandoned
      invitable: false,             // only mods + originally-added users can add more
    }),
  })
  if (!thread || !thread.id) {
    await editFollowup(appId, interactionToken, {
      content: '⚠ Could not spawn a private thread. The bot may be missing permissions — ping <@' + env.DIGGY_USER_ID + '> directly.',
    })
    return
  }

  // Add the buyer + Diggy to the thread. Discord requires explicit
  // invites for private threads; the bot creating the thread is added
  // automatically.
  const toAdd = [userId]
  if (env.DIGGY_USER_ID && env.DIGGY_USER_ID !== userId) toAdd.push(env.DIGGY_USER_ID)
  for (const uid of toAdd) {
    await discordFetch(env, `/channels/${thread.id}/thread-members/${uid}`, { method: 'PUT' })
  }

  // Post the welcome message inside the thread, with a row of action
  // buttons. Order: green Grant VIP (mod 1-click after payment lands)
  // then red Close (final step after grant).
  const welcomeBody = buildWelcomeMessage(product, productLabel, userId, env.DIGGY_USER_ID)
  await discordFetch(env, `/channels/${thread.id}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      content: welcomeBody,
      components: [
        {
          type: 1, // action row
          components: [
            {
              type: 2, // button
              style: 3, // success / green
              label: 'Grant VIP (mod-only)',
              custom_id: `grant-vip:${userId}`,
              emoji: { name: '💎' },
            },
            {
              type: 2, // button
              style: 4, // danger / red
              label: 'Close ticket',
              custom_id: 'close-ticket',
              emoji: { name: '🔒' },
            },
          ],
        },
      ],
    }),
  })

  // Edit the deferred ephemeral reply with a link to the new thread.
  // Markdown link doesn't auto-render channel pills, so we use
  // Discord's <#channel-id> mention syntax.
  await editFollowup(appId, interactionToken, {
    content: `✓ Your private ticket is ready: <#${thread.id}>\n\nOnly you and <@${env.DIGGY_USER_ID}> can see it. Open the thread + describe your purchase.`,
    flags: MSG_FLAG_EPHEMERAL,
  })
}

async function handleCloseTicket(env, interaction) {
  const channelId = interaction.channel_id
  const interactionToken = interaction.token
  const appId = interaction.application_id

  // Fetch channel info to confirm it's a private thread we created.
  const channel = await discordFetch(env, `/channels/${channelId}`, { method: 'GET' })
  if (!channel || channel.type !== CHANNEL_PRIVATE_THREAD) {
    await editFollowup(appId, interactionToken, {
      content: '⚠ This button only works inside a ticket thread.',
    })
    return
  }

  // Mirror the conversation to #ticket-archive (best-effort) before
  // archive. Skip silently if no archive channel configured.
  if (env.TICKET_ARCHIVE_CHANNEL_ID) {
    try {
      const messages = await discordFetch(env, `/channels/${channelId}/messages?limit=100`, { method: 'GET' })
      const transcript = messages
        .reverse()
        .map((m) => `**${m.author.username}** [${m.timestamp}]\n${m.content || '*(no text)*'}`)
        .join('\n\n')
      await discordFetch(env, `/channels/${env.TICKET_ARCHIVE_CHANNEL_ID}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          content: `📋 Transcript of <#${channelId}> (closed by <@${interaction.member?.user?.id ?? 'unknown'}>):\n\n` +
                   transcript.slice(0, 1900),
        }),
      })
    } catch { /* best-effort — keep going */ }
  }

  // Archive + lock the thread. Locking means only mods can re-open;
  // archive frees it from active-thread quotas.
  await discordFetch(env, `/channels/${channelId}`, {
    method: 'PATCH',
    body: JSON.stringify({ archived: true, locked: true }),
  })

  await editFollowup(appId, interactionToken, {
    content: '✓ Ticket closed + transcript archived.',
    flags: MSG_FLAG_EPHEMERAL,
  })
}

async function handleGrantVip(env, interaction, customId) {
  const channelId = interaction.channel_id
  const interactionToken = interaction.token
  const appId = interaction.application_id
  const clickerId = interaction.member?.user?.id ?? interaction.user?.id
  const clickerRoles = interaction.member?.roles ?? []

  // Authorization: clicker must be the SUPPORT_ROLE_ID holder (default
  // @MAXXER++) OR Diggy himself. Anyone else clicking gets bounced.
  const isMod = clickerRoles.includes(env.SUPPORT_ROLE_ID) || clickerId === env.DIGGY_USER_ID
  if (!isMod) {
    await editFollowup(appId, interactionToken, {
      content: '⛔ Only mods can grant VIP. If you bought VIP, you should already have the role granted automatically — if not, ping <@' + env.DIGGY_USER_ID + '>.',
    })
    return
  }

  // Extract buyer id from custom_id ("grant-vip:<id>")
  const buyerId = customId.split(':')[1] ?? ''
  if (!/^\d+$/.test(buyerId)) {
    await editFollowup(appId, interactionToken, {
      content: '⚠ Could not extract buyer id from button. Re-spawn the ticket?',
    })
    return
  }

  // Grant @VIP role. Discord PUT is idempotent (no-op if already has it).
  const grantResult = await discordFetch(
    env,
    `/guilds/${env.DISCORD_GUILD_ID}/members/${buyerId}/roles/${env.VIP_ROLE_ID}`,
    {
      method: 'PUT',
      headers: { 'X-Audit-Log-Reason': `granted by mod ${clickerId} via tickets-worker` },
    },
  )

  if (grantResult === null) {
    await editFollowup(appId, interactionToken, {
      content: '⚠ Discord rejected the role grant. Likely missing perms — bot needs MANAGE_ROLES + the @VIP role must sit BELOW @Maxx in the role list. Try again after fixing.',
    })
    return
  }

  // Visible confirmation in the thread (not ephemeral — we want the
  // buyer to see it land).
  await discordFetch(env, `/channels/${channelId}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      content: `✓ <@${buyerId}> just got <@&${env.VIP_ROLE_ID}> — welcome to the lounge. <#1502870742826618880> + <#1502870743543971901> are now visible.`,
      allowed_mentions: { users: [buyerId], roles: [] }, // ping the buyer, don't fan-mention @VIP
    }),
  })

  await editFollowup(appId, interactionToken, {
    content: '✓ Granted. Buyer now sees the VIP lounge.',
    flags: MSG_FLAG_EPHEMERAL,
  })
}

// ─── Slash command handlers ─────────────────────────────────────────────

async function handleLivePoints(env, interaction) {
  if (livePointsInFlight >= LIVE_POINTS_MAX_IN_FLIGHT) {
    await editFollowup(interaction.application_id, interaction.token, {
      content: '⏳ Live lookup capacity is busy. Try again in a moment.',
      flags: MSG_FLAG_EPHEMERAL,
      allowed_mentions: { parse: [] },
    })
    return
  }

  const callerId = interaction.member?.user?.id ?? interaction.user?.id
  const isVip = hasVipRole(interaction, env)
  const cooldownSeconds = isVip ? LIVE_POINTS_VIP_COOLDOWN_SECONDS : LIVE_POINTS_COOLDOWN_SECONDS
  const cooldown = claimLivePointsCooldown(callerId, cooldownSeconds)
  if (!cooldown.allowed) {
    await editFollowup(interaction.application_id, interaction.token, {
      content: `⏱ Live points is limited to one lookup every ${cooldownSeconds} seconds. Try again in ${cooldown.retryAfterSeconds}s.`,
      flags: MSG_FLAG_EPHEMERAL,
      allowed_mentions: { parse: [] },
    })
    return
  }

  livePointsInFlight += 1
  let result
  try {
    result = await loadLivePoints({
      ign: getOption(interaction, 'ign'),
      accountId: getOption(interaction, 'account_id'),
      region: getOption(interaction, 'region'),
      tournament: getOption(interaction, 'tournament'),
      games: getOption(interaction, 'games'),
      buffer: getOption(interaction, 'buffer'),
    })
  } catch {
    result = { ok: false, error: 'Live points are unavailable right now. Try again in a moment.' }
  } finally {
    livePointsInFlight -= 1
  }
  await editFollowup(interaction.application_id, interaction.token, {
    ...(result.ok ? { embeds: [formatPointsEmbed(result)] } : { content: formatPointsDiscord(result) }),
    flags: MSG_FLAG_EPHEMERAL,
    allowed_mentions: { parse: [] },
  })
}

function hasVipRole(interaction, env) {
  const vipRoleId = env.VIP_ROLE_ID
  return Boolean(
    vipRoleId &&
    Array.isArray(interaction.member?.roles) &&
    interaction.member.roles.some(roleId => String(roleId) === String(vipRoleId)),
  )
}

function claimLivePointsCooldown(userId, cooldownSeconds = LIVE_POINTS_COOLDOWN_SECONDS, now = Date.now()) {
  if (!userId) return { allowed: true, retryAfterSeconds: 0 }

  const key = String(userId)
  const existingExpiry = livePointsCooldowns.get(key)
  if (existingExpiry && existingExpiry > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existingExpiry - now) / 1000)),
    }
  }

  for (const [id, expiry] of livePointsCooldowns) {
    if (expiry <= now) livePointsCooldowns.delete(id)
  }
  if (livePointsCooldowns.size >= LIVE_POINTS_MAX_COOLDOWNS) {
    const oldest = livePointsCooldowns.keys().next().value
    if (oldest) livePointsCooldowns.delete(oldest)
  }

  livePointsCooldowns.set(key, now + cooldownSeconds * 1000)
  return { allowed: true, retryAfterSeconds: 0 }
}

/**
 * Diggy-only gate. Strict — user.id must match env.DIGGY_USER_ID. No
 * mod-role override, no support-role override. Slash commands route
 * through this so even if Discord's command-permission UI gets
 * misconfigured, the worker rejects non-Diggy callers.
 *
 * Returns true on auth pass, false after editing the deferred reply
 * with a denial. Callers should `return` immediately on false.
 */
async function requireDiggy(env, interaction) {
  const callerId = interaction.member?.user?.id ?? interaction.user?.id
  if (callerId !== env.DIGGY_USER_ID) {
    await editFollowup(interaction.application_id, interaction.token, {
      content: '⛔ Diggy-only command. Only <@' + env.DIGGY_USER_ID + '> can run this.',
      flags: MSG_FLAG_EPHEMERAL,
    })
    return false
  }
  return true
}

/**
 * Pulls a slash-command option by name.
 */
function getOption(interaction, name) {
  return (interaction.data?.options ?? []).find(o => o.name === name)?.value
}

/**
 * DM a recipient via the bot. Returns true on success.
 * Opens (or reuses) the DM channel via POST /users/@me/channels.
 */
async function dmUser(env, recipientId, content) {
  const dmChannel = await discordFetch(env, '/users/@me/channels', {
    method: 'POST',
    body: JSON.stringify({ recipient_id: recipientId }),
  })
  if (!dmChannel?.id) return false
  const r = await discordFetch(env, `/channels/${dmChannel.id}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
  return r !== null
}

// Crockford-style base32 alphabet (no I, L, O, U). Must match
// optimizationmaxxing/scripts/mint-unbound-codes.py CROCKFORD and
// vip-worker/worker.js ALLOWED_CODE_RE.
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

/** Mint N random Crockford-base32 chars using crypto.getRandomValues. */
function mintRandomCrockford(n) {
  const buf = new Uint8Array(n)
  crypto.getRandomValues(buf)
  let out = ''
  for (let i = 0; i < n; i++) out += CROCKFORD[buf[i] & 0x1f]
  return out
}

/**
 * Mint a 16-char code with a tier-encoding first char:
 *   tier='maxxer'         -> "1" + 15 random
 *   tier='maxxerplus'     -> "2" + 15 random
 *   tier='maxxerplusplus' -> "3" + 15 random
 *   tier='founder'        -> "FNDR" + 12 random (matches vip-worker's
 *                            FOUNDER_PREFIX = "FNDR" — gets a sequential
 *                            1-33 number assigned atomically at claim.)
 *
 * Vip-worker's tierFromCode() reads the prefix to determine which
 * Discord role + which client tier to grant. Any code NOT matching one
 * of these prefixes (e.g. pre-tier-prefix legacy codes) defaults to
 * MAXXER++ for backwards-compat.
 */
function mintCode(tier) {
  if (tier === 'founder') {
    return 'FNDR' + mintRandomCrockford(12)
  }
  let prefix
  switch (tier) {
    case 'maxxer': prefix = '1'; break
    case 'maxxerplus': prefix = '2'; break
    case 'maxxerplusplus': prefix = '3'; break
    default: throw new Error('unknown tier: ' + tier)
  }
  return prefix + mintRandomCrockford(15)
}

/** Format a 16-char raw code as MAXX-XXXX-XXXX-XXXX-XXXX for display. */
function formatCodeForDisplay(rawCode) {
  const norm = rawCode.toUpperCase().replace(/^MAXX-?/, '').replace(/[-\s]/g, '')
  const chunks = []
  for (let i = 0; i < norm.length; i += 4) chunks.push(norm.slice(i, i + 4))
  return 'MAXX-' + chunks.join('-')
}

/** Human-readable tier label for DMs / confirmations. */
function tierLabel(tier) {
  return ({
    maxxer: 'MAXXER',
    maxxerplus: 'MAXXER+',
    maxxerplusplus: 'MAXXER++',
    founder: 'Founder',
  })[tier] ?? tier
}

/** Term name → milliseconds. null = lifetime. */
function termToMs(term) {
  switch (term) {
    case 'monthly': return 30 * 24 * 60 * 60 * 1000      // 30 days
    case 'annual':  return 365 * 24 * 60 * 60 * 1000     // 365 days
    case 'lifetime':
    case null:
    case undefined:
      return null
    default:
      throw new Error('unknown term: ' + term)
  }
}

/** Human-readable term for DM messages. */
function termLabel(term) {
  return ({ monthly: '30-day', annual: '1-year', lifetime: 'lifetime' })[term] ?? term ?? 'lifetime'
}

/**
 * Write the code's metadata to the shared VIP_CLAIMS KV. Vip-worker
 * reads `meta:<code>` at claim time to derive tier + scope + expiresAt.
 * Without this entry vip-worker falls back to tier-from-first-char +
 * scope=both + lifetime (backwards-compat for legacy mints).
 *
 * Idempotent — safe to call multiple times for the same code; the value
 * overwrites. Failures don't block the DM (caller is the source of
 * truth from Diggy's perspective).
 */
async function writeCodeMeta(env, code, { tier, scope, term, mintedBy }) {
  if (!env.VIP_CLAIMS) {
    console.warn('[writeCodeMeta] VIP_CLAIMS not bound — meta NOT written, vip-worker will fall back to defaults')
    return
  }
  const durationMs = termToMs(term)
  const meta = {
    tier,                              // 'maxxer' | 'maxxerplus' | 'maxxerplusplus' | 'founder'
    scope,                             // 'om' | 'dm' | 'both'
    durationMs,                        // null = lifetime, else ms
    mintedAt: Date.now(),
    mintedBy: mintedBy ?? 'unknown',
  }
  try {
    await env.VIP_CLAIMS.put(`meta:${code}`, JSON.stringify(meta), {
      // metadata index lets the worker filter without fetching values
      metadata: { tier, scope, durationMs },
    })
  } catch (e) {
    console.warn('[writeCodeMeta] put failed:', e?.message ?? e)
  }
}

/**
 * /gen tier:<MAXXER|MAXXER+|MAXXER++> [user:<@id>]
 * /om   [user:<@id>]   (alias for /gen tier:maxxerplusplus, OM purchase context)
 *
 * Mints a fresh tier-encoded code on demand. If user given, DMs them
 * the code + redemption instructions. Else returns the code ephemerally
 * to Diggy so he can hand-deliver. The code is NOT pre-registered with
 * vip-worker — first-claim-wins still applies, so don't leak it.
 */
async function handleGen(env, interaction, commandName) {
  if (!(await requireDiggy(env, interaction))) return

  // /om is a thin alias for /gen tier:maxxerplusplus + scope=om +
  // lifetime — the optimizationmaxxing one-time-purchase flow ($115).
  let tier, term, scope, targetUserId
  if (commandName === 'om') {
    tier = 'maxxerplusplus'
    term = 'lifetime'
    scope = 'om'
    targetUserId = getOption(interaction, 'user') ?? ''
  } else {
    tier = (getOption(interaction, 'tier') || '').toString()
    term = (getOption(interaction, 'term') || 'monthly').toString()
    scope = 'dm'   // /gen is the discordmaxxer subscription flow
    targetUserId = getOption(interaction, 'user') ?? ''
  }

  if (!['maxxer', 'maxxerplus', 'maxxerplusplus'].includes(tier)) {
    await editFollowup(interaction.application_id, interaction.token, {
      content: '⚠ Bad tier. Pick from MAXXER / MAXXER+ / MAXXER++.',
      flags: MSG_FLAG_EPHEMERAL,
    })
    return
  }
  if (!['monthly', 'annual', 'lifetime'].includes(term)) {
    await editFollowup(interaction.application_id, interaction.token, {
      content: '⚠ Bad term. Pick monthly / annual / lifetime.',
      flags: MSG_FLAG_EPHEMERAL,
    })
    return
  }

  const code = mintCode(tier)
  const formatted = formatCodeForDisplay(code)
  const label = tierLabel(tier)
  const tLabel = termLabel(term)
  const scopeLabel = scope === 'om' ? 'Optimizationmaxxing only' : (scope === 'dm' ? 'Discordmaxxer only' : 'all products')

  // Write metadata BEFORE DMing — if meta write fails the user shouldn't
  // get a code that we can't enforce against.
  await writeCodeMeta(env, code, { tier, scope, term, mintedBy: interaction.member?.user?.id ?? interaction.user?.id })

  if (targetUserId && /^\d+$/.test(targetUserId)) {
    const dmText =
      `🎁 Your Maxxer VIP code:\n\n` +
      '```\n' + formatted + '\n```\n' +
      `**Tier:** ${label}\n` +
      `**Scope:** ${scopeLabel}\n` +
      `**Term:** ${tLabel}${term === 'lifetime' ? '' : ' (auto-expires after first claim)'}\n\n` +
      (scope === 'om'
        ? 'Paste it into **Optimizationmaxxing → VIP**. This code is OM-only — Discordmaxxer will reject it.\n'
        : 'Paste it into **Discordmaxxer → DMVipClaim**. This code is DM-only — Optimizationmaxxing will reject it.\n') +
      'Codes are first-claim-wins per HWID; redeem on the rig you plan to keep.\n\n' +
      'Stuck? Reply or open a ticket: https://discord.gg/S78eecbWdx'
    const ok = await dmUser(env, targetUserId, dmText)
    if (ok) {
      await editFollowup(interaction.application_id, interaction.token, {
        content: `✓ DMed **${label}** ${tLabel} (${scopeLabel}) code to <@${targetUserId}>.\n\nCode (for your records): \`${formatted}\``,
        flags: MSG_FLAG_EPHEMERAL,
      })
      return
    }
    await editFollowup(interaction.application_id, interaction.token, {
      content:
        `⚠ Could NOT DM <@${targetUserId}> (DMs closed or bot blocked). ` +
        `Hand-deliver this **${label}** ${tLabel} (${scopeLabel}) code:\n\n` +
        '```\n' + formatted + '\n```',
      flags: MSG_FLAG_EPHEMERAL,
    })
    return
  }

  // No user → just hand the code to Diggy ephemerally.
  await editFollowup(interaction.application_id, interaction.token, {
    content: `Minted **${label}** ${tLabel} (${scopeLabel}):\n\n\`\`\`\n${formatted}\n\`\`\``,
    flags: MSG_FLAG_EPHEMERAL,
  })
}

/**
 * /33 user:<@id>
 *
 * Pulls one pre-minted FNDR* code from the founder pool (KV prefix
 * `unused:founder:`), DMs it to the target user, deletes the KV entry.
 * The vip-worker's atomic founder counter (1-33) assigns the actual
 * Founder NUMBER at claim time — this command just hands out the codes
 * Diggy pre-uploaded.
 *
 * Pool is uploaded via scripts/upload-pool.mjs with pool=founder. See
 * tickets-worker/README.md for the 33-code mint+upload one-shot.
 */
async function handle33(env, interaction) {
  if (!(await requireDiggy(env, interaction))) return

  if (!env.VIP_CODE_POOL) {
    await editFollowup(interaction.application_id, interaction.token, {
      content: '⚠ VIP_CODE_POOL KV namespace not bound. Add the binding in wrangler.toml + redeploy.',
      flags: MSG_FLAG_EPHEMERAL,
    })
    return
  }

  const targetUserId = getOption(interaction, 'user') ?? ''
  if (!/^\d+$/.test(targetUserId)) {
    await editFollowup(interaction.application_id, interaction.token, {
      content: '⚠ Bad user option. @-mention the recipient.',
      flags: MSG_FLAG_EPHEMERAL,
    })
    return
  }

  // Pull the first unused FNDR code from the founder pool.
  const prefix = 'unused:founder:'
  const list = await env.VIP_CODE_POOL.list({ prefix, limit: 1 })
  if (!list.keys.length) {
    await editFollowup(interaction.application_id, interaction.token, {
      content:
        '⚠ Founder pool is empty. Upload more (or you\'ve handed out all 33):\n' +
        '```\nnode scripts/upload-pool.mjs founder < your-33-founder-codes.txt\n```',
      flags: MSG_FLAG_EPHEMERAL,
    })
    return
  }
  const key = list.keys[0].name
  const code = key.slice(prefix.length)

  // Delete first so a concurrent run can't grab the same code twice.
  try {
    await env.VIP_CODE_POOL.delete(key)
  } catch (e) {
    await editFollowup(interaction.application_id, interaction.token, {
      content: `⚠ KV delete failed: ${e?.message ?? e}. Aborted to avoid double-issue.`,
      flags: MSG_FLAG_EPHEMERAL,
    })
    return
  }

  // Founder codes: MAXXER++ tier, lifetime, scope=both (founders get
  // every product). Vip-worker's atomic counter assigns the actual
  // 1-33 number at claim time.
  await writeCodeMeta(env, code, {
    tier: 'founder',
    scope: 'both',
    term: 'lifetime',
    mintedBy: interaction.member?.user?.id ?? interaction.user?.id,
  })

  const formatted = formatCodeForDisplay(code)
  const dmText =
    `👑 Your **Founder** Maxxer code — one of 33, never reissued:\n\n` +
    '```\n' + formatted + '\n```\n' +
    '**Tier:** MAXXER++ (Founder #X assigned at claim)\n' +
    '**Scope:** all products (Optmaxxing + Discordmaxxer)\n' +
    '**Term:** lifetime\n\n' +
    'Paste it into **Optimizationmaxxing → VIP** or **Discordmaxxer → DMVipClaim** to claim. ' +
    'Your numbered Founder badge (#1-#33) is assigned automatically at claim time.\n\n' +
    'Stuck? Reply or open a ticket: https://discord.gg/S78eecbWdx'

  const ok = await dmUser(env, targetUserId, dmText)
  if (ok) {
    await editFollowup(interaction.application_id, interaction.token, {
      content: `✓ DMed **Founder** code to <@${targetUserId}>.\n\nCode (for your records): \`${formatted}\``,
      flags: MSG_FLAG_EPHEMERAL,
    })
    return
  }
  // DM failed — code already popped. Hand it to Diggy.
  await editFollowup(interaction.application_id, interaction.token, {
    content:
      `⚠ Could NOT DM <@${targetUserId}> (DMs closed). ` +
      `Code already popped from founder pool — hand-deliver:\n\n` +
      '```\n' + formatted + '\n```',
    flags: MSG_FLAG_EPHEMERAL,
  })
}

/**
 * /founderstatus
 *
 * Counts remaining unused founder codes in the pool. No args. The
 * vip-worker tracks the actual claimed founder NUMBERS atomically;
 * this only reports inventory.
 */
async function handleFounderStatus(env, interaction) {
  if (!(await requireDiggy(env, interaction))) return

  if (!env.VIP_CODE_POOL) {
    await editFollowup(interaction.application_id, interaction.token, {
      content: '⚠ VIP_CODE_POOL not bound yet.',
      flags: MSG_FLAG_EPHEMERAL,
    })
    return
  }

  // Paginate KV. 33 max so one page suffices, but paginate defensively.
  let cursor
  let remaining = 0
  do {
    const page = await env.VIP_CODE_POOL.list({ prefix: 'unused:founder:', cursor, limit: 1000 })
    remaining += page.keys.length
    cursor = page.list_complete ? undefined : page.cursor
  } while (cursor)

  await editFollowup(interaction.application_id, interaction.token, {
    content: `👑 **Founder pool**: ${remaining} of 33 unused.\n` +
      (remaining === 0 ? 'All handed out. Mint more if you want to extend beyond 33 (but the cap is enforced at claim by vip-worker — 34th claim returns 410).' : ''),
    flags: MSG_FLAG_EPHEMERAL,
  })
}

/**
 * /sccoins amount:<int> [uses:<int>] [user:<@id>] [note:<str>]
 *
 * Mints a SPRITE CANNON coin code via the spritecannon-codes worker
 * (POST /admin/gen, Bearer SC_CODES_ADMIN_TOKEN). Players redeem it
 * in-game (Settings → enter code) for local coins. Single-use by
 * default; `uses` lets one code be claimed by N different players
 * (deduped per-player by the codes worker). Diggy-only.
 *
 * Unlike /gen (VIP tier codes in KV here), this calls the EXTERNAL
 * Sprite Cannon code worker — coins live client-side, the code is the
 * unforgeable server-authorized grant.
 */
async function handleSccoins(env, interaction) {
  if (!(await requireDiggy(env, interaction))) return
  const appId = interaction.application_id
  const token = interaction.token

  const amount = parseInt(getOption(interaction, 'amount'), 10)
  const uses = parseInt(getOption(interaction, 'uses') ?? 1, 10) || 1
  const targetUserId = getOption(interaction, 'user') ?? ''
  const note = (getOption(interaction, 'note') ?? '').toString().slice(0, 100)

  if (!(amount >= 1 && amount <= 1000000)) {
    await editFollowup(appId, token, { content: '⚠ Amount must be 1–1,000,000 coins.', flags: MSG_FLAG_EPHEMERAL })
    return
  }
  if (!env.SC_CODES_ADMIN_TOKEN) {
    await editFollowup(appId, token, {
      content: '⚠ `SC_CODES_ADMIN_TOKEN` secret not set on this worker. Run `wrangler secret put SC_CODES_ADMIN_TOKEN` in maxxtopia/tickets-worker.',
      flags: MSG_FLAG_EPHEMERAL,
    })
    return
  }

  const base = env.SC_CODES_URL || 'https://spritecannon-codes.maxxtopia.workers.dev'
  const callerId = interaction.member?.user?.id ?? interaction.user?.id ?? 'unknown'
  let res
  try {
    const r = await fetch(base + '/admin/gen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + env.SC_CODES_ADMIN_TOKEN },
      body: JSON.stringify({ coins: amount, uses, note: note || ('discord /sccoins by ' + callerId) }),
    })
    res = await r.json().catch(() => ({}))
    if (!r.ok || !res.ok || !res.code) {
      await editFollowup(appId, token, {
        content: `⚠ Code worker rejected the mint (HTTP ${r.status}): ${res.error || 'unknown error'}.`,
        flags: MSG_FLAG_EPHEMERAL,
      })
      return
    }
  } catch (e) {
    await editFollowup(appId, token, {
      content: '⚠ Could not reach the Sprite Cannon code worker: ' + (e?.message ?? e),
      flags: MSG_FLAG_EPHEMERAL,
    })
    return
  }

  const code = res.code
  const usesLabel = uses > 1 ? ` (usable by ${uses} different players)` : ' (single-use)'
  const amt = amount.toLocaleString()

  if (targetUserId && /^\d+$/.test(targetUserId)) {
    const dmText =
      `🪙 Your **Sprite Cannon** coin code — **${amt} coins**${usesLabel}:\n\n` +
      '```\n' + code + '\n```\n' +
      'Redeem it in **Sprite Cannon → Settings (⚙) → enter code**.\n' +
      'Play: https://maxxtopia.com/play/spritecannon\n\n' +
      'Stuck? https://discord.gg/S78eecbWdx'
    const ok = await dmUser(env, targetUserId, dmText)
    if (ok) {
      await editFollowup(appId, token, {
        content: `✓ DMed a **${amt}**-coin code${usesLabel} to <@${targetUserId}>.\n\nCode (for your records): \`${code}\``,
        flags: MSG_FLAG_EPHEMERAL,
      })
      return
    }
    await editFollowup(appId, token, {
      content: `⚠ Could NOT DM <@${targetUserId}> (DMs closed). Hand-deliver this **${amt}**-coin code${usesLabel}:\n\n` + '```\n' + code + '\n```',
      flags: MSG_FLAG_EPHEMERAL,
    })
    return
  }

  await editFollowup(appId, token, {
    content: `🪙 Minted a **${amt}**-coin Sprite Cannon code${usesLabel}:\n\n` + '```\n' + code + '\n```\n' + 'Redeem in-game: Settings (⚙) → enter code.',
    flags: MSG_FLAG_EPHEMERAL,
  })
}

// ─── Helpers ────────────────────────────────────────────────────────────

function productLabelFor(product) {
  // Map the customId suffix back to a human-readable product name. New
  // products: add a row here, no other change needed.
  const map = {
    optmaxxing: 'Optimizationmaxxing',
    discordmaxxer: 'Discordmaxxer',
    clipmaxxer: 'Clipmaxxer',
    // Discordmaxxer tier-specific buttons (each spawns a thread with
    // tier-pricing baked into the welcome message).
    'dm-maxxer': 'Discordmaxxer · MAXXER',
    'dm-maxxer-plus': 'Discordmaxxer · MAXXER+',
    'dm-maxxer-plus-plus': 'Discordmaxxer · MAXXER++',
    'dm-founder': 'Discordmaxxer · Founder #(x)',
  }
  return map[product] ?? product
}

// Discordmaxxer-tier pricing copy. Each entry surfaces in buildWelcomeMessage.
// Source of truth: project_discordmaxxer.md ladder + Founder strip.
const DM_TIER_COPY = {
  'dm-maxxer':            { price: '$4 / month',        annual: '$38 / yr · save 20%',     bracket: '[VIP]',    perks: 'typing prefix · avatar ring · 5 cursor skins · 5 saved video bg slots' },
  'dm-maxxer-plus':       { price: '$9 / month',        annual: '$86 / yr · save 20%',     bracket: '[VIP+]',   perks: 'video backgrounds · 3 exclusive themes · member-list name glow · profile popout banner · 20 saved video bg slots' },
  'dm-maxxer-plus-plus':  { price: '$17 / month',       annual: '$163 / yr · save 20%',    bracket: '[MVP++]',  perks: 'animated badge · custom presence text · voice-channel name color · beta builds · plugin votes · About credit · unlimited slots' },
  'dm-founder':           { price: '$67 one-time',      annual: '33 ever, never reissued', bracket: 'Founder #(x)', perks: 'your numbered gem badge (one of #1–#33) · 1 month MAXXER++ free · 1-month gift code · MAXXER++ price-locked at $12/mo for life' },
}

function buildWelcomeMessage(product, productLabel, userId, diggyId) {
  // Optmaxxing — lifetime + Element 115 framing.
  if (product === 'optmaxxing') {
    return [
      `**Welcome <@${userId}> — buying ${productLabel} VIP.**`,
      '',
      `Only you and <@${diggyId}> can see this thread. Take your time — Diggy usually replies within a few hours.`,
      '',
      '**To complete your purchase:**',
      '1. Tell Diggy your preferred payment: PayPal / BTC / Venmo / Cash App.',
      '2. He sends you the address + amount. **$115** during the launch sale (through 2026-05-31), $180 after.',
      '3. Once payment lands, Diggy DMs you a 16-char activation code.',
      '4. In-app: Pricing → tap "$115" 5x in 3 seconds → paste code → first-claim-wins on your rig forever.',
      '',
      '*Element 115 — the substance that turns dead PCs into living ones.*',
      '',
      '**When you\'re done**: hit `🔒 Close ticket` below. The thread archives and a transcript is saved for our records.',
    ].join('\n')
  }

  // Discordmaxxer tier ladder — same payment flow, tier-aware copy.
  if (DM_TIER_COPY[product]) {
    const tier = DM_TIER_COPY[product]
    const isFounder = product === 'dm-founder'
    return [
      `**Welcome <@${userId}> — buying ${productLabel}.**`,
      '',
      `Only you and <@${diggyId}> can see this thread. Take your time — Diggy usually replies within a few hours.`,
      '',
      `**${tier.bracket} · ${tier.price}** _(${tier.annual})_`,
      `Perks: ${tier.perks}`,
      '',
      '**To complete your purchase:**',
      '1. Tell Diggy your preferred payment: PayPal / BTC / Venmo / Cash App.',
      `2. He sends you the address + amount: **${tier.price}**${isFounder ? ' — pay once, own a numbered Founder slot for life.' : ' — paid monthly (or save 20% paying annually).'}`,
      '3. Once payment lands, Diggy DMs you a 16-char HWID-bound activation code.',
      '4. In Discordmaxxer: open the Hub panel → VIP claim → paste code. First-claim-wins; the code locks to your rig forever, even offline.',
      '5. Diggy clicks `Grant VIP` below — your `@VIP` role lands in the Maxxtopia Discord, unlocking #vip-chat + #early-access.',
      '',
      isFounder
        ? '*Founder slots: 33 ever, never reissued. The numbered gem badge appears on your popout for every Discordmaxxer user. MAXXER++ price-locked at $12/mo for life — immune to future raises.*'
        : '*Pricing details: <https://maxxtopia.com/discordmaxxer/vip>*',
      '',
      '**When you\'re done**: hit `🔒 Close ticket` below. The thread archives and a transcript is saved for our records.',
    ].join('\n')
  }

  // Fallback for any product we haven't custom-scripted yet.
  return [
    `**Welcome <@${userId}> — buying ${productLabel}.**`,
    '',
    `<@${diggyId}> will reply with payment instructions shortly.`,
  ].join('\n')
}

async function discordFetch(env, path, opts = {}) {
  const res = await fetch(`${DISCORD_API}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  })
  if (res.status === 204) return true
  if (!res.ok) {
    // eslint-disable-next-line no-console
    console.error(`[discordFetch] ${path} → ${res.status} ${await res.text().catch(() => '')}`)
    return null
  }
  try {
    return await res.json()
  } catch {
    return null
  }
}

async function editFollowup(appId, token, body) {
  // POST to the @original webhook to edit the deferred response.
  await fetch(`${DISCORD_API}/webhooks/${appId}/${token}/messages/@original`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function jsonResponse(obj) {
  return new Response(JSON.stringify(obj), {
    headers: { 'Content-Type': 'application/json' },
  })
}

// ─── Ed25519 signature verification (Web Crypto) ────────────────────────

async function verifyDiscordSignature(publicKeyHex, signatureHex, timestamp, body) {
  if (!publicKeyHex || !signatureHex || !timestamp) return false
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      hexToBytes(publicKeyHex),
      { name: 'Ed25519' },
      false,
      ['verify'],
    )
    const sig = hexToBytes(signatureHex)
    const msg = new TextEncoder().encode(timestamp + body)
    return await crypto.subtle.verify('Ed25519', key, sig, msg)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[verify] failed:', e?.message ?? e)
    return false
  }
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}
