/*
 * Mirror the public Maxxtopia Updates feed into a read-only Discord channel.
 *
 * Dry run:
 *   node scripts/sync-updates-discord.mjs --source=dist --limit=10
 *
 * Live, using the local gitignored bot env file:
 *   node scripts/sync-updates-discord.mjs --execute --limit=25
 *
 * CI uses DISCORD_BOT_TOKEN and DISCORD_GUILD_ID environment variables and
 * reads https://maxxtopia.com/updates.json after the Pages deploy completes.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const API = 'https://discord.com/api/v10';
const FEED_URL = 'https://maxxtopia.com/updates.json';
const EXECUTE = process.argv.includes('--execute');
const SILENT = 1 << 12; // Discord SUPPRESS_NOTIFICATIONS
const CATEGORY_NAME = '\u2014 maxxtopia \u2014';
const CHANNEL_NAME = 'updates';
const CHANNEL_TOPIC = 'Read-only — everything we\'ve shipped, newest first. Mirrored from maxxtopia.com/updates.';

// Discord permission bits. @everyone can read history but cannot write,
// react, or create threads. The bot gets only the bits it needs to publish.
const VIEW_CHANNEL = 1n << 10n;
const SEND_MESSAGES = 1n << 11n;
const ADD_REACTIONS = 1n << 6n;
const EMBED_LINKS = 1n << 14n;
const ATTACH_FILES = 1n << 15n;
const READ_MESSAGE_HISTORY = 1n << 16n;
const CREATE_PUBLIC_THREADS = 1n << 35n;
const CREATE_PRIVATE_THREADS = 1n << 36n;
const SEND_MESSAGES_IN_THREADS = 1n << 38n;
const EVERYONE_ALLOW = (VIEW_CHANNEL | READ_MESSAGE_HISTORY).toString();
const EVERYONE_DENY = (
  SEND_MESSAGES |
  ADD_REACTIONS |
  CREATE_PUBLIC_THREADS |
  CREATE_PRIVATE_THREADS |
  SEND_MESSAGES_IN_THREADS
).toString();
const BOT_ALLOW = (
  VIEW_CHANNEL |
  SEND_MESSAGES |
  EMBED_LINKS |
  ATTACH_FILES |
  READ_MESSAGE_HISTORY
).toString();

function arg(name, fallback = undefined) {
  const eq = process.argv.find((value) => value.startsWith(`${name}=`));
  if (eq) return eq.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const source = arg('--source', 'live');
const parsedLimit = Number(arg('--limit', '100'));
const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.floor(parsedLimit) : 100;

function readLocalEnv() {
  const result = {};
  const envPath = join(ROOT, '.bot-setup.local.env');
  if (!existsSync(envPath)) return result;
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z_]+)\s*=\s*(.+?)\s*$/);
    if (!match) continue;
    result[match[1]] = match[2].replace(/^['"]|['"]$/g, '').trim();
  }
  return result;
}

const localEnv = readLocalEnv();
const TOKEN = (process.env.DISCORD_BOT_TOKEN || localEnv.DISCORD_BOT_TOKEN || '').trim();
const GUILD_ID = (process.env.DISCORD_GUILD_ID || localEnv.DISCORD_GUILD_ID || '').match(/\d+/)?.[0] || '';
const auth = { Authorization: `Bot ${TOKEN}`, 'User-Agent': 'MaxxtopiaUpdates/1.0' };

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

async function api(path, method = 'GET', body) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const headers = { ...auth };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const response = await fetch(`${API}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.status === 429) {
      let retryMs = 1000;
      try {
        const payload = await response.json();
        retryMs = Math.ceil(Number(payload.retry_after || 1) * 1000) + 100;
      } catch {
        // Keep the bounded fallback delay when Discord does not return JSON.
      }
      await sleep(retryMs);
      continue;
    }
    if (!response.ok) throw new Error(`${method} ${path} -> ${response.status} ${await response.text()}`);
    if (response.status === 204) return null;
    return response.json();
  }
  throw new Error(`${method} ${path} -> rate limited after retries`);
}

async function loadFeed() {
  let payload;
  if (source === 'dist') {
    payload = JSON.parse(readFileSync(join(ROOT, 'dist', 'updates.json'), 'utf8'));
  } else if (source.startsWith('file=')) {
    payload = JSON.parse(readFileSync(resolve(ROOT, source.slice(5)), 'utf8'));
  } else {
    const response = await fetch(FEED_URL, { headers: { 'User-Agent': 'MaxxtopiaUpdatesSync/1.0' } });
    if (!response.ok) throw new Error(`GET ${FEED_URL} -> ${response.status} ${await response.text()}`);
    payload = await response.json();
  }
  if (!payload || !Array.isArray(payload.updates)) throw new Error('Updates feed has no updates array');
  return payload.updates.slice(0, limit);
}

function hexColor(value) {
  const match = String(value || '').match(/^#?([0-9a-f]{6})$/i);
  return match ? Number.parseInt(match[1], 16) : 0xe25bff;
}

const OG_SLUGS = new Set([
  'adblockmaxxer',
  'aimmaxxer',
  'clipmaxxer',
  'discordmaxxer',
  'dropmaxxer',
  'optimizationmaxxing',
  'playlistmaxxing',
  'snipemaxxer',
  'streammaxxing',
  'viewmaxxing',
]);

const MAXXTOPIA_OG_URL = 'https://maxxtopia.com/maxxtopia-clavicular-512.png';
const PRODUCT_LOGO_URLS = {
  adblockmaxxer: 'https://maxxtopia.com/logos/adblockmaxxer.png',
  discordmaxxer: 'https://maxxtopia.com/logos/dm-mark-killshot.png',
};
const PLAYLIST_VISUAL_DIR = join(ROOT, 'scripts', '_announcement-assets');
const PLAYLIST_SCREENSHOT_PATH = join(PLAYLIST_VISUAL_DIR, 'playlistmaxxing-v0.1.4-player.png');
const PLAYLIST_DISC_PATH = join(PLAYLIST_VISUAL_DIR, 'playlistmaxxing-disc.gif');
const DISCORD_SCREENSHOT_PATH = join(PLAYLIST_VISUAL_DIR, 'discordmaxxer-v0.7.62-hub.png');
const OPTIMIZATION_LIGHTNING_PATH = join(PLAYLIST_VISUAL_DIR, 'optimizationmaxxing-lightning.png');

function productOgUrl(entry) {
  const slug = entry.productSlug === 'extensionmaxxing' ? 'adblockmaxxer' : entry.productSlug;
  if (slug && PRODUCT_LOGO_URLS[slug]) return PRODUCT_LOGO_URLS[slug];
  return slug && OG_SLUGS.has(slug) ? `https://maxxtopia.com/og/${slug}.png` : undefined;
}

function hasPlaylistVisual(entry) {
  return entry.productSlug === 'playlistmaxxing'
    && entry.version === 'v0.1.4'
    && existsSync(PLAYLIST_SCREENSHOT_PATH)
    && existsSync(PLAYLIST_DISC_PATH);
}

function hasDiscordVisual(entry) {
  return entry.productSlug === 'discordmaxxer'
    && entry.version === 'v0.7.62'
    && existsSync(DISCORD_SCREENSHOT_PATH);
}

function hasOptimizationVisual(entry) {
  return entry.productSlug === 'optimizationmaxxing'
    && existsSync(OPTIMIZATION_LIGHTNING_PATH);
}

function localVisualFiles(entry) {
  if (hasPlaylistVisual(entry)) {
    return [
      { path: PLAYLIST_DISC_PATH, filename: 'playlistmaxxing-disc.gif', type: 'image/gif' },
      { path: PLAYLIST_SCREENSHOT_PATH, filename: 'playlistmaxxing-v0.1.4-player.png', type: 'image/png' },
    ];
  }
  if (hasDiscordVisual(entry)) {
    return [{ path: DISCORD_SCREENSHOT_PATH, filename: 'discordmaxxer-v0.7.62-hub.png', type: 'image/png' }];
  }
  if (hasOptimizationVisual(entry)) {
    return [{ path: OPTIMIZATION_LIGHTNING_PATH, filename: 'optimizationmaxxing-lightning.png', type: 'image/png' }];
  }
  return [];
}

function updateEmbed(entry, latest = false, useLocalVisual = false) {
  const descriptionParts = [];
  const versionChip = entry.version ? `\`${entry.version}\`` : '`UPDATE`';
  descriptionParts.push(`${latest ? '✨ **LATEST**  ·  ' : ''}${versionChip}`);
  if (entry.body) descriptionParts.push(entry.body);
  if (Array.isArray(entry.items) && entry.items.length) {
    descriptionParts.push(entry.items.map((item) => `- ${item}`).join('\n'));
  }
  const productLine = [entry.product, entry.version].filter(Boolean).join(' - ');
  const productUrl = entry.productSlug
    ? `https://maxxtopia.com/${entry.productSlug}`
    : entry.url;
  // Keep every Discord card visually anchored. Product entries use their
  // current product art; the suite-level entry falls back to the Maxxtopia M.
  const playlistVisual = useLocalVisual && hasPlaylistVisual(entry);
  const discordVisual = useLocalVisual && hasDiscordVisual(entry);
  const optimizationVisual = useLocalVisual && hasOptimizationVisual(entry);
  const thumbnailUrl = playlistVisual
    ? 'attachment://playlistmaxxing-disc.gif'
    : optimizationVisual
      ? 'attachment://optimizationmaxxing-lightning.png'
      : productOgUrl(entry) || MAXXTOPIA_OG_URL;
  return {
    author: { name: `${latest ? '✨ LATEST  ·  ' : ''}${productLine}`, url: productUrl },
    title: String(entry.title || 'Maxxtopia update').slice(0, 256),
    url: entry.url,
    description: descriptionParts.join('\n\n').slice(0, 4096),
    color: hexColor(entry.accentHex),
    ...(thumbnailUrl ? { thumbnail: { url: thumbnailUrl } } : {}),
    ...(playlistVisual ? { image: { url: 'attachment://playlistmaxxing-v0.1.4-player.png' } } : {}),
    ...(discordVisual ? { image: { url: 'attachment://discordmaxxer-v0.7.62-hub.png' } } : {}),
    footer: { text: [entry.version, entry.date, 'Maxxtopia Updates'].filter(Boolean).join(' · ') },
    timestamp: `${entry.date}T12:00:00.000Z`,
  };
}

function messagePayload(entry, latest = false) {
  const files = localVisualFiles(entry);
  const useLocalVisual = files.length > 0;
  const payload = {
    embeds: [updateEmbed(entry, latest, useLocalVisual)],
    allowed_mentions: { parse: [], users: [], roles: [], replied_user: false },
  };
  if (files.length) {
    payload.attachments = files.map((file, index) => ({ id: String(index), filename: file.filename }));
  }
  return { payload, files };
}

async function multipartApi(path, method, payload, files) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const form = new FormData();
    form.append('payload_json', JSON.stringify(payload));
    files.forEach((file, index) => {
      const bytes = readFileSync(file.path);
      form.append(`files[${index}]`, new Blob([bytes], { type: file.type }), file.filename);
    });
    const response = await fetch(`${API}${path}`, { method, headers: auth, body: form });
    if (response.ok) {
      if (response.status === 204) return null;
      return response.json();
    }
    const text = await response.text();
    if (response.status === 429) {
      let retryMs = 1000;
      try {
        retryMs = Math.ceil(Number(JSON.parse(text).retry_after || 1) * 1000) + 100;
      } catch {
        // Keep the bounded fallback delay when Discord does not return JSON.
      }
      await sleep(retryMs);
      continue;
    }
    throw new Error(`${method} ${path} -> ${response.status} ${text}`);
  }
  throw new Error(`${method} ${path} -> rate limited after retries`);
}

// Discord can rate-limit a burst of in-place edits. Retry the bucket response
// rather than treating it as an old-message failure; edits preserve the
// populated channel's order and do not notify members.
async function tryPatchMessage(channelId, messageId, payload) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${API}/channels/${channelId}/messages/${messageId}`, {
      method: 'PATCH',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (response.ok) return true;
    const text = await response.text();
    if (response.status === 429) {
      let retryMs = 1000;
      try {
        retryMs = Math.ceil(Number(JSON.parse(text).retry_after || 1) * 1000) + 100;
      } catch {
        // Keep the bounded fallback delay when Discord does not return JSON.
      }
      await sleep(retryMs);
      continue;
    }
    throw new Error(`PATCH /channels/${channelId}/messages/${messageId} -> ${response.status} ${text}`);
  }
  throw new Error(`PATCH /channels/${channelId}/messages/${messageId} -> rate limited after retries`);
}

async function tryPatchMessageWithFiles(channelId, messageId, payload, files) {
  await multipartApi(`/channels/${channelId}/messages/${messageId}`, 'PATCH', payload, files);
  return true;
}

async function fetchBotMessages(channelId, botId) {
  const messages = [];
  let before = '';
  for (let page = 0; page < 10; page += 1) {
    const query = new URLSearchParams({ limit: '100' });
    if (before) query.set('before', before);
    const pageMessages = await api(`/channels/${channelId}/messages?${query}`);
    if (!Array.isArray(pageMessages) || pageMessages.length === 0) break;
    messages.push(...pageMessages.filter((message) => message.author?.id === botId));
    if (pageMessages.length < 100) break;
    before = pageMessages[pageMessages.length - 1].id;
  }
  return messages;
}

async function ensureUpdatesChannel(channels, botId) {
  const category = channels.find((channel) => channel.type === 4 && channel.name === CATEGORY_NAME);
  let channel = channels.find(
    (candidate) => (candidate.type === 0 || candidate.type === 5) && candidate.name === CHANNEL_NAME && candidate.parent_id === category?.id,
  );
  if (!channel) {
    channel = channels.find((candidate) => (candidate.type === 0 || candidate.type === 5) && candidate.name === CHANNEL_NAME);
  }
  if (!EXECUTE) {
    console.log(`[updates] would ensure #${CHANNEL_NAME} under ${CATEGORY_NAME}`);
    console.log(`[updates] read-only permissions; bot ${botId || '(resolved at execute time)'} is the only publisher`);
    return null;
  }
  if (!channel) {
    if (!category) throw new Error(`Missing ${CATEGORY_NAME} category; run the server setup first`);
    channel = await api(`/guilds/${GUILD_ID}/channels`, 'POST', {
      name: CHANNEL_NAME,
      type: 0,
      parent_id: category.id,
      topic: CHANNEL_TOPIC,
      permission_overwrites: [
        { id: GUILD_ID, type: 0, allow: EVERYONE_ALLOW, deny: EVERYONE_DENY },
        { id: botId, type: 1, allow: BOT_ALLOW, deny: '0' },
      ],
    });
    console.log(`[updates] created #${CHANNEL_NAME} (${channel.id})`);
  } else {
    if (channel.topic !== CHANNEL_TOPIC) {
      await api(`/channels/${channel.id}`, 'PATCH', { topic: CHANNEL_TOPIC });
    }
    await api(`/channels/${channel.id}/permissions/${GUILD_ID}`, 'PUT', {
      type: 0,
      allow: EVERYONE_ALLOW,
      deny: EVERYONE_DENY,
    });
    await api(`/channels/${channel.id}/permissions/${botId}`, 'PUT', {
      type: 1,
      allow: BOT_ALLOW,
      deny: '0',
    });
    console.log(`[updates] using existing #${CHANNEL_NAME} (${channel.id})`);
  }
  return channel;
}

const updates = await loadFeed();
console.log(`[updates] source=${source} entries=${updates.length} limit=${limit} execute=${EXECUTE}`);
if (!EXECUTE) {
  updates.slice(0, 5).forEach((entry) => console.log(`  ${entry.date} ${entry.product}${entry.version ? ` ${entry.version}` : ''} - ${entry.title}`));
  console.log('[updates] dry run complete; pass --execute to change Discord');
  process.exit(0);
}
if (!TOKEN || !GUILD_ID) throw new Error('DISCORD_BOT_TOKEN and DISCORD_GUILD_ID are required for --execute');

const bot = await api('/users/@me');
const channels = await api(`/guilds/${GUILD_ID}/channels`);
const channel = await ensureUpdatesChannel(channels, bot.id);
if (!channel) process.exit(0);

const existing = await fetchBotMessages(channel.id, bot.id);
const byUrl = new Map();
for (const message of existing) {
  const url = message.embeds?.[0]?.url;
  if (url) byUrl.set(url, message);
}

// The website is newest-first; post oldest-first so the Discord channel reads
// forward in time and the newest update remains at the bottom.
for (const entry of updates.slice().reverse()) {
  const request = messagePayload(entry, entry === updates[0]);
  const payload = request.payload;
  const prior = byUrl.get(entry.url);
  if (prior) {
    if (request.files.length) {
      await tryPatchMessageWithFiles(channel.id, prior.id, payload, request.files);
    } else {
      await tryPatchMessage(channel.id, prior.id, payload);
    }
    console.log(`[updates] edited silently: ${entry.product} - ${entry.title}`);
  } else {
    const postPayload = { ...payload, flags: SILENT };
    const message = request.files.length
      ? await multipartApi(`/channels/${channel.id}/messages`, 'POST', postPayload, request.files)
      : await api(`/channels/${channel.id}/messages`, 'POST', postPayload);
    byUrl.set(entry.url, message);
    console.log(`[updates] posted silently: ${entry.product} - ${entry.title}`);
  }
  await sleep(450);
}

// The source feed is the canonical set. Remove only old bot messages whose
// source URL no longer exists, which clears duplicate legacy slugs without
// touching anything written by a member.
const desiredUrls = new Set(updates.map((entry) => entry.url));
for (const obsolete of existing.filter((message) => {
  const url = message.embeds?.[0]?.url;
  return message.author?.id === bot.id && !desiredUrls.has(url);
})) {
  await api(`/channels/${channel.id}/messages/${obsolete.id}`, 'DELETE');
  console.log(`[updates] removed obsolete duplicate silently: ${obsolete.embeds?.[0]?.title || obsolete.id}`);
  await sleep(450);
}

console.log(`[updates] complete -> #${CHANNEL_NAME} (${channel.id}); no member notifications or mentions sent`);
