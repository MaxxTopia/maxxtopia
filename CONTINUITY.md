# Maxxtopia continuity addendum

## Betmaxxing game-first browse and phone layout release - 2026-08-15

- Published the updated Betmaxxing client from
  `C:\Users\Diggy\Documents\Codex\2026-08-10\you-are-an-elite-quantitative-sports\outputs\Betmaxxing`.
- The targeted Maxxtopia commit is `6b74e4e` and GitHub Actions Pages run
  `31921635072` completed successfully. The production route is
  `https://maxxtopia.com/betmaxxing/`; its entrypoint and new hashed bundle
  returned HTTP 200.
- The separate live gateway was deployed as Worker version
  `71c8e069-2626-4b03-96c9-eca72a30a513`. A public focused
  `Brewers Dodgers` request returned live data with 420 bounded market lines
  and 31 contract-discovery rows; no strict better-price recommendation was
  fabricated because the reference/price gate did not pass.
- Browser verification at 390x844 showed no horizontal overflow, a hidden
  desktop rail and inspector, 44px-or-larger phone controls, populated MLB
  and team filters, 431 focused game lines including player markets, and a
  working YES/NO ticket selection. The browser recorded no warnings or
  errors. The static page remains advisory and does not place orders.
- Unrelated dirty and untracked suite work remains preserved. A real iPhone
  Safari portrait check is still the human device gate.

## Betmaxxing player-prop explainer and finance-style mobile release - 2026-08-13

- Refreshed the production Betmaxxing client from the source release at
  `C:\Users\Diggy\Documents\Codex\2026-08-10\you-are-an-elite-quantitative-sports\outputs\Betmaxxing`.
- Added plain-language player-prop explanations for supported MLB hits props,
  including how many plate appearances allow a miss when a user selects a
  multi-hit line. The calculation is transparent and derived from the listed
  market probability; it is not presented as a guarantee or a player-history
  model.
- Reworked the narrow layout into a single-column mobile surface with a search
  field, compact sport/filter controls, full-width actions, and a fixed bottom
  navigation bar. Desktop rail and inspector behavior remain available at
  wider widths.
- Local release gates passed: player-prop/math smoke tests, provider contract
  smoke, lint, and production build. The publish checkout was scoped to the
  `public\\betmaxxing` route and this continuity note; unrelated dirty suite
  work was preserved.
- Publication and public browser verification are recorded in the release
  handoff after the authorized push. Live market availability remains
  provider-dependent and fail-closed; this UI release does not guarantee a
  winning bet or an upstream provider response.

## Betmaxxing button audit release - 2026-08-13

- Fixed the previously inert Betmaxxing `Open settings` control and shipped a
  working control center with close, refresh, clear-filter, and alert-view
  actions.
- Published through commit `a484156`; GitHub Actions deploy run
  `31762717657` completed successfully.
- The live route and new hashed assets returned HTTP 200. The mobile browser
  check at 390x844 showed `LIVE DATA`, no horizontal overflow, a hidden desktop
  control rail, 44px controls, no browser warnings, working settings actions,
  alert expansion, and Track-to-account handoff.
- The client bundle contains the public Worker origin but no provider/news
  secrets or replay labels. The public market surface remains advisory and
  fail-closed; current `WATCH` rows must not be described as guaranteed bets.

## Betmaxxing live provider gateway and production client - 2026-08-13

- Added the provider-backed live adapter path in the source workspace at
  `C:\Users\Diggy\Documents\Codex\2026-08-10\you-are-an-elite-quantitative-sports\outputs\Betmaxxing`.
- Normalization now covers moneylines, spreads/run lines, totals, alternate
  lines, player props, team props, game props, period markets, and futures;
  provider market labels are preserved so new market variants do not collapse
  into the wrong comparison group.
- Deployed the server-side Cloudflare Worker gateway at
  `https://betmaxxing-api.maxxtopia.workers.dev`.
- Provider keys are stored as Worker secrets only. They are not present in the
  public Pages build or the repository.
- The production client is built with the gateway origin and uses bounded
  polling plus the Worker edge cache for reliable phone/secondary-monitor
  refreshes.
- Local provider smoke: all three configured adapters returned normalized
  markets. Local gateway showed 733 opportunities before publication.
- Public Pages deployment was verified through the production route after
  workflow `31694577545`: the browser loaded real odds, the expanded market
  filter, 68 live lines, 13 displayed opportunities, and 7 actionable rows.
- Public provider health is intentionally partial at this moment: Odds-API.io
  is connected; The Odds API is rate-limited (HTTP 429) and OddsPapi is
  returning Forbidden from the Worker runtime. The client exposes those
  states instead of hiding them or manufacturing data. The keys remain wired
  and will recover when the upstream quota/access boundary clears.
- Added the Worker origin to the site CSP `connect-src`; without that header
  fix the API was healthy but the browser correctly blocked the request.
- Removed the branch-only Pages deploy flag so future pushes promote the
  production custom domain rather than leaving it on the prior deployment.
- Latest live gateway deployment: Worker version
  `8f090171-aa30-42fa-83ea-0cdf0eb6e357`.
- This release remains advisory and fail-closed: no automatic wagering, no
  guessed sportsbook links, no synthetic production feed, and no guaranteed
  win-rate claim.

## Betmaxxing free-provider and mobile hardening publish - 2026-08-13

- Corrected the PropLine sport catalog mapping to its documented live keys:
  `football_nfl`, `basketball_nba`, `baseball_mlb`, `hockey_nhl`, `mma_ufc`,
  and `boxing`. The local live smoke returned normalized markets for NFL, NBA,
  MLB, NHL, UFC, and boxing with no provider warnings.
- Narrowed the free Odds-API.io fallback to its known-good basketball and
  baseball routes so unsupported hockey/MMA requests cannot make the public
  health state look degraded.
- Added a Worker KV operator kill switch at `config:live-enabled`, fixed cold
  health checks to refresh real provider state, and made context review force
  `WATCH` while confirmed high-risk context forces `PASS`.
- Published Worker version `39b6134f-dce9-4bb7-8525-ffd5e65a0225` at
  `https://betmaxxing-api.maxxtopia.workers.dev`. Public verification returned
  HTTP 200 for health, markets, and SSE; PropLine and Odds-API.io were
  connected, context was connected, and the surfaced lines were review-only.
- Rebuilt the client against the Worker origin and refreshed only
  `public/betmaxxing/index.html` plus its generated hashed JS/CSS assets. The
  targeted publish is Maxxtopia commit `7baf253`, GitHub Actions deploy run
  `31758869891`, and the post-deploy phone check showed live data, no
  horizontal overflow, a 44px Filters control, and 44px+ Track/Bet controls.
- Parallelized the free-provider cold path after a fresh browser request
  exposed a response delay. The public API now returned HTTP 200 in 6.08s on
  the first health request and 0.10s or less from the warmed cache; the mobile
  page reached LIVE DATA with no browser warnings.
- Added a 15-second Worker refresh deadline and a 20-second browser request
  deadline with automatic polling recovery. A stalled upstream now yields a
  partial no-play state instead of an indefinitely loading board.
- Request handling now serves the last aggregate snapshot, or an explicit
  empty live state on a cold isolate, while `waitUntil` refreshes providers in
  the background. The public cold request returned immediately and the next
  poll reached connected PropLine/Odds-API.io data.
- The latest timeout-safe client is Maxxtopia commit `6a054bf`, deployed by
  GitHub Actions run `31760559131`. The public 390x844 check reached LIVE DATA,
  showed no replay labels, kept 375px document width inside the 390px viewport,
  and kept visible controls at 44px or larger. Browser warnings were empty.
- Full Betmaxxing checks passed: live/provider/context fixtures, math, ledger,
  lint, TypeScript, and production build.

The key supplied in chat was used only as a server-side Worker secret and is
not present in the client or repository. Because it appeared in chat, rotate
it in the provider dashboard before treating the deployment as credential-safe.

## Betmaxxing provider guardrails and visual publish - 2026-08-12

- Rebuilt the source client after adding free-tier-safe provider cadence,
  stale-line rejection, and the Maxxtopia cosmic purple/cyan/lime visual
  refresh.
- The new static client is ready for publication at
  `https://maxxtopia.com/betmaxxing/`.
- The client remains fail-closed until a separate server-side gateway is
  deployed and configured with newly generated provider keys. No provider key
  is included in this Pages build.
- Only `public/betmaxxing/` and this continuity note are in scope for this
  release; unrelated Maxxtopia working-tree changes remain untouched.
- Next live-data gate: deploy the gateway, add regenerated secrets there,
  rebuild with its public API origin, then verify real provider-backed markets
  and verified sportsbook links.

## Betmaxxing live-mode UI publish — 2026-08-12

- Replaced the public `public/betmaxxing/` entrypoint and hashed assets with
  the validated Betmaxxing `0.2.0` live-mode client build.
- Public route: `https://maxxtopia.com/betmaxxing/`.
- The published client is fail-closed: it no longer shows replay/paper mode or
  synthetic odds, and it will show a provider configuration/error state until
  `VITE_LIVE_API_BASE_URL` points at a deployed gateway with permitted provider
  credentials. This static Pages route does not contain provider secrets.
- Source checks passed before publish: live gateway and provider fixture tests,
  math tests, TypeScript, lint, production build, and desktop/mobile browser
  verification.
- Only `public/betmaxxing/index.html`, its two current hashed assets, and this
  continuity note are in scope. Existing unrelated Maxxtopia worktree changes
  remain untouched.
- Next production gate: deploy the separate live gateway, configure its secret
  provider keys and CORS, rebuild with its public base URL, then publish the
  client again and verify a real provider-backed deep link.

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

## Betmaxxing edge-first release - 2026-08-14

- Published the generated client from the Betmaxxing source workspace into
  `public/betmaxxing/` with commit `75c73c1`.
- GitHub Actions Pages deploy run `31865822465` completed successfully.
- The live route is `https://maxxtopia.com/betmaxxing/`; its entrypoint and
  hashed client asset returned HTTP 200 after deployment.
- The release keeps the public board fail-closed: only fresh,
  sharp-referenced positive edges reach the opportunity surface, while the
  broader game catalog remains available for lookup. Empty data shows the
  edge-scan state rather than dead rows.
- Desktop and 390x844 public browser checks passed with no horizontal overflow,
  hidden desktop rail/inspector on mobile, working Settings contract toggle,
  and no replay/paper language. The separate Worker is live at
  `https://betmaxxing-api.maxxtopia.workers.dev`.
- Only the three Betmaxxing route files were staged. Existing unrelated dirty
  and untracked Maxxtopia work remains preserved.
