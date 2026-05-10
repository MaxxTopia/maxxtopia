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

const DISCORD_API = 'https://discord.com/api/v10'

// Interaction types (https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object-interaction-type)
const INTERACTION_PING = 1
const INTERACTION_MESSAGE_COMPONENT = 3

// Response types
const RESP_PONG = 1
const RESP_DEFERRED_CHANNEL_MESSAGE = 5

// Channel types
const CHANNEL_PRIVATE_THREAD = 12

// Message flags
const MSG_FLAG_EPHEMERAL = 1 << 6

// Per-user spam cap. KV write/read pricing makes this trivial.
const RATE_LIMIT_SECONDS = 60

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

    const interaction = JSON.parse(bodyText)

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

  // Post the welcome message inside the thread, with a Close button.
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

// ─── Helpers ────────────────────────────────────────────────────────────

function productLabelFor(product) {
  // Map the customId suffix back to a human-readable product name. New
  // products: add a row here, no other change needed.
  const map = {
    optmaxxing: 'Optimizationmaxxing',
    discordmaxxer: 'Discordmaxxer',
    clipmaxxer: 'Clipmaxxer',
  }
  return map[product] ?? product
}

function buildWelcomeMessage(product, productLabel, userId, diggyId) {
  // Lifetime price + Element 115 framing for optmaxxing. Other products
  // get their own welcome down the line as we add buy-buttons for them.
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
