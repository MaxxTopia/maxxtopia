# Maxxtopia Dropmaxxer map refresh — 2026-11-15

## Scope

Refresh the Dropmaxxer tablet/hero map on `maxxtopia.com/dropmaxxer/`. The
canonical Maxxtopia checkout was left untouched because it contains unrelated
uncommitted work; this change is isolated in the `codex/dropmaxxer-map-20261115`
worktree branch.

## Change

- Added `public/screenshots/dropmaxxer/season43-treasure-hunters-map.webp`, a
  2048px WebP conversion of the current Dropmaxxer
  `public/map_4096_labeled.png` asset from v.CXLIX / map 43 / Chapter 7 Season 5
  Treasure Hunters.
- Updated `DropmaxxerHero.astro` and `products.ts` to use the Season 5 asset,
  map version 43.00, and current POI text. Removed the old Season 4
  Chopped Shop -> Latte Landing references from the active page data.
- Replaced the static hero route with the current calculator's verified local
  W->E example to The $.$. Rocky: jump `1377.905,1020`, deploy `1459.099,860.1`,
  cut `1474.208,830.345`, target `1482,815`; displayed estimates are 46.7s
  Fastest and 48.7s Safe.

## Evidence and status

- Current source map and POI coordinates were read from the live Dropmaxxer
  repository, not training-memory POI names.
- The Dropmaxxer local dev route was exercised with the same bus and target;
  it returned the pro-fit source, a verified fastest route, and the timings
  recorded above without console errors.
- Maxxtopia build passed after the final tablet breakpoint fix: the release
  truth check passed for 10 products, the sitemap check passed for 20 Astro
  routes plus `/play/spritecannon/`, and 30 pages were built.
- The local preview route returned HTTP 200 and served the new asset at HTTP
  200 (2048x2048, 253260 bytes). Browser checks at 1440x1000, 1024x1366, and
  768x1024 confirmed the Season 5 asset, map 43 labels, target, 46.7/48.7
  timings, no old Season 4 references in active HTML, no console errors or
  failed requests, and no horizontal overflow. The tablet-only header shortcut
  overflow was fixed by hiding product shortcuts below 900px.
- This branch is not committed, pushed, deployed, or verified on
  `maxxtopia.com` yet. Production publication still requires Diggy's explicit
  approval.

## Next action

Ask Diggy whether to commit and publish this isolated change. If approved,
push the intended branch changes through the normal `main` deployment flow,
watch the deployment, and verify the live route and asset after Cloudflare
serves it.
