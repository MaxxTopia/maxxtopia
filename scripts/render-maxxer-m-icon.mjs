/*
 * Render the chromatic-glitch M (the maxxer suite mark from
 * MaxxerSidebar.astro) to a 512x512 PNG for use as the Discord server
 * icon (or anywhere else that needs a raster). Uses sharp (already a
 * dep via electron-builder elsewhere) — no extra install needed.
 *
 * The vector is three layered M-shapes: cyan offset (+1.1, +0.4),
 * magenta offset (-1.1, -0.4), white centered. At 22px on the
 * sidebar that gives a 1-2px chromatic aberration vibe; at 512px we
 * scale the offsets to ~24-26px so the effect reads at icon size.
 *
 * Output: public/maxxtopia-mark-512.png  (transparent bg)
 */
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUB = resolve(__dirname, '..', 'public');

// Path data is the same M shape as the sidebar SVG, viewBox 24x24.
const PATH_D = 'M 4 19.5 L 4 4.5 L 12 13.5 L 20 4.5 L 20 19.5';

async function render(name, { offsetX, offsetY, strokeColor, strokeWidth, whiteWidth }) {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="512" height="512">
  <g stroke-linecap="round" stroke-linejoin="round" fill="none">
    <g transform="translate(${offsetX}, ${offsetY})">
      <path d="${PATH_D}" stroke="#00d4ff" stroke-width="${strokeWidth}" opacity="0.85"/>
    </g>
    <g transform="translate(${-offsetX}, ${-offsetY})">
      <path d="${PATH_D}" stroke="#e25bff" stroke-width="${strokeWidth}" opacity="0.85"/>
    </g>
    <path d="${PATH_D}" stroke="#ffffff" stroke-width="${whiteWidth}"/>
  </g>
</svg>`;
    const buf = await sharp(Buffer.from(svg), { density: 384 })
        .resize(512, 512)
        .png()
        .toBuffer();
    const out = resolve(PUB, name);
    writeFileSync(out, buf);
    console.log(`wrote ${out} (${buf.length} bytes)`);
}

// Variant A: tight chromatic — subtle aberration, white core dominates
await render('maxxtopia-mark-A-tight.png', {
    offsetX: 0.25, offsetY: 0.10, strokeWidth: 1.4, whiteWidth: 1.0
});

// Variant B: medium chromatic — middle ground, more glitch character
await render('maxxtopia-mark-B-medium.png', {
    offsetX: 0.45, offsetY: 0.18, strokeWidth: 1.4, whiteWidth: 0.9
});

// Variant C: bold chromatic — very visible split (the original attempt)
await render('maxxtopia-mark-C-bold.png', {
    offsetX: 0.78, offsetY: 0.30, strokeWidth: 1.4, whiteWidth: 0.6
});
