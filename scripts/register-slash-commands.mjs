/*
 * Registers the Maxxtopia bot's slash commands as guild commands. Guild
 * commands are instant — they show up in Discord seconds after registration.
 * Global commands take up to an hour to propagate, so we use guild.
 *
 * Idempotent: PUT replaces the entire guild command list with the array
 * we send. Re-running adds/removes/edits cleanly with no stale commands.
 *
 * Currently registers:
 *   /storm zone phase time damage — private Storm Sickness timing read
 *   /points mode games ...      — private tournament pace read
 *   /gen tier user            — mint a tier-encoded code on demand + DM to user
 *   /om user                  — alias for /gen tier:MAXXER++ (OM lifetime context)
 *   /33 user                  — pull one of the 33 pre-minted FOUND* codes
 *   /founderstatus            — show remaining founder pool size
 *
 * Diggy-only gating is enforced INSIDE the worker (callerId ===
 * DIGGY_USER_ID). Discord-side `default_member_permissions` is set to
 * 0 here so the commands are hidden from non-admins in the picker, but
 * the worker check is the real auth.
 *
 * Usage:
 *   node scripts/register-slash-commands.mjs --dry-run
 *   node scripts/register-slash-commands.mjs --execute
 *
 * Token sourced from .bot-setup.local.env (same pattern as
 * post-ticket-panel.mjs). Application ID is auto-derived from the
 * token's first base64 segment — no manual config needed.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── Env ───────────────────────────────────────────────────────────────────
const envPath = join(ROOT, '.bot-setup.local.env');
let TOKEN, GUILD_ID;
try {
    const raw = readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
        const m = line.match(/^([A-Z_]+)\s*=\s*(.+?)\s*$/);
        if (!m) continue;
        if (m[1] === 'DISCORD_BOT_TOKEN') TOKEN = m[2].replace(/^['"]|['"]$/g, '');
        // Digits-only: tolerate a malformed env line (e.g. another KEY=val glued on without a newline).
        if (m[1] === 'DISCORD_GUILD_ID') GUILD_ID = (m[2].match(/\d+/) || [''])[0];
    }
} catch {
    console.error(`[register] Missing ${envPath}`);
    process.exit(1);
}
if (!TOKEN || !GUILD_ID) {
    console.error('[register] DISCORD_BOT_TOKEN or DISCORD_GUILD_ID missing.');
    process.exit(1);
}

// Discord bot tokens are `<app_id_base64>.<expiry>.<hmac>`. The first
// segment is the application id base64-encoded — we decode it instead
// of asking the user to paste yet another value.
const APP_ID = Buffer.from(TOKEN.split('.')[0], 'base64').toString('utf8');
if (!/^\d+$/.test(APP_ID)) {
    console.error(`[register] Decoded app id "${APP_ID}" doesn't look like a Discord snowflake. Token malformed?`);
    process.exit(1);
}

const DRY = !process.argv.includes('--execute');
if (DRY) console.log('[register] DRY RUN — no changes. Pass --execute to commit.\n');

// ─── Commands ──────────────────────────────────────────────────────────────
// Discord application command option types
const OPT_STRING = 3;
const OPT_INTEGER = 4;
const OPT_USER = 6;
const OPT_NUMBER = 10;

// Administrative commands use default_member_permissions = "0" to hide them
// from non-admins in the slash-command picker. Mods unlock them via role
// overrides, but the worker's mod check (SUPPORT_ROLE_ID) is what actually
// gates execution. Public utility commands intentionally omit this field.
const DEFAULT_MOD_ONLY = '0';

const COMMANDS = [
    {
        name: 'storm',
        description: 'Calculate your Storm Sickness rotate window.',
        dm_permission: true,
        options: [
            {
                type: OPT_INTEGER,
                name: 'zone',
                description: 'Current storm zone number (1-12).',
                required: true,
                min_value: 1,
                max_value: 12,
            },
            {
                type: OPT_STRING,
                name: 'phase',
                description: 'Is this zone waiting or closing?',
                required: true,
                choices: [
                    { name: 'Waiting', value: 'waiting' },
                    { name: 'Closing', value: 'closing' },
                ],
            },
            {
                type: OPT_INTEGER,
                name: 'time',
                description: 'Seconds left in the current phase.',
                required: true,
                min_value: 0,
                max_value: 3600,
            },
            {
                type: OPT_INTEGER,
                name: 'damage',
                description: 'Cumulative storm damage already taken.',
                required: true,
                min_value: 0,
                max_value: 1000000,
            },
            {
                type: OPT_STRING,
                name: 'mode',
                description: 'Choose the timing reference for your playlist.',
                required: false,
                choices: [
                    { name: 'Battle Royale', value: 'battleRoyale' },
                    { name: 'Reload', value: 'reload' },
                ],
            },
            {
                type: OPT_NUMBER,
                name: 'dps',
                description: 'Optional current DPS override from the game.',
                required: false,
                min_value: 0,
                max_value: 100,
            },
        ],
    },
    {
        name: 'points',
        description: 'Calculate your Fortnite tournament pace.',
        dm_permission: true,
        options: [
            {
                type: OPT_STRING,
                name: 'mode',
                description: 'Use your cutoff or read the live Epic leaderboard.',
                required: true,
                choices: [
                    { name: 'Manual formula', value: 'manual' },
                    { name: 'Live Epic lookup', value: 'live' },
                ],
            },
            {
                type: OPT_INTEGER,
                name: 'games',
                description: 'Games remaining; Epic match cap is used when available.',
                required: true,
                min_value: 0,
                max_value: 100,
            },
            {
                type: OPT_STRING,
                name: 'ign',
                description: 'Exact Epic display name for live lookup.',
                required: false,
                max_length: 100,
            },
            {
                type: OPT_STRING,
                name: 'account_id',
                description: '32-character Epic account ID for console-only names.',
                required: false,
                min_length: 32,
                max_length: 32,
            },
            {
                type: OPT_STRING,
                name: 'region',
                description: 'Region for the live leaderboard lookup, or scan all regions.',
                required: false,
                choices: [
                    { name: 'All regions', value: 'ALL' },
                    { name: 'NAC', value: 'NAC' },
                    { name: 'EU', value: 'EU' },
                    { name: 'NAW', value: 'NAW' },
                    { name: 'BR', value: 'BR' },
                    { name: 'ASIA', value: 'ASIA' },
                    { name: 'OCE', value: 'OCE' },
                    { name: 'ME', value: 'ME' },
                ],
            },
            {
                type: OPT_STRING,
                name: 'tournament',
                description: 'Exact live tournament name when more than one is live.',
                required: false,
                max_length: 100,
            },
            {
                type: OPT_INTEGER,
                name: 'current',
                description: 'Current cumulative points for manual mode.',
                required: false,
                min_value: 0,
                max_value: 1000000,
            },
            {
                type: OPT_INTEGER,
                name: 'target',
                description: 'Qualifying cutoff points for manual mode.',
                required: false,
                min_value: 0,
                max_value: 1000000,
            },
            {
                type: OPT_INTEGER,
                name: 'buffer',
                description: 'Optional safety cushion above the cutoff.',
                required: false,
                min_value: 0,
                max_value: 1000000,
            },
        ],
    },
    {
        name: 'gen',
        description: 'Mint a tier-encoded Maxxer VIP code and DM it to a user (Diggy-only).',
        default_member_permissions: DEFAULT_MOD_ONLY,
        dm_permission: false,
        options: [
            {
                type: OPT_STRING,
                name: 'tier',
                description: 'Which tier the code unlocks at claim time.',
                required: true,
                choices: [
                    { name: 'MAXXER',   value: 'maxxer' },
                    { name: 'MAXXER+',  value: 'maxxerplus' },
                    { name: 'MAXXER++', value: 'maxxerplusplus' },
                ],
            },
            {
                type: OPT_STRING,
                name: 'term',
                description: 'Duration: monthly (30d), annual (365d), or lifetime. Defaults to monthly.',
                required: false,
                choices: [
                    { name: 'Monthly (30d)',   value: 'monthly' },
                    { name: 'Annual (365d)',   value: 'annual' },
                    { name: 'Lifetime',        value: 'lifetime' },
                ],
            },
            {
                type: OPT_USER,
                name: 'user',
                description: 'Optional: DM the code directly. If omitted, the code is returned to you ephemerally.',
                required: false,
            },
        ],
    },
    {
        name: 'om',
        description: 'Mint a MAXXER++ code for an Optimizationmaxxing lifetime purchase (Diggy-only).',
        default_member_permissions: DEFAULT_MOD_ONLY,
        dm_permission: false,
        options: [
            {
                type: OPT_USER,
                name: 'user',
                description: 'Optional: DM directly. If omitted, code returned ephemerally.',
                required: false,
            },
        ],
    },
    {
        name: '33',
        description: 'Pull one of the 33 pre-minted Founder codes and DM it (Diggy-only).',
        default_member_permissions: DEFAULT_MOD_ONLY,
        dm_permission: false,
        options: [
            {
                type: OPT_USER,
                name: 'user',
                description: 'Who to DM the Founder code to. Required (Founder codes always go to a specific recipient).',
                required: true,
            },
        ],
    },
    {
        name: 'founderstatus',
        description: 'Show how many of the 33 Founder codes are still in the pool (Diggy-only).',
        default_member_permissions: DEFAULT_MOD_ONLY,
        dm_permission: false,
    },
    {
        name: 'sccoins',
        description: 'Mint a Sprite Cannon coin code and DM it to a player (Diggy-only).',
        default_member_permissions: DEFAULT_MOD_ONLY,
        dm_permission: false,
        options: [
            {
                type: OPT_INTEGER,
                name: 'amount',
                description: 'Coins this code grants when redeemed in-game.',
                required: true,
                min_value: 1,
                max_value: 1000000,
            },
            {
                type: OPT_INTEGER,
                name: 'uses',
                description: 'How many different players can redeem it. Defaults to 1 (single-use).',
                required: false,
                min_value: 1,
                max_value: 100000,
            },
            {
                type: OPT_USER,
                name: 'user',
                description: 'Optional: DM the code directly. If omitted, the code is returned to you ephemerally.',
                required: false,
            },
            {
                type: OPT_STRING,
                name: 'note',
                description: 'Optional internal note (shows in the code worker admin list).',
                required: false,
            },
        ],
    },
];

// ─── PUT to Discord ────────────────────────────────────────────────────────
console.log(`[register] App ID  : ${APP_ID}`);
console.log(`[register] Guild   : ${GUILD_ID}`);
console.log(`[register] Commands:`);
for (const c of COMMANDS) console.log(`  /${c.name} — ${c.description}`);

if (DRY) {
    console.log('\n[register] Dry run done. Re-run with --execute to push.');
    process.exit(0);
}

const url = `https://discord.com/api/v10/applications/${APP_ID}/guilds/${GUILD_ID}/commands`;
const res = await fetch(url, {
    method: 'PUT',
    headers: {
        Authorization: `Bot ${TOKEN}`,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(COMMANDS),
});
const text = await res.text();
if (!res.ok) {
    console.error(`[register] FAILED ${res.status}\n${text}`);
    process.exit(1);
}

let registered;
try { registered = JSON.parse(text); } catch { registered = []; }
console.log(`\n[register] ✓ ${registered.length} command(s) registered.`);
for (const c of registered) {
    console.log(`  /${c.name}  (id: ${c.id})`);
}
console.log('\nThey appear in the Discord client within a few seconds.');
