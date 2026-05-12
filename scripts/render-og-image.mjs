/*
 * Render the Maxxtopia social-share OG image (1200x630).
 *
 * Used by every <meta property="og:image"> + <meta name="twitter:image">
 * tag across the site (see Layout.astro). Without this file the social
 * previews on X / Discord / Telegram / iMessage show a broken-image
 * box, which costs click-throughs that the rest of the on-site SEO has
 * worked hard to earn.
 *
 * Design intent: brand-anchored, not generic. Clavicular-M mark on the
 * left, brand wordmark + tagline on the right, magenta-cyan gradient
 * over a near-black canvas. Matches the suite's Linear-meets-Tarik
 * voice — no marketing fluff, one stat, one promise.
 *
 * Output: public/og.png
 */
import sharp from 'sharp';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUB = resolve(__dirname, '..', 'public');

const W = 1200;
const H = 630;

// Clavicular-M path: same V-taper shape as favicon.svg, rendered as
// stroked path with square caps + magenta plasma dot at the apex.
const SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#08050d"/>
      <stop offset="0.5" stop-color="#0a0612"/>
      <stop offset="1" stop-color="#050309"/>
    </linearGradient>
    <radialGradient id="glow1" cx="0.2" cy="0.3" r="0.5">
      <stop offset="0" stop-color="#e25bff" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#e25bff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="0.85" cy="0.75" r="0.4">
      <stop offset="0" stop-color="#00d4ff" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#00d4ff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="suite" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#e25bff"/>
      <stop offset="0.5" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#00d4ff"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow1)"/>
  <rect width="${W}" height="${H}" fill="url(#glow2)"/>

  <!-- subtle grid -->
  <g opacity="0.05" stroke="#ffffff" stroke-width="1">
    ${Array.from({length: 25}, (_, i) => `<line x1="${i*50}" y1="0" x2="${i*50}" y2="${H}"/>`).join('')}
    ${Array.from({length: 13}, (_, i) => `<line x1="0" y1="${i*50}" x2="${W}" y2="${i*50}"/>`).join('')}
  </g>

  <!-- Clavicular M mark on the left -->
  <g transform="translate(120, 200)" stroke-linecap="square" stroke-linejoin="miter" fill="none">
    <!-- cyan offset behind -->
    <path d="M 8 220 L 8 8 L 100 130 L 192 8 L 192 220" stroke="#00d4ff" stroke-width="14" opacity="0.65" transform="translate(6, 2)"/>
    <!-- magenta offset behind -->
    <path d="M 8 220 L 8 8 L 100 130 L 192 8 L 192 220" stroke="#e25bff" stroke-width="14" opacity="0.65" transform="translate(-6, -2)"/>
    <!-- white core -->
    <path d="M 8 220 L 8 8 L 100 130 L 192 8 L 192 220" stroke="#ffffff" stroke-width="12"/>
    <!-- plasma dot at V apex -->
    <circle cx="100" cy="130" r="9" fill="#e25bff"/>
    <circle cx="100" cy="130" r="4" fill="#ffffff"/>
  </g>

  <!-- Text block on the right -->
  <g transform="translate(420, 230)">
    <!-- Eyebrow -->
    <text x="0" y="0" font-family="ui-monospace, 'SF Mono', 'Geist Mono', Menlo, monospace"
          font-size="22" letter-spacing="2" fill="#9aa0aa" font-weight="500">
      MAXXTOPIA · NATIVE GAMING UTILITIES
    </text>
    <!-- Headline -->
    <text x="0" y="80" font-family="'Bebas Neue', 'Impact', sans-serif"
          font-size="108" font-weight="400" fill="url(#suite)" letter-spacing="0">
      SEVEN TOOLS.
    </text>
    <text x="0" y="190" font-family="'Bebas Neue', 'Impact', sans-serif"
          font-size="108" font-weight="400" fill="#ffffff" letter-spacing="0">
      ONE MISSION.
    </text>
    <!-- Stat row -->
    <g transform="translate(0, 250)" font-family="ui-monospace, 'SF Mono', 'Geist Mono', Menlo, monospace" font-size="20" fill="#cdd2db">
      <text x="0" y="0" font-weight="600" fill="#e25bff">87 tweaks</text>
      <text x="170" y="0" fill="#555a64">·</text>
      <text x="200" y="0" font-weight="600" fill="#00d4ff">-753 MB Discord</text>
      <text x="490" y="0" fill="#555a64">·</text>
      <text x="520" y="0" font-weight="600" fill="#ffffff">zero telemetry</text>
    </g>
    <!-- URL pill -->
    <g transform="translate(0, 305)">
      <rect x="0" y="0" width="220" height="40" rx="20" fill="#ffffff" fill-opacity="0.08" stroke="#ffffff" stroke-opacity="0.18"/>
      <text x="22" y="27" font-family="ui-monospace, monospace" font-size="18" fill="#ffffff" font-weight="600">
        maxxtopia.com
      </text>
    </g>
  </g>
</svg>`;

const buf = await sharp(Buffer.from(SVG))
    .png({ quality: 92 })
    .toBuffer();
const out = resolve(PUB, 'og.png');
const { writeFileSync } = await import('node:fs');
writeFileSync(out, buf);
console.log(`wrote ${out} (${(buf.length / 1024).toFixed(1)} KB) — 1200x630`);
