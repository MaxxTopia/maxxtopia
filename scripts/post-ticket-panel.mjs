/*
 * Posts (or refreshes) the buy-ticket panels in #open-ticket. Each panel is
 * a styled embed + Discord button(s). When clicked, buttons hit the
 * maxxtopia-tickets Cloudflare Worker, which spawns a private thread per
 * buyer (handler in tickets-worker/worker.js).
 *
 * Idempotent per panel — looks for a prior Maxx-authored panel with each
 * panel's unique button ID (or its one-time legacy marker) and edits it
 * in-place if it exists. Internal identifiers are never shown in the embed.
 *
 * Two panels currently posted:
 *   1. Optimizationmaxxing — permanent $115 lifetime purchase, single button
 *   2. Discordmaxxer — 4-tier ladder (MAXXER / MAXXER+ / MAXXER++ / Founder),
 *      4 buttons in a single row per Discord's row limit (5)
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
const envPath = process.env.MAXX_BOT_ENV_PATH || join(ROOT, '.bot-setup.local.env');
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
const UPDATE_ONLY = ARGS.has('--update-only');
const SILENT = 1 << 12;
if (DRY) console.log('[post-panel] DRY RUN — no changes. Pass --execute to commit.\n');

// ─── Panel definitions ─────────────────────────────────────────────────────
// Legacy signatures are lookup-only so the first clean migration can find
// old panels. Unique component IDs are the durable, invisible identifiers.
const sig = (key, ver) => `​​​[ticket-panel:${key}:${ver}]`;

const OPEN_TICKET_CHANNEL_NAME = 'open-ticket';

const OPTMAXXING_PANEL = {
    key: 'optmaxxing',
    legacySignatures: [sig('optmaxxing', 'v1')],
    title: 'Buy Optimizationmaxxing VIP — $115 lifetime',
    color: 0x3af0f0, // Element 115 cyan
    description: [
        '**$115 permanently. One payment, no subscription.**',
        'Your VIP access and every future VIP update are yours for life at no extra cost.',
        '',
        '**What is included**',
        '• The current VIP-only tuning catalog and curated competitive packs',
        '• A permanent activation for your rig, plus visible recovery paths',
        '• Future VIP tweaks, packs, and improvements as Windows, drivers, and games change',
        '• Access to the Maxxtopia VIP and early-access channels after purchase',
        '',
        'Possible first-time-tuner discount tickets may occasionally appear. They are limited offers, not a price increase or subscription.',
        '',
        '**Click below** to open a private thread visible only to you and Diggy. Choose PayPal / BTC / Venmo / Cash App, then receive your activation code by DM.',
        '',
        '*Actively maintained. Results vary by rig, so Optimizationmaxxing measures changes and keeps recovery in view instead of promising one universal latency number.*',
        '',
        '*Element 115 — the substance that turns dead PCs into living ones.*',
    ].join('\n'),
    buttons: [
        {
            customId: 'vip-buy-optmaxxing',
            label: 'Buy VIP — $115 lifetime',
            style: ButtonStyle.Success,
            emoji: '🧪', // test tube — closest universal emoji to "Element 115"
        },
    ],
};

const DISCORDMAXXER_PANEL = {
    key: 'discordmaxxer',
    legacySignatures: [sig('discordmaxxer', 'v2')],
    title: 'Buy Discordmaxxer VIP — 4 tiers + Founder slot',
    color: 0xffaa00, // gold (MAXXER++ accent)
    description: [
        'The whole client is **free forever**. Paid tiers add cosmetic + cross-user status surfacing — colored name brackets, glowing avatar rings, animated badges, custom presence text. The flex stays visible to your whole friends list.',
        '',
        '**MAXXER · $4/mo** — Typing prefix · avatar ring · 5 cursor skins · 5 video bg slots',
        '**MAXXER+ · $9/mo** — Video backgrounds · 3 exclusive themes · name glow · popout banner · 20 slots',
        '**MAXXER++ · $17/mo** — Animated badge · custom presence text · voice channel color · beta builds · plugin votes · About credit',
        '**Founder #(x) · $67 one-time** — 33 ever, never reissued. Your numbered gem badge (one of #1–#33) · 1 month MAXXER++ free · 1-month gift code · MAXXER++ price-locked at **$12/mo for life**',
        '',
        '**Click your tier below** → private thread with Diggy. Same payment flow as optimizationmaxxing — PayPal / BTC / Venmo / Cash App, then DM\'d a 16-char HWID-bound activation code.',
        '',
        'Pricing & details: <https://maxxtopia.com/discordmaxxer/vip>',
    ].join('\n'),
    buttons: [
        {
            customId: 'vip-buy-dm-maxxer',
            label: 'Buy MAXXER — $4/mo',
            style: ButtonStyle.Success, // green (Hypixel [VIP] color)
            emoji: '🟢',
        },
        {
            customId: 'vip-buy-dm-maxxer-plus',
            label: 'Buy MAXXER+ — $9/mo',
            style: ButtonStyle.Primary, // aqua-leaning blue (Hypixel [VIP+])
            emoji: '🟦',
        },
        {
            customId: 'vip-buy-dm-maxxer-plus-plus',
            label: 'Buy MAXXER++ — $17/mo',
            style: ButtonStyle.Secondary, // grey-ish, gold emoji carries the color
            emoji: '🟡',
        },
        {
            customId: 'vip-buy-dm-founder',
            label: 'Founder #(x) — $67 one-time',
            style: ButtonStyle.Danger, // red — scarcity emphasis
            emoji: '👑',
        },
    ],
};

const PANELS = [OPTMAXXING_PANEL, DISCORDMAXXER_PANEL];

// ─── Helpers ───────────────────────────────────────────────────────────────
function buildEmbed(panel) {
    return new EmbedBuilder()
        .setColor(panel.color)
        .setTitle(panel.title)
        .setDescription(panel.description)
        .setFooter({ text: 'Maxxtopia · self-hosted ticket system · click → private thread' });
}

function buildRow(panel) {
    const row = new ActionRowBuilder();
    for (const b of panel.buttons) {
        const btn = new ButtonBuilder()
            .setCustomId(b.customId)
            .setLabel(b.label)
            .setStyle(b.style);
        if (b.emoji) btn.setEmoji(b.emoji);
        row.addComponents(btn);
    }
    return row;
}

async function syncPanel(channel, clientUserId, panel) {
    const embed = buildEmbed(panel);
    const row = buildRow(panel);
    const fullDescription = panel.description;
    const expectedButtons = panel.buttons.map((button) => ({
        customId: button.customId,
        label: button.label,
        style: button.style,
    }));

    let existing = null;
    try {
        const recent = await channel.messages.fetch({ limit: 50 });
        existing = recent.find((message) => {
            if (message.author.id !== clientUserId) return false;
            const componentIds = (message.components || []).flatMap((row) => (
                (row.components || []).map((component) => component.customId || component.custom_id)
            ));
            const hasPanelButton = panel.buttons.some((button) => componentIds.includes(button.customId));
            const description = String(message.embeds[0]?.description || '');
            const hasLegacyMarker = panel.legacySignatures.some((marker) => description.includes(marker));
            return hasPanelButton || hasLegacyMarker;
        });
    } catch (e) {
        console.warn(`[${panel.key}] could not fetch recent messages: ${e.message}`);
    }

    if (existing) {
        const sameDesc = existing.embeds[0]?.description === fullDescription;
        const sameTitle = existing.embeds[0]?.title === panel.title;
        const currentButtons = (existing.components || []).flatMap((componentRow) => (
            (componentRow.components || []).map((component) => ({
                customId: component.customId || component.custom_id,
                label: component.label,
                style: component.style,
            }))
        ));
        const sameButtons = JSON.stringify(currentButtons) === JSON.stringify(expectedButtons);
        if (sameDesc && sameTitle && sameButtons) {
            console.log(`[${panel.key}] panel already current (id ${existing.id}). No edit needed.`);
        } else {
            console.log(`[${panel.key}] [would] edit existing panel (id ${existing.id}) — copy, title, or button changed`);
            if (!DRY) {
                // Editing an existing message does not create a notification.
                // Suppress all mention parsing; SuppressNotifications is a
                // create-only flag in discord.js and must not be sent here.
                await existing.edit({ embeds: [embed], components: [row], allowedMentions: { parse: [] } });
                console.log(`[${panel.key}] [do]   panel updated in place.`);
            }
        }
    } else {
        if (UPDATE_ONLY) {
            throw new Error(`[${panel.key}] expected an existing panel but none matched its button ID or legacy marker; refusing to post a duplicate`);
        }
        console.log(`[${panel.key}] [would] post new panel in #${channel.name}`);
        if (!DRY) {
            const sent = await channel.send({ embeds: [embed], components: [row], flags: SILENT, allowedMentions: { parse: [] } });
            console.log(`[${panel.key}] [do]   posted (id ${sent.id}).`);
            try {
                await sent.pin(`Pin the ${panel.key} buy-ticket panel`);
                console.log(`[${panel.key}] [do]   pinned.`);
            } catch (e) {
                console.warn(`[${panel.key}] [warn] could not pin: ${e.message}`);
            }
        }
    }
}

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

    for (const panel of PANELS) {
        await syncPanel(channel, client.user.id, panel);
    }

    console.log('\n[post-panel] Done.');
    if (DRY) console.log('[post-panel] Re-run with --execute to apply.');

    await client.destroy();
    process.exit(0);
});

client.on('error', (e) => console.error('[client error]', e));
await client.login(TOKEN);
