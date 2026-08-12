# Maxxtopia continuity addendum

## Betmaxxing deployment — 2026-08-12

- Added isolated static route: `public/betmaxxing/`.
- Public URL: `https://maxxtopia.com/betmaxxing/`.
- Purpose: Betmaxxing local replay terminal, published for phone/secondary-device review.
- Source of truth remains the separate Codex workspace at `C:\Users\Diggy\Documents\Codex\2026-08-10\you-are-an-elite-quantitative-sports\outputs\Betmaxxing`.
- Deployment commit: `dc2d644` (`feat: publish betmaxxing replay terminal`).
- CI run: GitHub Actions `31574675270`, completed successfully; normal `main` → Cloudflare Pages workflow.
- Live checks: page 200; hashed JS 200; hashed CSS 200; entrypoint `Cache-Control: no-cache`; assets immutable; HTTPS/HSTS present.
- Browser verification: public URL rendered seven replay rows at desktop and 390×844 phone viewport; no console errors; no horizontal document overflow at phone size.

## Truth boundary

This is still a synthetic replay prototype. It has no licensed live odds feed, provider credentials, sportsbook credentials, real deep links, automatic wagering, or profitability claim. The UI intentionally shows `REPLAY MODE` and disables sportsbook routing.

## Important working-tree state

The Maxxtopia repository contained unrelated dirty and untracked work before this deployment. Only `public/betmaxxing/` and the scoped `public/_headers` rules were staged and committed. Do not clean, reset, or overwrite the remaining work.

## Next action

For future Betmaxxing source updates, rebuild its `dist`, replace only `public/betmaxxing/`, run the Maxxtopia build, and make a targeted commit. Preserve the relative `./assets/...` paths and the no-cache entrypoint / immutable hashed-asset rules.

## Betmaxxing mobile UI release - 2026-08-12

- This release replaces the earlier dense phone fallback with the rebuilt mobile-first Betmaxxing surface: smart bet cards, sticky sport pills, an expandable filter drawer, plain-language reasons, full sportsbook names, accurate American odds display, and collapsed movement/alert panels.
- The source workspace passed `pnpm test:math`, `pnpm lint`, and `pnpm build`; browser checks passed at 390x844, 1280px, and 1920x1080 with no page overflow or console warnings.
- The public route remains a synthetic replay prototype. It still shows `REPLAY MODE`, has no live odds provider or sportsbook credentials, and keeps sportsbook CTAs disabled because no verified deep links exist.
- Published commit: `2571e0c` (`feat: refresh betmaxxing mobile surface`); deploy run `31584891539` completed successfully.
- Public verification after deployment: route and new hashed assets returned HTTP 200; desktop and 390x844 browser checks rendered the updated surface with no horizontal overflow or console warnings.
- Only `public/betmaxxing/` and this continuity note are in scope for this release. Existing unrelated Maxxtopia working-tree changes remain untouched.
