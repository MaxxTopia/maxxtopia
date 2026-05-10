/*
 * Posts (or refreshes) the buy-ticket panel in #open-ticket. The panel is
 * a styled embed + a single Discord button. When clicked, the button hits
 * our maxxtopia-tickets Cloudflare Worker, which spawns a private thread
 * for the buyer.
 *
 * Idempotent — looks for a prior Maxx-authored panel with our signature
 * and edits it in-place if it exists. Safe to re-run after copy changes.
 *
 * Usage:
 *   node scripts/post-ticket-panel.mjs --dry-run    # show plan, no changes
 *   node scripts/post-ticket-panel.mjs --execute    # actually post / edit
 *
 * Token sourced from .bot-setup.local.env (gitignored). Same env used by
 * maxxtopia-server-setup.mjs.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
} from 'discord.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── Read env ──────────────────────────────────────────────────────────────
const envPath = join(ROOT, '.bot-setup.local.env');
let TOKEN, GUILD_ID;
try {
    const raw = readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
        const m = line.match(/^([A-Z_]+)\s*=\s*(.+?)\s*$/);
        if (!m) continue;
        if (m[1] === 'DISCORD_BOT_TOKEN') TOKEN = m[2].replace(/^['"]|['"]$/g, '');
        if (m[1] === 'DISCORD_GUILD_ID') GUILD_ID = m[2].replace(/^['"]|['"]$/g, '');
    }
} catch {
    console.error(`[post-panel] Missing ${envPath}`);
    process.exit(1);
}

const ARGS = new Set(process.argv.slice(2));
const DRY = !ARGS.has('--execute');
if (DRY) console.log('[post-panel] DRY RUN — no changes. Pass --execute to commit.\n');

// ─── Panel content ─────────────────────────────────────────────────────────
//
// Bumping the SIGNATURE_VERSION forces a re-post when the embed body changes
// substantively (since equality check looks at the description). For most
// copy tweaks an in-place edit fires automatically — bump only when you
// want a fresh post (e.g. archived → new pinned).
const SIGNATURE_VERSION = 'v1';
// Three zero-width spaces + version tag at the end. Invisible, grep-able.
const PANEL_SIGNATURE = `​​​[ticket-panel:${SIGNATURE_VERSION}]`;

const OPEN_TICKET_CHANNEL_NAME = 'open-ticket';

// Embed body. Cyan border pulls the eye to the button below.
const EMBED_TITLE = 'Buy Optimizationmaxxing VIP — $115 launch sale';
const EMBED_DESCRIPTION = [
    'You paid **$150** for a Superlight 2 to gain 0.5 ms.',
    'Pay **$115** once for **12-22 ms** off your click-to-pixel.',
    '',
    '**Click the button below** → a private thread spawns where only you and Diggy can see it. Tell Diggy your preferred payment (PayPal / BTC / Venmo / Cash App), pay, receive a 16-char activation code via DM.',
    '',
    'Lifetime — pay once, every future tweak pack included.',
    'After **2026-05-31** the price moves to $180.',
    '',
    '*Element 115 — the substance that turns dead PCs into living ones.*',
    PANEL_SIGNATURE,
].join('\n');

// ─── Main ─────────────────────────────────────────────────────────────────
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.once('clientReady', async () => {
    console.log(`[post-panel] Logged in as ${client.user.tag}`);

    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) {
        console.error(`[post-panel] Bot is not in guild ${GUILD_ID}`);
        process.exit(1);
    }

    const channel = guild.channels.cache.find(
        (c) => c.name === OPEN_TICKET_CHANNEL_NAME && c.type === ChannelType.GuildText,
    );
    if (!channel) {
        console.error(`[post-panel] #${OPEN_TICKET_CHANNEL_NAME} not found in guild — run maxxtopia-server-setup.mjs --execute first.`);
        process.exit(1);
    }
    console.log(`[post-panel] Target channel: #${channel.name} (${channel.id})\n`);

    const embed = new EmbedBuilder()
        .setColor(0x3af0f0) // Element 115 cyan
        .setTitle(EMBED_TITLE)
        .setDescription(EMBED_DESCRIPTION)
        .setFooter({ text: 'Maxxtopia · self-hosted ticket system · click → private thread' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('vip-buy-optmaxxing')
            .setLabel('Buy VIP — $115 launch sale')
            .setStyle(ButtonStyle.Success) // green
            .setEmoji('🧪'), // test tube — closest universal emoji to "Element 115"
    );

    // Look for an existing Maxx-authored panel in this channel.
    let existing = null;
    try {
        const recent = await channel.messages.fetch({ limit: 50 });
        existing = recent.find(
            (m) => m.author.id === client.user.id && m.embeds[0]?.description?.endsWith(PANEL_SIGNATURE),
        );
    } catch (e) {
        console.warn(`[warn] could not fetch recent messages: ${e.message}`);
    }

    if (existing) {
        const sameDesc = existing.embeds[0]?.description === EMBED_DESCRIPTION;
        const sameTitle = existing.embeds[0]?.title === EMBED_TITLE;
        if (sameDesc && sameTitle) {
            console.log(`[skip] panel already current (id ${existing.id}). No edit needed.`);
        } else {
            console.log(`[would] edit existing panel (id ${existing.id}) — copy or title changed`);
            if (!DRY) {
                await existing.edit({ embeds: [embed], components: [row] });
                console.log(`[do]   panel updated in place.`);
            }
        }
    } else {
        console.log(`[would] post new panel in #${channel.name}`);
        if (!DRY) {
            const sent = await channel.send({ embeds: [embed], components: [row] });
            console.log(`[do]   posted (id ${sent.id}).`);
            // Pin it so newcomers see the panel without scrolling.
            try {
                await sent.pin('Pin the buy-ticket panel');
                console.log(`[do]   pinned.`);
            } catch (e) {
                console.warn(`[warn] could not pin: ${e.message}`);
            }
        }
    }

    console.log('\n[post-panel] Done.');
    if (DRY) console.log('[post-panel] Re-run with --execute to apply.');

    await client.destroy();
    process.exit(0);
});

client.on('error', (e) => console.error('[client error]', e));
await client.login(TOKEN);
