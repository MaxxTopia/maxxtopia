/*
 * Maxxtopia — one-shot Discord server setup
 *
 * Builds the new server structure (rename, icon, roles, channels, forum-OPs)
 * via a bot token. Run once when relaunching the dead server as the public
 * Maxxtopia community hub. Token never enters chat — read from a local
 * gitignored .bot-setup.local.env file.
 *
 * Usage:
 *   node scripts/maxxtopia-server-setup.mjs --dry-run     # show plan, no changes
 *   node scripts/maxxtopia-server-setup.mjs --execute     # actually do it
 *
 * After running:
 *   1. Verify in Discord
 *   2. Revoke the bot token in dev portal (Bot tab -> Reset Token)
 *   3. Optionally remove the bot from the server
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    Client,
    GatewayIntentBits,
    ChannelType,
    PermissionsBitField,
} from 'discord.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── Read env file ────────────────────────────────────────────────────────
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
    console.error(`[setup] Missing ${envPath}`);
    console.error('[setup] Create it with:');
    console.error('  DISCORD_BOT_TOKEN=...');
    console.error('  DISCORD_GUILD_ID=...');
    process.exit(1);
}
if (!TOKEN || !GUILD_ID) {
    console.error('[setup] env file must define DISCORD_BOT_TOKEN and DISCORD_GUILD_ID');
    process.exit(1);
}

const ARGS = new Set(process.argv.slice(2));
const DRY = !ARGS.has('--execute');
if (DRY) console.log('[setup] DRY RUN — no changes will be made. Pass --execute to commit.\n');

// ─── Plan ─────────────────────────────────────────────────────────────────
const SERVER_NAME = 'Maxxtopia';
const ICON_PATH = join(ROOT, '..', 'discordmaxxer', 'branding', 'discordmaxxer-mark-secondary.png');

const ROLES = [
    { name: 'MAXXER',   color: 0x55ff55, hoist: true,  mentionable: false },
    { name: 'MAXXER+',  color: 0x55ffff, hoist: true,  mentionable: false },
    { name: 'MAXXER++', color: 0xffaa00, hoist: true,  mentionable: false },
];

// Channel categories + their members. `forum: true` makes a forum channel
// (one post per topic, threaded discussion). Otherwise it's a text channel.
const STRUCTURE = [
    {
        category: '— maxxtopia —',
        channels: [
            { name: 'announcements',     type: 'announcement', topic: 'Read-only — version bumps and patch notes from across the suite.' },
            { name: 'welcome',           type: 'text',         topic: 'Rules, the tier ladder, and the product index. Start here.' },
            { name: 'general',           type: 'text',         topic: 'The hangout. Talk about anything — products, gaming, life.' },
        ],
    },
    {
        category: '— products —',
        channels: [
            { name: 'showcase',          type: 'forum',        topic: 'One post per product. The OP is the product card; replies are the discussion.' },
            { name: 'bugs',              type: 'forum',        topic: 'One thread per bug. Tag the product in the title, e.g. "[clipmaxxer] export hangs at 90%".' },
            { name: 'feedback',          type: 'forum',        topic: 'Feature requests + ideas. Tag the product in the title.' },
        ],
    },
];

// Forum-post OPs. Posted into #showcase as one thread per product.
const SHOWCASE_POSTS = [
    {
        title: 'Optimizationmaxxing',
        body: [
            '**Optimizationmaxxing** — Eighty-seven tweaks. Zero placebos.',
            '',
            'The only Windows tuner that shows its work. Every tweak cited to a Microsoft Learn doc or vendor whitepaper. One UAC prompt applies a preset; full undo any time.',
            '',
            '— Esports / BR / Streamer / Tournament FPS / 5 more presets',
            '— 87 sourced tweaks, 3.6 MB native binary',
            '— Snapshot-backed revert, any tweak, any time',
            '',
            '⬇ Download:        https://maxxtopia.com/optimizationmaxxing',
            '📝 Release notes:  https://github.com/MaxxTopia/optimizationmaxxing/releases/latest',
        ].join('\n'),
    },
    {
        title: 'Discordmaxxer',
        body: [
            '**Discordmaxxer** — Discord, optimized.',
            '',
            'A Vesktop fork with sensible defaults across 56 plugins, 5 themes, and 10 custom plugins (TournamentMode, CompactView, MassDelete, the works). −753 MB RAM and −4.79% CPU vs stock Discord at idle.',
            '',
            '— Tournament Mode kills animations + caps fps at one keystroke',
            '— Free Nitro for emojis/stickers/streams (FakeNitro plugin)',
            '— 5 themes (Maxxer / Val / Sonic / DMC / BO3) with theme-aware UI sounds',
            '',
            '⬇ Download:        https://maxxtopia.com/discordmaxxer',
            '📝 Release notes:  https://github.com/MaxxTopia/discordmaxxer/releases/latest',
        ].join('\n'),
    },
    {
        title: 'Clipmaxxer',
        body: [
            '**Clipmaxxer** — picks the clip that\'ll win on TikTok today.',
            '',
            'Watches your VOD, scores moments via a 5-stage matchmaker pipeline, and ships shippable clips for the platforms you target. Per-niche viral playbook injection for every detected genre.',
            '',
            '⬇ Status:         beta',
            '📝 Site:           https://maxxtopia.com/clipmaxxer',
        ].join('\n'),
    },
    {
        title: 'Dropmaxxer',
        body: [
            '**Dropmaxxer** — better Fortnite drop spots.',
            '',
            'Source-backed BR drop physics + landingtutorial.com integration. The hybrid LT-first calibration uses real pro answers via IDW corpus lookup with a simulator fallback.',
            '',
            '⬇ Status:         beta',
            '📝 Site:           https://maxxtopia.com/dropmaxxer',
        ].join('\n'),
    },
    {
        title: 'Aimmaxxer',
        body: [
            '**Aimmaxxer** — the open rival to Revera.',
            '',
            '2-PC AI aim assist. Outline-detection model, 3D-rotation control loop, sensitivity-aware count_scale calibration. Direct competitor to Revera — open and self-hostable.',
            '',
            '⬇ Status:         soon',
            '📝 Site:           https://maxxtopia.com/aimmaxxer',
        ].join('\n'),
    },
    {
        title: 'Viewmaxxing',
        body: [
            '**Viewmaxxing** — view + chat infrastructure for streamers.',
            '',
            'Ratio + IPCluster sentinels, JobRunner orchestration, ViewerSession lifecycle — built for moving the needle on live counters without being detectable.',
            '',
            '⬇ Status:         soon',
            '📝 Site:           https://maxxtopia.com/viewmaxxing',
        ].join('\n'),
    },
    {
        title: 'Extensionmaxxing',
        body: [
            '**Extensionmaxxing** — coming.',
            '',
            'Various extensions. Direction in flux — slot reserved while we figure out where this lands.',
            '',
            '⬇ Status:         soon',
            '📝 Site:           https://maxxtopia.com/extensionmaxxing',
        ].join('\n'),
    },
];

// Welcome message to post in #welcome.
const WELCOME_MESSAGE = [
    '**Welcome to Maxxtopia.**',
    '',
    'This is the community hub for the maxxer suite — `optimizationmaxxing`, `discordmaxxer`, `clipmaxxer`, `dropmaxxer`, `aimmaxxer`, `viewmaxxing`, and `extensionmaxxing`. Tools built for players who count their frame times.',
    '',
    '**Where to go:**',
    '— **#showcase** — one post per product. Browse, react, discuss in the thread.',
    '— **#bugs** — one thread per bug. Title format: `[product] short summary`.',
    '— **#feedback** — feature requests, with the same title format.',
    '— **#general** — chat about anything.',
    '',
    '**Tier ladder (Hypixel-style):**',
    '— **MAXXER** — supporter badge, theme sound packs, custom cursor skins.',
    '— **MAXXER+** — video backgrounds, custom theme upload, priority support.',
    '— **MAXXER++** — everything, beta features, founders\' channel access.',
    '',
    'See https://maxxtopia.com/discordmaxxer to grab the desktop client and unlock the in-app tier system.',
].join('\n');

// ─── Helpers ──────────────────────────────────────────────────────────────
function plan(action, ...rest) {
    const tag = DRY ? '[would]' : '[do]';
    console.log(tag, action, ...rest);
}

// ─── Main ─────────────────────────────────────────────────────────────────
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.once('clientReady', async () => {
    console.log(`[setup] Logged in as ${client.user.tag} (${client.user.id})`);

    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) {
        console.error(`[setup] Bot is not in guild ${GUILD_ID}. Invite it first via the OAuth2 URL.`);
        process.exit(1);
    }

    console.log(`[setup] Target guild: ${guild.name} (${guild.id}) — ${guild.memberCount} members\n`);

    // 1. Server rename
    if (guild.name !== SERVER_NAME) {
        plan(`rename guild "${guild.name}" -> "${SERVER_NAME}"`);
        if (!DRY) await guild.setName(SERVER_NAME);
    } else {
        console.log(`[skip] guild already named "${SERVER_NAME}"`);
    }

    // 2. Icon
    plan(`set guild icon from ${ICON_PATH}`);
    if (!DRY) {
        try {
            await guild.setIcon(ICON_PATH);
        } catch (e) {
            console.warn(`[warn] icon upload failed: ${e.message}`);
        }
    }

    // 3. Roles
    for (const r of ROLES) {
        const existing = guild.roles.cache.find((x) => x.name === r.name);
        if (existing) {
            console.log(`[skip] role "${r.name}" already exists (id ${existing.id})`);
            continue;
        }
        plan(`create role "${r.name}" color #${r.color.toString(16).padStart(6, '0')}`);
        if (!DRY) await guild.roles.create({ name: r.name, color: r.color, hoist: r.hoist, mentionable: r.mentionable });
    }

    // 4. Channels
    const createdChannels = {};
    for (const cat of STRUCTURE) {
        // Find or create the category
        let categoryChannel = guild.channels.cache.find((c) => c.type === ChannelType.GuildCategory && c.name === cat.category);
        if (!categoryChannel) {
            plan(`create category "${cat.category}"`);
            if (!DRY) categoryChannel = await guild.channels.create({ name: cat.category, type: ChannelType.GuildCategory });
        } else {
            console.log(`[skip] category "${cat.category}" exists (id ${categoryChannel.id})`);
        }

        for (const ch of cat.channels) {
            const existing = guild.channels.cache.find(
                (c) => c.name === ch.name && c.parent?.id === categoryChannel?.id
            );
            if (existing) {
                console.log(`[skip] channel #${ch.name} already exists in category`);
                createdChannels[ch.name] = existing;
                continue;
            }
            const typeMap = {
                text:         ChannelType.GuildText,
                announcement: ChannelType.GuildAnnouncement,
                forum:        ChannelType.GuildForum,
            };
            plan(`create channel #${ch.name} (${ch.type}) in "${cat.category}"`);
            if (!DRY && categoryChannel) {
                const newCh = await guild.channels.create({
                    name: ch.name,
                    type: typeMap[ch.type] ?? ChannelType.GuildText,
                    parent: categoryChannel.id,
                    topic: ch.topic,
                    permissionOverwrites: [
                        { id: guild.roles.everyone.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                    ],
                });
                createdChannels[ch.name] = newCh;
            }
        }
    }

    // 5. Welcome message in #welcome
    const welcomeCh = createdChannels.welcome;
    if (welcomeCh && welcomeCh.type === ChannelType.GuildText) {
        plan(`post welcome message in #welcome`);
        if (!DRY) {
            try { await welcomeCh.send({ content: WELCOME_MESSAGE }); } catch (e) { console.warn(`[warn] welcome post: ${e.message}`); }
        }
    }

    // 6. Forum-OPs in #showcase
    const showcaseCh = createdChannels.showcase;
    if (showcaseCh && showcaseCh.type === ChannelType.GuildForum) {
        for (const post of SHOWCASE_POSTS) {
            plan(`create showcase thread "${post.title}"`);
            if (!DRY) {
                try {
                    await showcaseCh.threads.create({
                        name: post.title,
                        message: { content: post.body },
                    });
                } catch (e) {
                    console.warn(`[warn] showcase post "${post.title}": ${e.message}`);
                }
            }
        }
    }

    // 7. Permanent invite from #welcome
    if (welcomeCh && welcomeCh.type === ChannelType.GuildText) {
        plan(`generate permanent invite from #welcome`);
        if (!DRY) {
            try {
                const invite = await welcomeCh.createInvite({ maxAge: 0, maxUses: 0, unique: false, reason: 'Maxxtopia public hub invite' });
                console.log(`\n[setup] Permanent invite: ${invite.url}\n`);
                console.log('[setup] Add this to maxxtopia.com somewhere prominent.');
            } catch (e) {
                console.warn(`[warn] invite: ${e.message}`);
            }
        }
    }

    console.log('\n[setup] Done.');
    if (DRY) console.log('[setup] Re-run with --execute to apply.');
    else console.log('[setup] Now revoke the bot token in the Discord dev portal -> Bot tab -> Reset Token.');

    await client.destroy();
    process.exit(0);
});

client.on('error', (e) => console.error('[client error]', e));

await client.login(TOKEN);
