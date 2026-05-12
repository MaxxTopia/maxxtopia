# Maxxtopia M v2 — Higgsfield/mcp-image prompts (Option C: clavicular)

> Drafted 2026-05-09 after a 5-expert design panel. Option C (pure clavicular bone-anatomy) won 4-of-5 votes. Option B (Clyde-bubble cutout) killed unanimously for Discord trademark exposure. See conversation transcript for full panel verdicts.
>
> All 3 share the **hardened negative-prompt clauses** that fix the magenta-gem hallucination from v1: no gemstones, no jewels, no off-palette colors (mint #00FFA3 only), M is the entire subject.

## How to fire (tomorrow, after Gemini quota resets at midnight PT)

In Claude Code, just say: **"fire the M gens"** — the model will read this file and run all 3 in parallel via mcp-image. Or fire individually: "fire subtle", "fire medium", "fire committed".

Settings for all three:
- Aspect ratio: `1:1`
- Output dir: `IMAGE_OUTPUT_DIR` (per mcp-image config) — likely `projects/branding/generated/`
- Output filenames: `maxxtopia-M-v2-subtle.png`, `maxxtopia-M-v2-medium.png`, `maxxtopia-M-v2-committed.png`

After all 3 land, eyeball-test against the User Researcher's gate: **if more than ~30% of viewers say "medical/anatomy/skeleton" unprompted, dial restraint up.**

---

## V1 — SUBTLE (clavicle as form language, anatomy is a whisper)

```
Premium app icon. The letter M, alone, centered on a pure black background (#050505). The M is rendered with a subtle organic curvature where its two strokes meet at the bottom V — the curvature is suggestive of how paired human collarbones converge at the sternum, but reads first as an elegant letterform, not as anatomy. Surface finish: polished chrome with a soft mint-green (#00FFA3) electric rim-glow tracing the outer edge of the M only. Slight depth and bevel on the strokes. App-store style icon: rounded-square frame, centered subject, generous negative space around the M, professional iOS/macOS app-icon polish. The M is the entire subject. Avoid: no gemstones, no jewels, no crystals, no facets, no decorative ornaments or embellishments, no magenta, no purple, no pink, no secondary accent colors, no logos or badges or symbols inside or beside the M, no stars, no sparkles, no text, no diagrams, no anatomical labels, no skull or skeleton imagery, no extra shapes — only the two M strokes, their organic clavicular convergence, and rim-glow lighting. Restraint level: SUBTLE — the anatomical reference is a whisper, not a statement.
```

## V2 — MEDIUM (clavicle clearly readable as bone-form)

```
Premium app icon. The letter M, alone, centered on a pure black background (#050505). The two strokes of the M are clearly shaped like paired human clavicle bones — gently curved, slightly thickening at the medial ends where they meet at the bottom V (the manubrium of the sternum). Surface finish: polished ivory bone-white, not chrome, with a clean specular highlight running along the top of each stroke. A soft mint-green (#00FFA3) electric rim-glow traces the outer edge of the M. Slight depth and bevel on the strokes. App-store style icon: rounded-square frame, centered subject, generous negative space, professional iOS/macOS app-icon polish — premium gaming/tech brand, not medical or educational. The M is the entire subject and reads as a confident letterform first, with the bone-form a deliberate brand cue underneath. Avoid: no gemstones, no jewels, no crystals, no facets, no decorative ornaments, no embellishments, no magenta, no purple, no pink, no secondary accent colors, no logos or badges or symbols inside or beside the M, no stars, no sparkles, no text, no anatomical labels or diagrams, no skulls, no full skeletons, no extra shapes — only the two clavicle-bone M strokes, the sternum convergence at the bottom V, and rim-glow lighting. Restraint level: MEDIUM — the anatomy is clearly readable but the icon still reads as a brand mark first.
```

## V3 — COMMITTED (full anatomical interpretation, premium brand finish)

```
Premium app icon. The letter M, alone, centered on a pure black background (#050505). The M is rendered as two anatomically faithful human clavicle bones meeting at a small stylized sternum/manubrium form at the bottom V. The bones have realistic but stylized form — gentle organic curvature, slight thickening at the medial ends, smooth ivory-white surface with subtle organic shadows that suggest density and weight. A soft mint-green (#00FFA3) inner rim-glow traces the silhouette of the M. Premium and ownable — think the brand confidence of Liquid Death applied to anatomy: the bones are a deliberate, distinctive brand choice, not a medical illustration. App-store style icon: rounded-square frame, centered subject, generous negative space, iOS/macOS app-icon polish. The M reads simultaneously as a letterform and as paired clavicles — that double-reading is the entire point. Avoid: no gemstones, no jewels, no crystals, no facets, no decorative ornaments, no embellishments, no magenta, no purple, no pink, no secondary accent colors, no logos or badges or symbols inside or beside the M, no stars, no sparkles, no text, no anatomical chart labels, no skulls, no full skeletons, no other bones, no extra shapes — only the two clavicle-bone M strokes, the sternum convergence, and rim-glow lighting. Restraint level: COMMITTED — full anatomical interpretation, but premium brand finish, not textbook diagram.
```

---

## After firing — picking the winner

Once the 3 land, compare side-by-side at:
- **16px** thumbnail (favicon / Discord icon-grid scale)
- **64px** (taskbar / app-grid)
- **512px** (full hero / install screen)

Top pick gets:
1. Saved as `public/maxxtopia-clavicular-512.png` (replaces current — keep `-higgsfield.png` magenta-gem version archived)
2. Wired into `src/components/Logo.astro` (currently uses inline SVG / favicon.svg only)
3. Updated favicon (drop the favicon.svg, generate ICO from the winner)
4. Pushed to Discord server (replaces current Maxxtopia clavicular-M server icon)
