# Maxxtopia smoothness checkpoint — 2026-10-20

## Scope

Investigate the report that Maxxtopia.com feels laggy, with OptimizationMaxxing called out specifically. Work is isolated from the canonical dirty checkout at `C:\Users\Diggy\projects\maxxtopia`. The isolated checkout started at `25fde8f`, then was reconciled onto the newer remote `main` tip `1642dd1` (`sync: optimizationmaxxing v0.4.33`) before release.

## Recovered state

- Canonical checkout remains untouched and dirty: `main` is 2 commits ahead and 88 behind `origin/main`, with broad tracked and untracked work.
- Live `https://maxxtopia.com/optimizationmaxxing/` had six paused videos at `readyState=4` on first load, including five feature clips below the fold.
- The live main demo variants are approximately 8.8 MB, 14.8 MB, and 17.0 MB; the five feature clips add about 2.6 MB. Console warnings/errors were not observed during the live check.
- The live page also has an animation-heavy hero (Starfield canvas, blurred auroras, PC rig motion). That remains a separate follow-up if the media change does not resolve the user's perceived lag.

## Change in this isolated worktree

- `src/components/ProductScreenshot.astro`: set the demo video to `preload="none"`; remove the random-variant script's eager `video.load()` call so the selected source stays poster-only until the existing explicit play control is used.
- `src/components/FeatureZone.astro`: set feature clips to `preload="none"` so below-fold media is not loaded on page entry.

## Verification

- `npm ci` completed. npm reported existing dependency audit findings (21 vulnerabilities); no dependency changes were made.
- `npm run build` passed: release-truth check, sitemap check, and all 28 static routes.
- `npm run test:standings-search` passed: 6/6.
- `npm run test:standings-pagination` passed: 3/3.
- Local preview smoke test: home, Discordmaxxer, Updates, and Guides rendered with no console warnings/errors.
- Local OptimizationMaxxing fresh load: all six videos reported `preload="none"`, paused, `readyState=0`.
- Local explicit Play with sound: main demo reached `readyState=4`, advanced its playhead, was unmuted/playing, and hid the overlay.

## State and next gate

- Diggy authorized the normal Maxxtopia release gate. The rebased build, focused tests, desktop/mobile route smoke test, deferred-load state, explicit playback, and console check pass; the patch is not yet committed, pushed, or deployed at this checkpoint update.
- Next release action: stage only the two component changes plus this continuity note, commit without co-authorship trailers, push the isolated HEAD to remote `main` without touching the canonical dirty checkout, watch the GitHub Actions deployment, and re-check the live page.
- After deployment, the remaining user gate is a fresh browser test of OptimizationMaxxing scrolling, nav clicks, and explicit demo playback. If it still feels laggy, measure the hero's Starfield/blur/3D work separately and make one controlled follow-up change.
