/*
 * release-note-to-changelog.mjs
 *
 * Turns a GitHub Release into a clean entry in src/data/changelog.json.
 * Run by the sync-<product>-release.yml workflows after a version bump.
 *
 * Usage:  node scripts/release-note-to-changelog.mjs <input.json>
 *
 * <input.json> = { product, slug, version, name, date, body }
 *   product : display name, e.g. "Discordmaxxer"
 *   slug    : product slug / route, e.g. "discordmaxxer"
 *   version : release tag, e.g. "v0.7.30"
 *   name    : the GitHub Release *title* (becomes the headline)
 *   date    : release published_at (ISO) — we keep the YYYY-MM-DD
 *   body    : the release notes markdown
 *
 * CURATED GATE: only releases whose notes contain a `## Highlights` section
 * are published to the feed. Everything else is a silent version bump.
 * The bullets under Highlights become `items`; an optional lead line becomes
 * `body`; the release title becomes `title`.
 *
 * Exit 0 always (a skipped release must not fail the release pipeline).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CHANGELOG = resolve(__dirname, '..', 'src', 'data', 'changelog.json');

function fail(msg) {
  console.log(`[changelog] ${msg} — skipping (no entry added).`);
  process.exit(0);
}

const inputPath = process.argv[2];
if (!inputPath) fail('no input file passed');

let input;
try {
  input = JSON.parse(readFileSync(inputPath, 'utf8'));
} catch (e) {
  fail(`could not read input json: ${e.message}`);
}

const { product, slug, version, name = '', date = '', body = '' } = input;
if (!product || !slug || !version) fail('input missing product/slug/version');

// --- Lines we never publish (Claude authorship, auto-gen boilerplate) -------
const NOISE = /co-?authored-?by|🤖|generated with|\bclaude\b|full changelog|what'?s changed|new contributors/i;

// --- Extract the `## Highlights` section ------------------------------------
const lines = String(body).replace(/\r\n/g, '\n').split('\n');
let inHi = false;
const section = [];
for (const raw of lines) {
  const line = raw.trimEnd();
  const heading = line.match(/^#{1,6}\s+(.*)$/);
  if (heading) {
    // Enter on a "Highlights" heading; any subsequent heading ends the section.
    inHi = /^highlights\b/i.test(heading[1].trim());
    continue;
  }
  if (inHi) section.push(line);
}
if (!inHi && section.length === 0) {
  fail(`no "## Highlights" section in ${version} notes`);
}

// --- Split the section into a lead line + bullets ---------------------------
const items = [];
const leadLines = [];
let seenBullet = false;
for (const line of section) {
  const t = line.trim();
  if (!t) continue;
  if (NOISE.test(t)) continue;
  const bullet = t.match(/^[-*+]\s+(.*)$/);
  if (bullet) {
    seenBullet = true;
    const text = bullet[1].trim().replace(/\s+$/, '');
    if (text) items.push(text);
  } else if (!seenBullet) {
    leadLines.push(t);
  }
}

const lead = leadLines.join(' ').trim();

// --- Title: the release name, unless it's just the bare version -------------
const looksLikeVersion = (s) => /^v?\d+(\.\d+)*([-.][\w.]+)?$/i.test(s.trim());
let title = name && !looksLikeVersion(name) ? name.trim() : '';
let entryBody = lead || undefined;
if (!title) {
  // No usable release title — promote the lead line to the headline.
  title = lead || `${product} ${version}`;
  if (title === entryBody) entryBody = undefined;
}

if (items.length === 0 && !entryBody) {
  fail(`"Highlights" section in ${version} had no usable bullets or summary`);
}

// --- Build the entry --------------------------------------------------------
const entry = {
  date: (date || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
  product,
  productSlug: slug,
  version,
  title,
  ...(entryBody ? { body: entryBody } : {}),
  ...(items.length ? { items } : {}),
};

// --- Load, dedupe by slug+version, prepend, write ---------------------------
let changelog;
try {
  changelog = JSON.parse(readFileSync(CHANGELOG, 'utf8'));
} catch (e) {
  fail(`could not read changelog.json: ${e.message}`);
}

if (changelog.some((e) => e.productSlug === slug && e.version === version)) {
  fail(`${product} ${version} already in changelog (idempotent)`);
}

changelog.unshift(entry);
writeFileSync(CHANGELOG, JSON.stringify(changelog, null, 2) + '\n');
console.log(`[changelog] added ${product} ${version}: "${title}" (${items.length} items)`);
