# Continuity checkpoint: Maxx Bot live Finals points and Chapter 7 storm release

Date: 2026-08-29
Scope: recovery and completion of the later Maxx Bot/SnipeMaxxer work that
grew out of the failed Codex task titled `Fix repeated viewmaxxing title`.

## Authoritative worktrees

Bot release tree:
`C:\Users\Diggy\Documents\Codex\2026-08-27\why-is-this-appearing-on-every\work\maxxtopia-storm-points-release`

Source Worker release tree:
`C:\Users\Diggy\Documents\Codex\2026-08-27\why-is-this-appearing-on-every\work\snipemaxxer-finals-prize-release`

The main checkout at `C:\Users\Diggy\projects\maxxtopia` was dirty before this
work and was not edited, reset, cleaned, staged, pushed, or deployed from. The
main checkout at `C:\Users\Diggy\projects\snipemaxxer` also contained broad
unrelated WIP; this session touched only the untracked Storm calculator/test
files, the targeted Storm UI block, and the targeted Storm resilience note.
Those changes remain uncommitted alongside the pre-existing WIP and must not
be reset, cleaned, or broadly staged.

## Goal and completed behavior

The goal was a safe private `/points live` Discord utility that works across
regions, distinguishes qualifiers from Finals, and shows a trustworthy prize
race while a tournament is still running. It must use the exact Epic event,
window, region, and identity; accept a 32-character Epic account ID when a
console/platform alias is not an Epic display name; fail closed instead of
guessing; keep command results private; and avoid notifying a Discord channel.

The source Worker now provides `/windows?region=` and
`/standing?ign=&accountId=&eventId=&windowId=&region=`. Finals use Epic's
published paid-rank ladder and read the current points at those ranks from the
same event/window/region. The bot displays current rank/points, current paid
band, next paid band, points gap, and required points per remaining game when
the boundary is verified. A top paid band correctly says there is no higher
paid tier. It never substitutes another region, an older tournament, or an
opaque reward id as a currency amount.

The supplied Kinch Analytics Chapter 7 Season 1 Comp tables were also applied
to both Storm consumers: Maxx Bot's `/storm` and the Snipemaxxer desktop Storm
tab. Battle Royale now uses the supplied 60-second opening wait and cumulative
phase totals through 1,350 seconds; Reload uses the supplied 0-second opening
wait and totals through 1,080 seconds. The blank early damage cells are shown
as a labeled `0 DPS` reference baseline with an in-game override. Radius,
movement speeds, distance, and Surge columns remain informational because
neither current Storm surface has map/player-distance/lobby inputs to model
them honestly.

## Current release state

Source code/documentation commit: `8625666` (`docs: record live lookup abuse
boundaries`) on branch `codex-finals-prize`; the source release tree is clean.
Source deployed Worker version: `1b1afb89-8f63-4048-a413-755bd2a021cb` at
`https://snipemaxxer-brain.maxxtopia.workers.dev`.

Bot release tree is detached at `c129ba3` (`docs: record private utility panel`)
with the Chapter 7 storm implementation intentionally uncommitted in
`scripts/test-storm-command.mjs`, `tickets-worker/README.md`,
`tickets-worker/panel.js`, and `tickets-worker/storm-calculator.js`. The prior
abuse-guard release is included in its history at `cef3e11`; the prior bot
visual release is included in its history at `9fdc540`.
Bot deployed Worker version: `4a373497-31fe-49cf-add6-5793f41fa834` at
`https://maxxtopia-tickets.maxxtopia.workers.dev`.

The seven-command Discord schema is live and already matches the release
source: `/storm`, `/points`, `/gen`, `/om`, `/33`, `/founderstatus`, and
`/sccoins`. `/storm` exposes `zone`, `phase`, `time`, `damage`, `mode`, and
`dps`; `/points` exposes the live/manual options. No replacement command PUT
was needed during the final read-back. No public announcement, notification,
or unrelated ticket-panel edit was sent.

## Discord channel surface

The existing `#free-stuff` text channel (`1519790996559364307`) remains in the
existing `— maxxtopia —` category. Its topic is now `Free Maxxtopia tools and
private Fortnite tournament lookups. Use /points or /storm. Results are
private.` The separate later caption message `1519794106233262193` containing
`Viewmaxxing, as it looks now` was removed at Diggy's request. The original
Viewmaxxing app preview post `1519790997595226315` was verified present and
unchanged, including its components and silent-message flag.

A silent instruction panel `1543352185092444191` is now live. Its title is
`🎮 MAXX DESK // PRIVATE TOOLS`; it has three explanatory fields, the invisible
panel signature, four buttons (`Live tournament points`, `Manual points pace`,
`Storm · BR`, and `Storm · Reload`), no mentions, and message flag `4096`
(`SUPPRESS_NOTIFICATIONS`). The original Viewmaxxing preview post remains
outside the panel publisher's edit scope.

The channel is now genuinely read-only for ordinary members: the `@everyone`
overwrite is allow `1024` / deny `377957124160`, so `SEND_MESSAGES` is denied.
Slash commands and button/select/modal interactions still work because they are
Discord interactions and do not require ordinary message creation. The exact
temporary AutoMod rule `1543354527045132308` (`free-stuff | commands only`) was
removed only after the read-only overwrite was verified. No instant-delete
listener is needed or present; ordinary messages cannot be sent in the first
place, and the panel responses remain ephemeral.

## Verification evidence

Passed in the bot release tree:

- `node scripts/test-storm-command.mjs`
- `node scripts/test-points-command.mjs`
- `node scripts/test-points-live.mjs`
- `node scripts/test-worker-interactions.mjs`, including regular-user 30-second
  and signed `@VIP`-role 5-second live lookup throttling
- `node tools/test-storm-calculator.cjs` in the main Snipemaxxer checkout
- `node --check renderer/storm-calculator.js`
- `node --check renderer/app-shell.js`
- syntax checks for the changed Worker modules
- `git diff --check`
- `npm run build` (Astro static build, 27 pages)
- `npx wrangler deploy --config wrangler.toml --dry-run` from `tickets-worker`
- `npx wrangler deploy --config wrangler.toml --dry-run` from the source Worker
  release tree

The final live Discord read-back returned HTTP 200 for the `#free-stuff`
channel, the panel, the original Viewmaxxing preview post, the guild commands,
and AutoMod rules. The old caption message is HTTP 404/absent; the original
preview still has its original author, embed, three components, attachment,
and flag `4096`. The panel has the four expected custom IDs and its invisible
signature. The command list contains exactly seven commands, including
`/points` and `/storm`. The read-only overwrite confirms
`sendMessagesAllowed=false` and `sendMessagesDenied=true`; the temporary rule
is absent, leaving only the unrelated mention-spam rule.

The fresh post-deploy source check returned HTTP 200 and `partial=false` for
`/windows?region=EU`, with three returned windows including a Finals entry
with nine payout-ladder bands. At the instant of this final read-back the
returned sample windows were not marked `live`; event/window availability and
standing values can move between checks and the UI re-checks the exact window
before submission. An earlier same-session exact identity check resolved the
three supplied names in the EU Finals board: `xset clix 1x.` rank 45 / 30
points, `XSET ØØ8` rank 45 / 30 points, and `T1 darmboss` rank 2 / 299 points.
Those rank and boundary values were live snapshots, not fixed claims.

The deployed bot rejects a GET with `404 not found`, an unsigned POST with
`401 missing signature`, and an invalidly signed POST with `401 bad signature`.
The real valid Discord interaction/rendered embed test is still owed by Diggy.

## Abuse and isolation boundary

`/points live` now has a 30-second per-Discord-user cooldown for regular members,
a 5-second cooldown for members carrying the configured `@VIP` role, and a
16-request per-Worker-isolate in-flight cap. The VIP decision uses Discord's
signed member-role payload. The guard is in memory and intentionally does not
reuse `TICKETS_RATELIMIT`, so points refresh spam cannot consume ticket/VIP KV
capacity. A signed malformed payload returns `400 invalid body` before any
command work.

This is a normal-abuse burst guard, not global DDoS protection. A distributed
caller can still hit the public source `/windows` or `/standing` routes, and
Worker isolates do not share the in-memory map. The next hardening layer is an
independently scoped Cloudflare WAF/rate-limit rule for those live lookup
routes. Do not attach that traffic to the ticket KV namespace without a
separate capacity decision. Existing ticket/admin routes retain their own
Diggy gate, ticket KV limiter, bot-token path, and private-thread behavior.

## Kinch Analytics reference audit

The public invite preview exposed the server name `Kinch Analytics` and a
large public member/online count, but it did not expose the channel list or
channel messages. The available browser was not logged into Discord. No
account was created, no login was attempted, and the server was not joined.
Therefore this is a public positioning/features audit, not a channel-by-
channel audit.

Publicly advertised ideas worth considering for Maxx Bot are a clear
`#start-here` onboarding path, private tournament-stat lookups, region-aware
live cumulative standings, damage/elimination-style stat snapshots, and a
separate premium surface for deeper drop-spot or strategy analysis. The
third-party premium page also advertises point estimates and drop-spot
contestedness/survival analysis, but its accuracy and current price claims are
marketing claims, not verified product evidence. We should only add those
features after sourcing reliable data and labelling estimates as estimates.

The strongest transferable idea is information architecture: one onboarding
surface, one private lookup flow, explicit region/event/window provenance, and
optional deeper analytics. No Kinch channel structure was copied because it was
not publicly inspectable.

## Kinch-style panel rollout

The isolated bot release tree now contains a code-native version of the useful
Kinch interaction pattern: a persistent read-only panel in `#free-stuff`,
private button/select interactions, and modal forms whose results remain
ephemeral. The panel has four controls: live tournament points, manual points
pace, Storm BR, and Storm Reload. Live points intentionally uses region first,
then a freshly fetched exact live-window menu, then a three-field modal for
Epic identity, games left, and optional safety cushion. The submit re-fetches
the selected `windowId`, derives its exact `eventId`, and queries the same
region/window; it does not trust a stale label or substitute another region.
Qualifiers and Finals are labelled differently in the menu, with Finals using
the existing live prize-race result path.

Changed files for this local milestone are `tickets-worker/panel.js`,
`tickets-worker/points-live.js`, `tickets-worker/worker.js`,
`scripts/post-free-stuff-panel.mjs`, and the focused interaction/live tests.
The publisher is dry-run by default and targets only the known guide message;
the original Viewmaxxing preview remains outside its search and edit scope.

The approved rollout is complete in this order: Worker deploy, silent panel
update, read-only permission restore, AutoMod workaround removal, and a
read-back after each boundary. No Git push, public Discord message, or desktop
package release was performed.

The panel's live-window refresh is also guarded at five seconds per Discord
user, independently of the final live-points cooldown and ticket/VIP KV
limiter, so repeated select clicks cannot create an unbounded `/windows` proxy.

## Separate status claims

- Local: yes; the bot release tree contains the intended Chapter 7 changes,
  while the source Worker release tree is clean and the main Maxxtopia and
  Snipemaxxer checkouts retain their unrelated dirty/untracked WIP.
- Built: yes; the post-edit Astro build completed 27 pages and both Worker
  dry-runs completed successfully.
- Tested: yes; syntax checks, storm and manual-points fixtures, live exact-window
  and Finals prize-race fixtures, signed interaction fixtures, the panel
  publisher dry run, the main Snipemaxxer Storm fixture, and `git diff --check`
  all passed. Real Discord interaction rendering remains owed.
- Committed: source Worker yes through local commit `8625666`; the bot panel
  milestone is in local history at `5589a84`, but the Chapter 7 bot storm
  changes are intentionally uncommitted. The main Snipemaxxer Storm changes
  are also intentionally uncommitted because that checkout contains broad WIP.
- Pushed: no.
- Registered: yes, silently; the live seven-command schema already matched the
  source, so no registry mutation was needed in the final pass.
- Deployed: source Worker version `1b1afb89-8f63-4048-a413-755bd2a021cb` and
  bot Worker version `4a373497-31fe-49cf-add6-5793f41fa834` are deployed;
  Maxxtopia site and Snipemaxxer desktop package have no new deployment.
- Verified live: both Worker deployment records, source `/windows`, bot
  rejection paths, the silent panel, exact command registry, read-only channel,
  absent AutoMod workaround, absent old caption, and unchanged Viewmaxxing
  preview are verified. A real regular-user button/select/modal interaction,
  real Discord message-block observation, and desktop/in-game Storm validation
  remain owed.

## Diggy-owed tests and next action

Click each panel control as a regular member, choose one currently live
qualifier and one currently live Finals event if available, visually inspect
the private results, and test a console/platform identity with the Epic account
ID fallback if its display name does not resolve. Confirm ordinary members
cannot send a normal message in `#free-stuff` while panel interactions still
work. In Snipemaxxer, compare one BR and one Reload result with the actual
in-game countdown/tick; the supplied table is a reference, not a live feed.
For a true Kinch channel-by-channel comparison, provide authenticated channel
screenshots/export or explicitly approve a live Discord login/join flow.

Single best next action: perform one real regular-user `Storm · BR` or `Storm ·
Reload` button/modal test, then one `/points live` test with a currently active
exact event and Epic account ID, and report the rendered result.

Single best next action: finish local verification and review the isolated diff;
then, if the panel looks right, approve the four-step live migration rather
than changing the live channel while the new Worker is unverified.

## Feedback review wall — 2026-08-29

Diggy asked to make the feedback surface look like the supplied review-card
reference, then clarified that the existing Forum post should be converted in
place. Discord does not convert a Forum channel into a text channel, so the
safe implementation keeps parent channel `#feedback` (id
`1502867387962101812`), preserves its existing Forum post (id
`1539270897024897075`), and renames that post from `good` to `reviews`.

The live post now contains one bot-owned instruction message (id
`1543374157616783420`) with the `/review` instruction. It was posted with
message flag `4096` (`SUPPRESS_NOTIFICATIONS`) and no allowed mentions. The
parent Forum's @everyone overwrite remains read-only (`allow=1024`,
`deny=0`), and the post is active and unlocked. No user content was deleted or
edited.

New local files are `tickets-worker/reviews.js`,
`scripts/test-review-command.mjs`, and
`scripts/post-feedback-review-wall.mjs`. `tickets-worker/worker.js` now opens
a private three-field modal for `/review`, validates and sanitizes the input,
posts one compact teal review embed into the existing post, adds the small
acknowledgement reaction, and edits the submitter's ephemeral response. Public
review messages use `SUPPRESS_NOTIFICATIONS` plus
`allowed_mentions: { parse: [] }`; all errors and acknowledgements are
ephemeral. The route accepts the parent Forum or the `reviews` post as the
command surface, but always publishes to the configured post. The post is
re-opened if Discord auto-archives it; manually locked posts remain closed.

Review abuse guards are intentionally separate from points/VIP limits: four
in-flight submissions per Worker isolate and one submission per user per ten
minutes per isolate. This is a burst safeguard, not a distributed DDoS
boundary. No fake/sample review was posted.

The guild command registry now has eight commands, including `/review` (id
`1543374455399649383`); existing commands were preserved. The Worker deploy
completed at `https://maxxtopia-tickets.maxxtopia.workers.dev` as version
`25ae956d-d44a-4d31-9270-20e07256b609`. Live read-back confirmed the parent
channel type/name, post name/parent/active state, instruction content and
silent flag, and the command registry. The Discord command response itself and
the finished review card still need one real member test.

Checks completed: review unit fixtures, JavaScript syntax checks, Worker
Wrangler dry-run, publisher dry-run, guild command dry-run, live Discord
publisher execution, command registration, live channel/message/permission
read-back, and `git diff --check`.

Git state: no new commit and no push. The release worktree still contains the
prior intentional uncommitted Chapter 7 changes and unrelated user WIP; do
not broad-stage or reset it. The main Maxxtopia and Snipemaxxer checkouts were
not modified by this review-wall task.

Diggy-owed gate: from an ordinary Discord account, run `/review` inside the
`#feedback` → `reviews` post, submit one honest review, confirm the card,
avatar thumbnail, stars, reaction, and absence of a channel notification on
desktop/mobile. If the visual card needs refinement, edit only the review
formatter and preserve the silent/read-only contract.

Single best next action: complete that one real `/review` submission and
visual notification check; do not create a sample review from the bot.

## Maxx Bot utility UX hardening — interrupted-task recovery (2026-08-29)

Diggy asked to ship the Discord changes silently, remove confusing manual
inputs from the ordinary Fortnite path, make Storm timing preset-driven, hide
raw live-feed errors, and keep only the newest private Maxx utility result per
user. The safe public surface remains the existing read-only `#free-stuff`
guide message; its first message and Viewmaxxing preview are not edited or
deleted.

The current local Worker changes are in `tickets-worker/panel.js`,
`tickets-worker/worker.js`, `tickets-worker/points-live.js`,
`tickets-worker/storm-calculator.js`, and the matching focused fixtures and
README. The guide now has three visible entry points: Live tournament points,
Storm BR, and Storm Reload. Storm uses four private select menus for zone,
waiting/closing phase, time-left preset, and accumulated-damage preset. Manual
points pace and DPS override remain only as slash-command compatibility paths;
the visible panel does not ask a normal player to understand either one.
Finals/qualification exact-window behavior and all supported regions remain
unchanged. A live-window 404/5xx/429 is now a private friendly retry state with
no raw status or upstream body. A per-isolate, best-effort webhook cleanup
retires the previous private Maxx utility reply when the user starts another;
the newest result remains available until the next utility interaction or
Discord's normal ephemeral expiry. Cleanup never touches tickets, reviews, or
public channel messages.

Before the live boundary, JavaScript syntax checks,
`node scripts/test-worker-interactions.mjs`,
`node scripts/test-points-live.mjs`, `node scripts/test-storm-command.mjs`,
`node scripts/test-review-command.mjs`, `git diff --check`, and `npm run build`
passed. The site build produced 27 pages. The source Worker `/windows` route
returned HTTP 200 for NAC, EU, NAW, BR, ASIA, OCE, and ME; the current response
had no live windows because the observed events had ended. These are source
and fixture checks, not proof of a real Discord member click.

Current state at this checkpoint: local changes present in the detached bot
release tree; current UX changes not yet committed or pushed; the already
deployed bot version is the previous `25ae956d-d44a-4d31-9270-20e07256b609`
until the next deploy; no new public Discord message has been sent. The
authorized next boundary is to review the focused diff, deploy only
`tickets-worker`, silently edit the known guide message with the new panel,
read it back, then create a dedicated branch and push only the intended bot,
Worker, fixture, and runbook files. Do not deploy the site, register commands,
change channel permissions, edit the original Viewmaxxing post, or stage
unrelated site/package/TypeScript/review-WIP files.

Remaining risks and human gates: Worker-isolate memory makes old-ephemeral
cleanup best-effort across isolates; no platform callback reliably tells the
Worker that a user closed a Discord tab; and one regular-member Discord click
through each Storm wizard plus one currently-live exact-window points lookup
are still owed. In-game Storm timing must be compared against the supplied
Chapter 7 tables on both BR and Reload.

Single best next action: deploy the tested Worker, silently refresh the known
`#free-stuff` guide message, and verify the new message payload before pushing
the focused branch.
