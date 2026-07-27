/*
 * Render one bespoke 1200x630 social-share card PER PRODUCT.
 *
 * Companion to render-og-image.mjs (which renders the single site-wide
 * /og.png). This emits public/og/<slug>.png for every product so that
 * sharing a deep link — maxxtopia.com/discordmaxxer — shows a designed,
 * correctly-sized, on-brand card ("Discordmaxxer — Discord. Minus 753 MB.")
 * instead of a cropped in-app screenshot.
 *
 * [slug].astro passes /og/<slug>.png as og:image + twitter:image.
 *
 * Same visual language as the main og.png: near-black canvas, faint grid,
 * clavicular-M mark, Bebas headline — but the two radial glows + the stat
 * + the status pill are tinted with each product's own accentHex, so every
 * card feels product-specific while staying inside the suite system.
 *
 * Run:  node scripts/render-og-product-cards.mjs   (or: npm run og:cards)
 *
 * NOTE: the table below is a copy of the marketing-facing fields from
 * src/data/products.ts (name / tagline / category / status / accentHex /
 * heroStat). Keep it in sync when those change — they're stable copy, so
 * this rarely drifts, and keeping it inline avoids a TS-import build step.
 */
import sharp from 'sharp';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '..', 'public', 'og');
mkdirSync(OUT_DIR, { recursive: true });

const W = 1200;
const H = 630;

/** @type {Array<{slug:string,name:string,category:string,status:string,tagline:string,accent:string,stat:string}>} */
const PRODUCTS = [
  { slug: 'optimizationmaxxing', name: 'Optimizationmaxxing', category: 'PC Tuning',        status: 'live', tagline: 'One hundred tweaks. Zero placebos.', accent: '#e25bff', stat: '100 tweaks · zero placebos' },
  { slug: 'discordmaxxer',       name: 'Discordmaxxer',       category: 'Communication',    status: 'live', tagline: 'Discord. Minus 753 MB.',           accent: '#5865F2', stat: '−753 MB · vs stock Discord' },
  { slug: 'clipmaxxer',          name: 'Clipmaxxer',          category: 'Content',          status: 'soon', tagline: 'Stream. Sleep. Wake up posted.',   accent: '#00d4ff', stat: '3 clips · by morning' },
  { slug: 'dropmaxxer',          name: 'Dropmaxxer',          category: 'Fortnite',         status: 'beta', tagline: 'Stop guessing your drop.',         accent: '#4c51f7', stat: '832 m · bus altitude, cited' },
  { slug: 'aimmaxxer',           name: 'Aimmaxxer',           category: 'Training',         status: 'soon', tagline: 'Aim is four metrics. Not one.',    accent: '#f3af19', stat: '4 metrics · not one' },
  { slug: 'viewmaxxing',         name: 'Viewmaxxing',         category: 'Streamer Tools',   status: 'soon', tagline: 'A tool for streamers.',           accent: '#10b981', stat: 'operator-first · slot reserved' },
  { slug: 'adblockmaxxer',       name: 'AdBlock-Maxxer',      category: 'Browser Extension', status: 'live', tagline: "The ad blocker they couldn't ban.", accent: '#00d4ff', stat: '0 ads · every browser' },
  { slug: 'streammaxxing',       name: 'Streammaxxing',       category: 'Stream Alerts',    status: 'live', tagline: 'Alerts that fire the instant it happens.', accent: '#22d3a0', stat: 'instant · fired on your PC' },
  { slug: 'snipemaxxer',         name: 'Snipemaxxer',         category: 'Fortnite',         status: 'beta', tagline: "Know who's in your lobby.",        accent: '#ff3b3b', stat: 'the whole lobby · named' },
  { slug: 'playlistmaxxing',     name: 'Playlistmaxxing',     category: 'Music',            status: 'live', tagline: 'Every platform. One playlist.',    accent: '#ff2e88', stat: '3-in-1 · Spotify · SoundCloud · YouTube' },
];

const STATUS_LABEL = { live: 'LIVE', beta: 'BETA', soon: 'COMING SOON', dev: 'IN DEV', waitlist: 'WAITLIST' };

// XML-escape text node content (& < > — apostrophes/quotes are legal in text).
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Pick a Bebas headline size that keeps the (condensed) product name inside
// the usable text column. Long names ("Optimizationmaxxing") shrink a touch.
function nameSize(name) {
  const usable = 1020;          // px of horizontal room
  const perChar = 0.46;         // Bebas Neue advance ≈ 0.46em
  return Math.min(104, Math.floor(usable / (name.length * perChar)));
}

function cardSVG(p) {
  const fs = nameSize(p.name);
  const statusLabel = STATUS_LABEL[p.status] ?? p.status.toUpperCase();
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#08050d"/>
      <stop offset="0.5" stop-color="#0a0612"/>
      <stop offset="1" stop-color="#050309"/>
    </linearGradient>
    <radialGradient id="glowA" cx="0.16" cy="0.26" r="0.55">
      <stop offset="0" stop-color="${p.accent}" stop-opacity="0.30"/>
      <stop offset="1" stop-color="${p.accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowB" cx="0.9" cy="0.85" r="0.5">
      <stop offset="0" stop-color="${p.accent}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${p.accent}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ink" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="${p.accent}"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glowA)"/>
  <rect width="${W}" height="${H}" fill="url(#glowB)"/>

  <!-- faint grid -->
  <g opacity="0.045" stroke="#ffffff" stroke-width="1">
    ${Array.from({ length: 25 }, (_, i) => `<line x1="${i * 50}" y1="0" x2="${i * 50}" y2="${H}"/>`).join('')}
    ${Array.from({ length: 13 }, (_, i) => `<line x1="0" y1="${i * 50}" x2="${W}" y2="${i * 50}"/>`).join('')}
  </g>

  <!-- accent rail down the left edge -->
  <rect x="0" y="0" width="8" height="${H}" fill="${p.accent}"/>

  <!-- top row: clavicular-M mark + wordmark (left), status pill (right) -->
  <g transform="translate(90, 70)" stroke-linecap="square" stroke-linejoin="miter" fill="none">
    <path d="M 2 60 L 2 2 L 27 36 L 52 2 L 52 60" stroke="${p.accent}" stroke-width="6" opacity="0.7" transform="translate(2,1)"/>
    <path d="M 2 60 L 2 2 L 27 36 L 52 2 L 52 60" stroke="#ffffff" stroke-width="5"/>
    <circle cx="27" cy="36" r="4" fill="${p.accent}"/>
  </g>
  <text x="162" y="113" font-family="ui-monospace,'Geist Mono',Menlo,monospace" font-size="24" letter-spacing="3" fill="#cdd2db" font-weight="600">MAXXTOPIA</text>

  <g transform="translate(${W - 90}, 84)">
    <rect x="-184" y="0" width="184" height="42" rx="21" fill="${p.accent}" fill-opacity="0.14" stroke="${p.accent}" stroke-opacity="0.55"/>
    <circle cx="-160" cy="21" r="5" fill="${p.accent}"/>
    <text x="-142" y="28" font-family="ui-monospace,'Geist Mono',Menlo,monospace" font-size="17" letter-spacing="2" fill="#ffffff" font-weight="600">${esc(statusLabel)}</text>
  </g>

  <!-- center block: category eyebrow → name → tagline -->
  <text x="90" y="300" font-family="ui-monospace,'Geist Mono',Menlo,monospace" font-size="22" letter-spacing="4" fill="${p.accent}" font-weight="600">${esc(p.category.toUpperCase())}</text>

  <text x="86" y="${300 + fs + 6}" font-family="'Bebas Neue','Impact',sans-serif" font-size="${fs}" fill="url(#ink)" letter-spacing="1">${esc(p.name.toUpperCase())}</text>

  <text x="90" y="${300 + fs + 70}" font-family="'Geist','Segoe UI',Arial,sans-serif" font-size="40" fill="#e8e3f7" font-weight="500">${esc(p.tagline)}</text>

  <!-- bottom row: url pill (left) + stat (right) -->
  <g transform="translate(90, 548)">
    <rect x="0" y="0" width="208" height="44" rx="22" fill="#ffffff" fill-opacity="0.08" stroke="#ffffff" stroke-opacity="0.18"/>
    <text x="24" y="29" font-family="ui-monospace,'Geist Mono',Menlo,monospace" font-size="18" fill="#ffffff" font-weight="600">maxxtopia.com</text>
  </g>
  <text x="${W - 90}" y="579" text-anchor="end" font-family="ui-monospace,'Geist Mono',Menlo,monospace" font-size="20" fill="${p.accent}" font-weight="600">${esc(p.stat)}</text>
</svg>`;
}

let wrote = 0;
for (const p of PRODUCTS) {
  const buf = await sharp(Buffer.from(cardSVG(p))).png({ quality: 92 }).toBuffer();
  const out = resolve(OUT_DIR, `${p.slug}.png`);
  writeFileSync(out, buf);
  wrote++;
  console.log(`wrote og/${p.slug}.png (${(buf.length / 1024).toFixed(1)} KB)`);
}
console.log(`\n${wrote} product OG cards → public/og/  (1200x630)`);
