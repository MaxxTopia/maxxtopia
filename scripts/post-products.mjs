/*
 * Build/refresh a read-only #products channel with one branded embed per
 * product (accent color, logo thumbnail, tagline, description, link buttons).
 * Replaces the empty #showcase forum. Idempotent: reuses the channel, edits
 * matching bot messages in place, removes only obsolete bot messages, and
 * posts only genuinely new entries. No @mentions => no pings.
 *
 * Usage: node scripts/post-products.mjs --execute   (default = dry-run)
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const EXEC = process.argv.includes('--execute');
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
let TOKEN, GUILD_ID;
for (const line of readFileSync(join(ROOT, '.bot-setup.local.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)\s*=\s*(.+?)\s*$/);
    if (!m) continue;
    if (m[1] === 'DISCORD_BOT_TOKEN') TOKEN = m[2].replace(/^['"]|['"]$/g, '').trim();
    if (m[1] === 'DISCORD_GUILD_ID') GUILD_ID = (m[2].match(/\d+/) || [])[0];
}
const API = 'https://discord.com/api/v10';
const auth = { Authorization: `Bot ${TOKEN}`, 'User-Agent': 'MaxxtopiaProducts/1.0' };
const PRODUCTS_CAT = '1502867385416290444';
const SHOWCASE_ID = '1502867386230112337';
const EVERYONE = GUILD_ID;
const site = s => `https://maxxtopia.com/${s}`;
const LOGO_DIR = join(__dirname, '_logo-png');
const PRODUCT_VISUAL_DIR = join(__dirname, '_announcement-assets');
const visualInfo = slug => slug === 'optimizationmaxxing'
    ? { path: join(PRODUCT_VISUAL_DIR, 'playlistmaxxing-disc.gif'), name: 'optimizationmaxxing-disc.gif', type: 'image/gif' }
    : undefined;
const logoInfo = slug => slug === 'playlistmaxxing'
        ? { path: join(ROOT, 'public', 'logos', 'playlistmaxxing.webp'), name: 'playlistmaxxing.webp', type: 'image/webp' }
    : slug === 'maxxtopia'
        ? { path: join(LOGO_DIR, 'maxxtopia.png'), name: 'maxxtopia.png', type: 'image/png' }
    : slug === 'montagemaxxer'
            ? { path: join(LOGO_DIR, 'montagemaxxer.png'), name: 'montagemaxxer.png', type: 'image/png' }
        : { path: join(LOGO_DIR, `${slug}.png`), name: `${slug === 'extensionmaxxing' ? 'adblockmaxxer' : slug}.png`, type: 'image/png' };
const CHANNEL_TOPIC = 'The Maxxtopia suite — current Live and Beta tools, with direct links. Read-only.';

const api = async (path, method = 'GET', body) => {
    const r = await fetch(`${API}${path}`, { method, headers: { ...auth, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    if (!r.ok) throw new Error(`${method} ${path} -> ${r.status} ${await r.text()}`);
    return r.status === 204 ? {} : r.json();
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

// read-only deny mask (BigInt): SEND_MESSAGES, ADD_REACTIONS, threads
const DENY = ((1n << 11n) | (1n << 6n) | (1n << 35n) | (1n << 36n) | (1n << 38n)).toString();
const VIEW = (1n << 10n).toString();

const STATUS = {
    live: { dot: '\u{1F7E2}', label: 'Live' },
    beta: { dot: '\u{1F535}', label: 'Beta' },
    soon: { dot: '\u{1F7E1}', label: 'Coming soon' },
};

// Public directory data mirrors the current site. Aimmaxxer is intentionally
// included as Coming soon after Diggy opted it into the directory; Viewmaxxing
// remains out until Diggy opts it in.
const products = [
    { slug: 'optimizationmaxxing', name: 'Optimizationmaxxing', cat: 'PC Tuning', status: 'live', version: 'v0.4.2', accent: 0xe25bff,
      tagline: 'One hundred tweaks. Zero placebos.',
      desc: 'A free Windows PC tuner with guided presets, plain-English explanations, before-and-after measurements, and a safe way back when a tweak is not right for your rig.',
      hero: '100 audited tweaks · 6 presets · 3.6 MB',
      buttons: [['Download for Windows', 'https://github.com/MaxxTopia/optimizationmaxxing/releases/download/v0.4.2/optimizationmaxxing_0.4.2_x64-setup.exe']] },
    { slug: 'discordmaxxer', name: 'Discordmaxxer', cat: 'Communication', status: 'live', version: 'v0.7.62', accent: 0x5865F2,
      tagline: 'Discord. Minus 753 MB.',
      desc: 'Stock Discord uses 1,041 MB on this machine. Ours uses 288. Same servers, same friends, same pings — minus the background work that makes stock Discord so heavy.',
      hero: '−753 MB vs stock · 0% idle CPU',
      buttons: [['Download for Windows', 'https://github.com/MaxxTopia/discordmaxxer/releases/download/v0.7.62/Discordmaxxer-Setup-0.7.62.exe']] },
    { slug: 'clipmaxxer', name: 'Clipmaxxer', cat: 'Content', status: 'beta', accent: 0x00d4ff,
      tagline: 'You stream. We cut your shorts.',
      desc: 'Done-for-you clip editing for streamers. We find the exact opponent, weapon and moment, reframe it to vertical, caption it, and leave the publish button with you.',
      hero: 'Fortnite + Valorant · beta',
      buttons: [['Apply for the beta', 'https://maxxtopia.com/clipmaxxer/apply']] },
    { slug: 'dropmaxxer', name: 'Dropmaxxer', cat: 'Fortnite', status: 'beta', accent: 0x4c51f7,
      tagline: 'Stop guessing your drop.',
      desc: 'Two routes for every POI: cut-and-free-fall fast, or glide in safe. Community data first, calibrated physics when the path is new.',
      hero: '2 routes per drop · fastest + safe',
      buttons: [['Launch Dropmaxxer', 'https://dropmaxxer.pages.dev']] },
    { slug: 'extensionmaxxing', name: 'AdBlock-Maxxer', cat: 'Browser Extension', status: 'live', version: 'v1.6.13', accent: 0x5b9fd8,
      tagline: 'Way more than an ad blocker.',
      desc: 'Kills ads on YouTube, Spotify and Twitch, then adds performance mode, SponsorBlock, Twitch full HD, fullscreen chat, and a built-in game.',
      hero: '21,370 rules · 4 browsers · free',
      buttons: [['Download extension', 'https://dl.maxxtopia.com/adblockmaxxer-chrome-v1.6.13.zip'], ['Phone filter list', 'https://dl.maxxtopia.com/adblockmaxxer-mobile.txt']] },
    { slug: 'streammaxxing', name: 'Streammaxxing', cat: 'Stream Alerts', status: 'live', version: 'v0.1.58', accent: 0x22d3a0,
      tagline: 'Everything you stream with, in one free app.',
      desc: 'Everything you need to stream, in one free app. Instant alerts, overlays, all your chat in one place, and donations read out loud — set up with OBS in one click.',
      hero: 'Local alerts · OBS overlays · merged chat',
      buttons: [['Download for Windows', 'https://dl.maxxtopia.com/streammaxxing/streammaxxing-latest-x64-setup.exe']] },
    { slug: 'snipemaxxer', name: 'Snipemaxxer', cat: 'Fortnite + Valorant', status: 'beta', version: 'v0.3.0', accent: 0xff3f69,
      tagline: 'Read the lobby. Review the round.',
      desc: 'A focused Windows app: Fortnite gets the tournament desk, replay scouting and Strategy Lab; Valorant gets read-only Riot context, reports, teammate intel and alerts.',
      hero: '2 games · one local command desk',
      buttons: [['Download for Windows', 'https://dl.maxxtopia.com/snipemaxxer/Snipemaxxer-Setup-0.3.0.exe']] },
    { slug: 'playlistmaxxing', name: 'Playlistmaxxing', cat: 'Music', status: 'live', version: 'v0.1.4', accent: 0xff2e88,
      tagline: 'Every platform. One playlist.',
      desc: 'Spotify, SoundCloud and YouTube on one page. Paste a track or playlist, play it in place, and keep the library on your device — no account and nothing to install.',
      hero: 'Spotify · SoundCloud · YouTube · free',
      buttons: [['Open Playlistmaxxing', 'https://music.maxxtopia.com']] },
    { slug: 'aimmaxxer', name: 'Aimmaxxer', cat: 'Training', status: 'soon', accent: 0xf3af19,
      tagline: 'Warm up right. Per game.',
      desc: 'A focused aim trainer is in the works: four independent metrics, game-specific warmups, and routines shaped around your own DPI and play style.',
      hero: '6 games · a warmup for each',
      buttons: [['See the roadmap', 'https://maxxtopia.com/aimmaxxer']] },
    { slug: 'montagemaxxer', name: 'MontageMaxxer', cat: 'Video Editing', status: 'soon', accent: 0x27d9c3,
      tagline: 'Your montage. Your timing.',
      desc: 'A local-first editor for Fortnite and Valorant: tune titles, songs, clip volume, pacing, and the final render on the machine that has your footage.',
      hero: 'Local editor · Fortnite + Valorant',
      buttons: [['Open preview', 'https://maxxtopia.com/montagemaxxer/'], ['Open editor', 'https://montage.maxxtopia.com/']] },
];

console.log(`Plan: read-only #products in category, ${products.length} product embeds, hide #showcase.`);
products.forEach(p => console.log(`  - ${STATUS[p.status].label.padEnd(11)} ${p.name}  (${p.buttons.length} btn + Learn more)`));
if (!EXEC) { console.log('\n*** DRY RUN -- pass --execute ***'); process.exit(0); }

const BOT_ID = '1502451778426372116';
const SILENT = 1 << 12; // SUPPRESS_NOTIFICATIONS — posting never pings members

// 1. find or create #products
const channels = await api(`/guilds/${GUILD_ID}/channels`);
let ch = channels.find(c => c.type === 0 && c.name === 'products' && c.parent_id === PRODUCTS_CAT);
let created = false;
if (!ch) {
    ch = await api(`/guilds/${GUILD_ID}/channels`, 'POST', {
        name: 'products', type: 0, parent_id: PRODUCTS_CAT, position: 0,
        topic: CHANNEL_TOPIC,
        permission_overwrites: [{ id: EVERYONE, type: 0, deny: DENY, allow: VIEW }],
    });
    created = true;
    console.log(`created #products (${ch.id})`);
} else {
    await api(`/channels/${ch.id}/permissions/${EVERYONE}`, 'PUT', { type: 0, deny: DENY, allow: VIEW });
    if (ch.topic !== CHANNEL_TOPIC) await api(`/channels/${ch.id}`, 'PATCH', { topic: CHANNEL_TOPIC });
}

// Build the ordered message set: header + one per product.
const items = [{
    embeds: [{
        title: 'Maxxtopia — the suite',
        description: 'Free, local-first tools for gamers, streamers and PC tinkerers — every one built in-house. Full details and downloads for each are below.\n\n\u{1F7E2} **Live** · \u{1F535} **Beta** · \u{1F7E1} **Coming soon**',
        color: 0xe25bff,
        thumbnail: { url: 'attachment://maxxtopia.png' },
        footer: { text: 'maxxtopia.com' },
    }],
    components: [],
    logo: logoInfo('maxxtopia'),
}];
for (const p of products) {
    const s = STATUS[p.status];
    const statusLine = `${s.dot} **${s.label}**${p.version ? `  ·  ${p.version}` : ''}  ·  ${p.cat}`;
    const row = { type: 1, components: [] };
    for (const [label, url] of p.buttons) row.components.push({ type: 2, style: 5, label, url });
    row.components.push({ type: 2, style: 5, label: 'Learn more', url: site(p.slug) });
    items.push({
        embeds: [{
            title: p.name, url: site(p.slug),
            description: `${statusLine}\n\n**${p.tagline}**\n${p.desc}`,
            color: p.accent,
            thumbnail: { url: `attachment://${logoInfo(p.slug).name}` },
            ...(visualInfo(p.slug) ? { image: { url: `attachment://${visualInfo(p.slug).name}` } } : {}),
            footer: { text: p.hero },
        }],
        components: [row],
        logo: logoInfo(p.slug),
        visual: visualInfo(p.slug),
    });
}

const formRequest = async (path, method, it, flags = undefined) => {
    for (let attempt = 0; attempt < 4; attempt += 1) {
        const form = new FormData();
        form.append('payload_json', JSON.stringify({
            embeds: it.embeds,
            components: it.components,
            attachments: [
                { id: 0, filename: it.logo.name },
                ...(it.visual ? [{ id: 1, filename: it.visual.name }] : []),
            ],
            ...(flags === undefined ? {} : { flags }),
            allowed_mentions: { parse: [], users: [], roles: [], replied_user: false },
        }));
        form.append('files[0]', new Blob([readFileSync(it.logo.path)], { type: it.logo.type }), it.logo.name);
        if (it.visual) form.append('files[1]', new Blob([readFileSync(it.visual.path)], { type: it.visual.type }), it.visual.name);
        const r = await fetch(`${API}${path}`, { method, headers: auth, body: form });
        if (r.ok) return r.status === 204 ? {} : r.json();
        const text = await r.text();
        if (r.status === 429) {
            let retryMs = 1000;
            try { retryMs = Math.ceil(Number(JSON.parse(text).retry_after || 1) * 1000) + 100; } catch { /* bounded fallback */ }
            await sleep(retryMs);
            continue;
        }
        throw new Error(`${method} ${path} -> ${r.status} ${text}`);
    }
    throw new Error(`${method} ${path} -> rate limited after retries`);
};

const postFresh = async it => formRequest(`/channels/${ch.id}/messages`, 'POST', it, SILENT);

const patchExisting = async (messageId, it) => {
    return formRequest(`/channels/${ch.id}/messages/${messageId}`, 'PATCH', it, SILENT);
};

// Existing bot messages, oldest-first.
const existing = created ? []
    : (await api(`/channels/${ch.id}/messages?limit=100`)).reverse().filter(m => m.author?.id === BOT_ID);

// Reconcile by title so reordering and removing a product never triggers a
// noisy delete-and-repost of the entire directory. Edits do not notify.
const existingByTitle = new Map(existing.map(message => [message.embeds?.[0]?.title, message]));
const keptIds = new Set();
const removedIds = new Set();
for (const item of items) {
    const title = item.embeds[0].title;
    const prior = existingByTitle.get(title);
    if (prior) {
        await patchExisting(prior.id, item);
        keptIds.add(prior.id);
        console.log(`edited in place (silent): ${title}`);
    } else {
        await postFresh(item);
        console.log(`posted (silent): ${title}`);
    }
    await sleep(450);
}
for (const obsolete of existing.filter(message => !keptIds.has(message.id) && !removedIds.has(message.id))) {
    await api(`/channels/${ch.id}/messages/${obsolete.id}`, 'DELETE');
    console.log(`removed obsolete bot entry (silent): ${obsolete.embeds?.[0]?.title || obsolete.id}`);
    await sleep(450);
}

// hide the empty showcase forum it replaces
await api(`/channels/${SHOWCASE_ID}/permissions/${EVERYONE}`, 'PUT', { type: 0, deny: VIEW, allow: '0' });

console.log(`\n=== DONE -> #products (${ch.id}) ===`);
