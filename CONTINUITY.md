# Maxxtopia continuity addendum

## Viewmaxxing mobile catalog and movie expansion - 2026-08-19

- Added a public Updates card for the Viewmaxxing phone navigation and movie
  expansion. The copy stays bounded to verified behavior and does not promise
  permanent third-party provider health.
- The Viewmaxxing release is deployment `438f4447.viewmaxxing.pages.dev`, live
  behind `https://view.maxxtopia.com/`. The local app and public domain both
  show four phone-sized section controls: All Library, Movies, TV Shows, and
  Anime. The live phone check confirmed each control changes the selected
  section and catalog heading.
- The catalog adds Obsession, Backrooms, Sinners, One Battle After Another,
  and A Minecraft Movie, plus adjacent Venom and Teenage Mutant Ninja Turtles
  film entries. The TMNT Out of the Shadows poster and backdrop were corrected
  after a release-time HTTP image check found the earlier paths invalid.
- Local native playback checks reached an advancing video for Obsession,
  Backrooms, Venom (2018), Teenage Mutant Ninja Turtles (2014), One Battle
  After Another's Prime English-original fallback, and Venom: The Last Dance.
  The live public check explicitly clicked Play for Obsession; the player
  stayed on the custom domain, rendered no iframe, opened no second tab, and
  changed frames over time. Captions remained off by default for English or
  English-original playback.
- `npm run build` and `git diff --check` passed in the Viewmaxxing workspace.
  Provider routes remain a release-window check: upstream URLs, quality, and
  availability can drift, so the app keeps the native resolver fail-closed and
  does not label non-English, CAM, or popup-bearing routes as healthy.
- Unrelated Maxxtopia tracked and untracked work remains preserved. Best next
  action: verify the public `/updates/` card after the normal GitHub Actions
  deployment and leave provider health monitoring separate from catalog copy.

## Viewmaxxing popup-free playback update - 2026-08-19

- Added one public Viewmaxxing Updates card describing the native, popup-free
  playback path, English-Dub-first anime behavior, retry handling, and CAM-only
  labeling. The copy intentionally avoids promising permanent upstream health.
- `npm run build`, changelog JSON parsing, and `git diff --check` passed before
  release. The live `/updates/` page returned HTTP 200 and rendered the new
  card first with no captured warning or error logs.
- Published commit `2c2e260` through GitHub Actions run `32213352694`; the
  normal `main` to Cloudflare Pages deployment completed successfully.
- Only `src/data/changelog.json` was staged and committed. Existing unrelated
  dirty and untracked work in this repository remains preserved.

## Dropmaxxer Drop Window hero - 2026-08-18

- Replaced the generic product hero on `/dropmaxxer/` with a bespoke 3D
  "Drop Window" presentation in `src/components/DropmaxxerHero.astro`.
- The hero uses the real Dropmaxxer flight-plan capture as a tilted map board,
  adds an extruded 3D frame, moving bus/glider markers, jump/cut/target labels,
  and separate Fastest versus Safe route readouts. The route switch is
  keyboard-accessible and changes the visible emphasis without leaving the
  page. Pointer movement adds a bounded board tilt; the core animation remains
  present for Windows users who report reduced motion because it communicates
  the product decision.
- `src/pages/[slug].astro` now renders the bespoke hero and keeps the real
  `dropmaxxer.pages.dev` click-to-load embed directly beneath it. The existing
  feature zones and walkthrough remain unchanged. `src/data/products.ts` gives
  Dropmaxxer the secondary amber accent `#ffb454`; `src/styles/global.css`
  exempts the new hero from the shared animation kill switch.
- Local verification passed: `npm run build` generated all 26 pages twice,
  `git diff --check` passed, the local desktop route had one hero and one live
  embed with no horizontal overflow, the route switch changed `aria-pressed`
  and `data-route`, pointer tilt changed the 3D CSS variables, and the browser
  recorded no warnings or errors.
- Responsive note: the Dropmaxxer hero itself fits at 390x844, but the shared
  site header still reports the known pre-existing 442px document width at a
  390px viewport. That shell issue was not changed in this focused page pass.
- Release state: commit `f613fa2` is pushed to `main`; GitHub Actions run
  `32133022435` deployed it to Cloudflare Pages successfully. The live
  homepage and `/dropmaxxer/` route returned HTTP 200, and the flight-plan
  hero asset returned HTTP 200. Live desktop and 390x844 browser checks
  showed the new hero, a clean console, working Fastest/Safe route switching,
  and responsive hero bounds. Pointer movement changed the 3D tilt variables.
- The known shared mobile header issue still reports a 442px document width at
  a 390px viewport; it is outside this focused hero release and remains
  unchanged. Unrelated tracked and untracked work in this repository remains
  preserved. Best next action: treat any mobile shell correction as a
  separate, approval-gated pass.

## Suite-wide Updates feed audit - 2026-08-18

- Compared `src/data/changelog.json` against the public Maxxtopia routes and
  the newest verified release notes. Added two same-day entries for
  Playlistmaxxing's bounded YouTube-stall recovery and a deliberately vague
  Aimmaxxer lab note with no version or private implementation details.
- Existing current entries already covered the latest public Viewmaxxing,
  AdBlock-Maxxer, Discordmaxxer, Snipemaxxer, Streammaxxing, and Maxxtopia
  releases. Unreleased Clipmaxxer work, non-site projects, and private
  Aimmaxxer specifics were excluded from concrete product copy.
- Evidence used for the additions: Playlistmaxxing commit `d8372ed` with live
  `music.maxxtopia.com` markers. The Aimmaxxer entry is intentionally not
  versioned and does not describe its local/private build. Concrete
  Betmaxxing and Dropmaxxer entries were intentionally left out per scope.
- Local verification passed: `src/data/changelog.json` parsed cleanly,
  `npm run build` generated all 26 pages, and the local Updates route rendered
  102 newest-first cards at desktop and 390x844 with no browser warnings or
  errors. The existing shared mobile header remains the only 442px document
  width issue; the new update cards themselves fit within the phone frame.
- Release state: commit `e280511` is pushed to `main`; GitHub Actions run
  `32134686098` deployed the final feed to Cloudflare Pages successfully. The
  live `/updates/` route returned HTTP 200 and the live browser rendered 102
  cards with Playlistmaxxing and the vague Aimmaxxer note present, no
  Betmaxxing or Dropmaxxer cards, and no console warnings or errors. The
  existing shared mobile header remains the only 442px document width issue.
- Unrelated tracked and untracked work remains preserved.

## Updates-page reconciliation - 2026-08-18

- Compared the existing `src/data/changelog.json` against the recent public
  suite work. Added five curated entries for the Maxxtopia pointer pass,
  Viewmaxxing v0.4.102, Snipemaxxer v0.2.9, Streammaxxing v0.1.57, and
  Playlistmaxxing preview recovery. Private Aimmaxxer and Betmaxxing work is
  intentionally excluded. Existing AdBlock-Maxxer v1.6.11 and Discordmaxxer
  v0.7.61 entries were already present and were not duplicated.
- Public checks confirmed the Snipemaxxer updater reports 0.2.9, the
  Streammaxxing signed manifest reports 0.1.57, and the Viewmaxxing v0.4.102
  release is published. Copy stays bounded to verified behavior; no
  physical-device playback or real-game FPS claim was added.
- Local `npm run build`, JSON parsing, `git diff --check`, and the desktop
  browser check passed. The Updates page rendered 100 newest-first entries,
  had no console logs, and had no desktop horizontal overflow. The 390x844
  check exposed a pre-existing shared-header issue: desktop-only product
  buttons still render at mobile width and extend the header to 442px. It is
  outside this changelog pass and remains unchanged because the header is an
  integral shell surface.
- Current release state: commit `17e289d` is pushed and GitHub Actions run
  `32116488738` deployed the public Updates page successfully. The live
  `/updates/` route returned HTTP 200 and the desktop browser check showed all
  five public additions with zero Aimmaxxer or Betmaxxing entry cards. The
  shared mobile header overflow remains a separate, unapproved shell fix.

## Shared interaction responsiveness pass - 2026-08-18

- Diagnosed the shared shell interaction path after a live and local browser
  check. The static homepage and product route returned HTTP 200 with no
  browser warnings; direct route CTA navigation completed locally in about
  138 ms. The sluggish feel was concentrated in cosmetic pointer effects and
  in-page anchor motion, not the static route or the product hero content.
- Updated only `src/components/CustomCursor.astro`,
  `src/components/MagneticAndTilt.astro`, and `src/styles/global.css`:
  tightened the cursor ring lerp from 0.22 to 0.36, stabilized hover state
  across nested SVG/text nodes, cached pointer target rectangles, removed
  transform-transition chasing during active magnetic/tilt input, moved the
  apps spotlight as a bounded compositor layer, and changed in-page anchor
  scrolling to immediate behavior.
- The integral bespoke hero canvas/video presentation was not changed. The
  Optimizationmaxxing route still rendered its animated canvas and six paused
  lazy metadata videos with no horizontal overflow or console warnings.
- Local verification passed: `npm run build` generated all 26 pages, `git diff
  --check` passed, desktop cursor and CTA checks passed, and local product
  route checks were clean. The scoped changes were committed as `6edfe41` and
  pushed to `main`. GitHub Actions deployment `32113816372` succeeded; live
  homepage and product-route HTTP checks returned 200, and the live browser
  showed the immediate cursor dot, tighter ring settling, and no console logs.
  The Optimizationmaxxing hero remained unchanged.
- Diggy-owned gate: review the cursor feel on a real mouse and choose whether
  to keep the tighter ring plus immediate anchor jumps. If the hero animation
  itself still feels heavy, that is a separate approval-gated change because
  it is integral product presentation.

## Betmaxxing focused game answer and 1102 guard - 2026-08-15

- Published the matching client bundle from
  `C:\Users\Diggy\Documents\Codex\2026-08-10\you-are-an-elite-quantitative-sports\outputs\Betmaxxing`.
- The Worker is now version `ab42f36a-9550-4b03-84e6-f0acc51ed09d` at
  `https://betmaxxing-api.maxxtopia.workers.dev`. The focused
  `Royals Angels` route returned HTTP 200 with one matched game, 350 bounded
  lines, a `GAME ANSWER` summary, six player-prop rows, and connected PropLine
  and Odds-API.io sources. The normal health route recovered to both providers
  connected after its background refresh.
- The focused path now avoids the Cloudflare 1102 boundary by limiting each
  provider to one matching event/detail, reusing official-data context during
  the focused request, coalescing identical lookups, and using edge cache key
  version `v7`. The summary keeps “most likely” separate from “best price” and
  remains market-derived rather than claiming a guaranteed result.
- Static release artifacts are the hashed Betmaxxing assets referenced by
  `public\betmaxxing\index.html`; build and public API checks passed before
  publication. The remaining human gate is an actual iPhone Safari portrait
  check, because desktop browser emulation cannot prove the physical device
  experience.
- A client-only follow-up now makes the top status pill follow the focused
  game's live/degraded state instead of inheriting the background slate label.
  The new client asset is `index-o7x1WNwj.js`; it passed the client type check,
  lint, and production build and is included in the same release route.

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

## Loading performance, Updates mirror, and QOTD - 2026-08-19

### Scope and diagnosis

- Investigated the perceived slow loading on Maxxtopia and its linked product
  apps. The main causes are remote third-party media, browser lazy loading,
  several multi-megabyte image assets, and navigation that waits on a page
  before showing all of its content. This is a real first-load/cold-cache cost,
  not evidence that the whole site is CPU-bound.
- Viewmaxxing currently requests many TMDB and AniList posters lazily. The
  first visible cards can be prioritized, but the remaining lineup still waits
  on those providers and the user's network.
- Playlistmaxxing artist art is loaded as CSS background images from provider
  URLs, and Dropmaxxer still depends on the remote Fortnite API map image on a
  cold cache. Both apps already have visual fallbacks; real-device retesting
  remains required after their own deployments.

### Implemented locally

- Viewmaxxing: prioritized the first six posters, switched TMDB poster requests
  to the smaller `w342` variant, added provider preconnects, and kept the
  existing user-owned status-badge edits intact.
- Maxxtopia: added same-origin hover/focus prefetching for sidebar navigation,
  made Viewmaxxing hero rotation wait for a loaded frame, replaced the four
  eager 40px vinyl images with local WebP thumbnails, and added a smaller
  Dropmaxxer embed poster.
- Updates: added stable article IDs, product-specific accent handling, the
  `updates.json` feed, and matching version metadata for Viewmaxxing and
  Snipemaxxer. Snipemaxxer is now represented as `0.2.9` with the matching
  `0.2.9` installer URL in source.
- QOTD: desktop opens expanded on visit; mobile keeps the existing collapsed,
  expandable behavior.
- Discord: added the tracked `scripts/sync-updates-discord.mjs` mirror and
  `.github/workflows/discord-updates.yml`. The mirror uses the exact feed text,
  version, date, accent color, and canonical update link, while suppressing
  mentions and notification pings.

### Verification and current state

- Maxxtopia `npm run build` passed and generated `/updates.json`, colored update
  cards, stable anchors, optimized assets, and the prefetch script.
- Viewmaxxing `npm run build` passed. The existing Vite chunk-size warning is
  informational and the build exited successfully.
- The Discord dry run passed. The live Maxxtopia server now has read-only
  `#updates` in the `-- maxxtopia --` category (channel ID
  `1539778536838004848`), seeded with the 25 newest updates from the local
  built feed. The creation and posts were silent; no member mentions or
  server-wide notification messages were sent.
- The live feed endpoint was not yet published during this session, so
  `https://maxxtopia.com/updates.json` returned 404. The GitHub workflow will
  begin automatic mirroring only after the site changes are published and the
  repository secrets `DISCORD_BOT_TOKEN` and `DISCORD_GUILD_ID` are configured.
- No commit, push, Cloudflare deployment, GitHub workflow publication, or
  external site deployment was performed. Existing dirty and untracked work
  in Maxxtopia, Viewmaxxing, Discordmaxxer, Playlistmaxxing, and Dropmaxxer was
  preserved; do not stage the whole worktree.

### Remaining human gates and next action

- Publish only the scoped Maxxtopia files after review, then verify the live
  desktop and mobile navigation, QOTD behavior, Updates colors/versions,
  Viewmaxxing lineup, Playlistmaxxing popout art, and Dropmaxxer map on a cold
  browser cache. Confirm the live endpoint before enabling the GitHub mirror.
- Configure the two Discord workflow secrets and run the workflow once after
  publication. Check that a newly added update creates one silent embed and
  that reruns do not duplicate it.
- If external image latency remains noticeable after that pass, the next
  structural improvement is to proxy/cache allowed artwork through a stable
  image CDN or product-owned asset pipeline rather than increasing eager
  loading.

## Update copy style feedback — 2026-08-20

- For Maxxtopia Updates, use the 2026-06-28 entries as a direct reference:
  title = the release hook, body = a concise outcome-focused subheading, and
  bullets = distinct fixes that explain what changed and sometimes why.
- Lead with the largest quality-of-life or feature improvements. Cosmetic
  polish, attribution, and small interaction details belong at the end unless
  they are the release's main purpose.
- Do not repeat one small change in the title, body, and several bullets. Use
  one clear mention and spend the remaining space on the other meaningful work
  in the release.
- The local Streammaxxing v0.1.58 entry was rewritten using this format. It is
  not republished yet; production publication still requires review and
  explicit approval.
- Verification for the rewrite passed: changelog JSON parsing, `git diff
  --check`, and `npm run build` (26 pages).

## Updates accent and version audit — 2026-08-20

- Audited all 107 local Updates cards. The ten actual product accent contracts
  are distinct, and the version pill already inherits the same accent as the
  card border/product label/bullets. Rendered QA found zero version-color
  mismatches and no console warnings.
- Suite-level `Maxxtopia` notes now use a neutral slate accent
  (`#cbd5e1`) instead of falling back to Optimizationmaxxing's magenta. The
  product palette itself was not changed.
- Added a build-time guard in `src/data/changelog.ts` for duplicate product
  accents, missing product accent contracts, and future suite-color collisions.
- One historical card remains intentionally unversioned: the private/pre-release
  Clipmaxxer note. Aimmaxxer now carries the verified live `v0.8.12` release
  version, and the previously unversioned Viewmaxxing, Playlistmaxxing, and
  Maxxtopia cards were assigned documented display versions below.
- Verification passed: `npm run build` generated 26 pages; the local Updates
  route rendered all 107 cards with zero browser console warnings/errors.
- This audit is local only. No Maxxtopia commit, push, or production deploy
  was performed.

## Recent Updates card reconciliation — 2026-08-20

- Reviewed the recent project cards for duplicate or unnecessary additions.
  Substantive Streammaxxing, Viewmaxxing, AdBlock-Maxxer, Playlistmaxxing,
  Snipemaxxer, and Maxxtopia quality-of-life entries remain because they
  describe user-facing work with distinct outcomes.
- The existing Discordmaxxer v0.7.61 card is the reference for small releases
  and already uses the exact standard wording: `Maintenance release —
  under-the-hood fixes and improvements.` No duplicate maintenance cards were
  added.
- Kept the Aimmaxxer lab note at the user's direction and added its verified
  live `v0.8.12` version from the Aimmaxxer release continuity record.
- No new public card was added for the Streammaxxing updater cache repair or
  this Maxxtopia color/copy audit; those are release maintenance and editorial
  housekeeping rather than separate user-facing releases.
- Verification for this reconciliation passed: changelog JSON parsing, `git
  diff --check`, and `npm run build` (26 pages). The feed contains 107 cards,
  including Aimmaxxer `v0.8.12`. This work remains local only; no commit, push,
  or production deploy was performed.

## Updates current-release aura — 2026-08-20

- The Updates aura now follows recency within each project, not release size.
  The newest card for every project receives the active accent treatment even
  when its copy is only `Maintenance release — under-the-hood fixes and
  improvements.` Older versions stay visually quieter.
- The newest overall release receives the slow ambient ooze animation. Current
  project cards keep a softer static aura and an animated accent rail; hover
  and focus remain available for older cards without competing with the current
  release.
- Current version pills also get a smaller, offset accent drip so the chip and
  rail feel connected. Older version pills retain their original plain border
  and background with no extra line or glow.
- The current card's rail now carries a larger faucet-like teardrop: it forms at
  the top of the accent line, travels visibly to the bottom, falls below the
  card, then fades and blurs away. A local `?motion=on` preview override makes
  the animation reviewable even when the browser has reduced motion enabled;
  normal previews still respect that accessibility setting, with the bead
  parked in an accessible static state.
- Strengthened Snipemaxxer's Updates accent from `#ff6472` to `#ff3f69` so its
  coral-red identity reads more clearly while remaining distinct from
  Playlistmaxxing's pink.
- Rendered QA passed with 107 cards: 10 current-project cards, Discordmaxxer
  v0.7.61 active and v0.7.60 calm, and no version-color mismatch. `npm run
  build` generated 26 pages. The preview is local only; no commit, push, or
  production deploy was performed.

## Missing Updates versions filled — 2026-08-20

- Viewmaxxing now uses `v0.4.103`, `v0.4.104`, and `v0.4.105` for the three
  previously unversioned web cards, continuing after the existing `v0.4.102`
  card. The sequence is grounded in the real native v0.4.102-v0.4.104 release
  line; the web-card continuation is a display sequence, not a claim that new
  native tags were created.
- Playlistmaxxing now uses `v0.1.0` through `v0.1.3` in chronological public
  update order. The repository has no release-number system, so this is the
  recommended public update baseline rather than an upstream package version.
- Maxxtopia's existing shell launch remains `v0.1.0`; Discord server live is
  `v0.1.1`, and the later suite-shell quality-of-life card is `v0.1.2`.
- JSON parsing and the local build remain required after these data-only
  changes. No product repository version, tag, commit, push, or production
  deployment was changed.

## Updates drip refinement — 2026-08-20

- Kept the current-release accent rail straight and static. The colored line no
  longer shifts or pulses; only the bead moves through it.
- Reworked the rail bead to begin smaller and slower at the top, grow as it
  travels down, stretch into a fuller drop at the bottom, then fall below the
  card and fade out.
- Replaced the current version pill's thin internal line with a short pooled
  stem and a rounded accent-matched drop. Older version pills remain unchanged
  and plain.
- Mobile route QA also fixed the header's desktop-only product shortcuts
  overriding their responsive `hidden` state, removing a 52px horizontal
  overflow on narrow screens.
- Local browser QA passed with the reduced-motion override enabled: the rail's
  animation is `none`, the bead animation is active, and the local build still
  generates all 26 pages. This scoped Updates-page release is authorized for
  publication through the normal `main` push workflow.
