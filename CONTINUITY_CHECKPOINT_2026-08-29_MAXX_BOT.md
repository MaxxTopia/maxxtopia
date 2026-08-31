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
wait and totals through 1,080 seconds. At this historical snapshot, blank early
damage cells were shown as a labeled `0 DPS` baseline; the 2026-08-31 repair
below supersedes that interpretation by carrying the charts' merged DPS cells
through every covered row. Radius,
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

## Normal review-channel migration — 2026-08-29

Diggy clarified that the existing Forum post should no longer be the live
review surface and asked to convert the legacy `!tonka` review into the
reference embed layout. Discord cannot change a Forum post into a text channel
in place, so the safe migration created the normal text channel `#reviews`
(`1543384589106679871`) in the existing category. It is read-only for ordinary
members (`@everyone` allow `ViewChannel` + `ReadMessageHistory`, deny
`SendMessages`) while `/review` remains available as an interaction.

The migration script `scripts/migrate-feedback-review-channel.mjs` found the
legacy root message by `!tonka` / `tonks.rx` (`1539270897024897075`) and posted
one bot-authored review card (`1543384593439264819`) with the exact text
`used optimization hella good`, a visible `Review by: <@1190553068065005670>`
field, the user's avatar thumbnail, the existing Maxx teal embed styling, a
five-star presentation, a ✅ reaction, `SUPPRESS_NOTIFICATIONS` (`4096`), and
no actual mentions. The original user message was not edited or deleted. Its
Forum post was renamed `reviews-archive` and archived (`locked=false`) so the
old content remains recoverable. The new channel's instruction message is
`1543384596740309164`, also silent and mention-free.

`tickets-worker/wrangler.toml` now sets
`FEEDBACK_REVIEW_CHANNEL_ID=1543384589106679871`. The Worker accepts the new
normal channel (and temporarily accepts the legacy IDs as command surfaces)
but always publishes new cards to the normal channel. It was deployed at
`https://maxxtopia-tickets.maxxtopia.workers.dev` as version
`250cf924-270d-4983-b634-37c5e255a0f5`.

Verification completed after the migration: live Discord REST read-back of
channel type, parent, topic, permissions, card embed, avatar URL, mention
array, reaction, instruction, archived original, and Worker GET `404`; review
unit fixtures; signed Worker interaction fixture including normal-channel
review routing and silent POST/reaction; JavaScript syntax checks; Astro build
(27 pages); Wrangler dry-run; and `git diff --check`. The five-star value is a
legacy formatting inference because the old message contained no numeric
rating or star reaction; the original wording was preserved exactly.

The intended source files were committed locally as `f8e1a21` (`feat: move
review wall to text channel`). The pre-existing unrelated dirty files
`astro.config.mjs`, `package-lock.json`, `package.json`, and `tsconfig.json`
remain untouched and unstaged. No push was performed; the remote branch still
points to the previous release commit.

Diggy-owed gate: run `/review` once from an ordinary Discord account in the
new `#reviews` channel, submit an honest review, and confirm the modal,
rendered card, avatar, reaction, and absence of a notification on desktop or
mobile. No bot-generated sample review should be added.

Single best next action: perform the one real member interaction test, leaving
the unrelated worktree changes and remote branch untouched.

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

Current state at this checkpoint: the tested changes are committed as
`9ad4eba` on `codex/maxx-bot-fortnite-utilities` and pushed to
`origin/codex/maxx-bot-fortnite-utilities`. The Worker was deployed at
`https://maxxtopia-tickets.maxxtopia.workers.dev` as version
`10552096-3e93-4bf5-af06-f53a839c06b4`. The known guide message
`1543352185092444191` in `#free-stuff` was edited in place with the new panel,
`SUPPRESS_NOTIFICATIONS` (`4096`), and no mentions; no new public Discord
message was sent. A live read-back confirmed the three button labels, text
channel, and ordinary-member send denial. The site was not deployed, slash
commands were not re-registered, channel permissions were not changed, the
original Viewmaxxing post was not edited, and unrelated site/package/TypeScript
WIP remains outside the commit.

Remaining risks and human gates: Worker-isolate memory makes old-ephemeral
cleanup best-effort across isolates; no platform callback reliably tells the
Worker that a user closed a Discord tab; and one regular-member Discord click
through each Storm wizard plus one currently-live exact-window points lookup
are still owed. In-game Storm timing must be compared against the supplied
Chapter 7 tables on both BR and Reload.

Single best next action: have one ordinary member click `Storm · BR` or
`Storm · Reload`, complete the guided inputs, and report the rendered private
result; then run one currently-live exact-window points lookup with a real
Epic account ID. No more deployment or command registration is needed for
this milestone.

## Review button — local implementation (2026-08-29)

Diggy reported that ordinary members see the read-only composer in `#reviews`
and asked for the clearer Kinch-style entry point. The review instruction now
includes a silent `📝 Leave a review` button. `REVIEW_BUTTON_ID` routes that
button into the same private three-field modal already used by `/review`; no
second submission path, public input, or notification behavior was added.

Changed files are `tickets-worker/reviews.js`, `tickets-worker/worker.js`,
`scripts/migrate-feedback-review-channel.mjs`,
`scripts/post-feedback-review-wall.mjs`, the two focused interaction tests,
and `tickets-worker/README.md`. The migration updater detects an existing
instruction without the button and edits only that bot-owned message to add
the button and clearer copy. The read-only `@everyone` permission remains
unchanged.

Local checks passed: `node scripts/test-review-command.mjs`,
`node scripts/test-worker-interactions.mjs`, JavaScript syntax checks,
`git diff --check`, `npm run build` (27 pages), and the Worker Wrangler
dry-run. The publisher dry-run could not start because this isolated release
tree does not contain `.bot-setup.local.env`; it made no Discord change.

Current state: the button source is local and uncommitted; the deployed Worker
and live instruction message still do not contain the button. No push,
deployment, Discord edit, or public message was performed for this change.
The four unrelated dirty site/package files remain untouched.

Next action after Diggy approves publishing: deploy the Worker, then run the
narrow migration updater with the existing bot credentials to edit the one
bot-owned instruction message in `#reviews`, and read back the component plus
the ordinary-member button-to-modal path. A real member test remains required.

## Fortnite utility UX and live-feed hardening — local completion (2026-08-29)

The interrupted-task continuation completed the requested comp-player UX pass
without publishing anything. The public Maxx Bot guide remains the existing
read-only panel in `#free-stuff`; the Viewmaxxing preview/first guide message
was not edited or deleted. The visible copy now says **Epic display name**
shown in Fortnite, not Epic account ID. The live flow exposes `ALL` plus each
supported region, then requires one exact live Epic event/window before asking
for the display name. Finals remain a prize race and qualifiers remain a live
cutoff; no prior event, cross-region line, or guessed result is substituted.

Storm now has a compact private BR/Reload wizard with four choices: current
zone, waiting/closing phase, time left, and accumulated storm damage taken.
The confusing `storm depth` wording is gone. Both time and damage menus have
an **Enter exact** modal for values such as 25 seconds or 25 damage. The
result gives the current threat tier, a prominent leave call, current tick,
500 warning timing, 600 MAX THREAT timing, phase-end damage, and the Chapter 7
Comp reference timeline. At 600 cumulative storm damage the displayed rule
is 3x damage; the result remains explicit that the in-game timer and damage
tick outrank the reference because this tool has no live game telemetry.
Advanced `/storm` DPS and `/points` account-ID fallbacks remain for edge cases
but are not placed in the normal panel or normal storm result.

The live event feed now retries one transient 404/408/425/429/5xx or network
failure after 250 ms, then shows a private actionable status without exposing
raw HTTP status/upstream response text. Non-transient 4xx responses are not
retried. Storm wizard submission updates its existing ephemeral message, and
the per-Worker-isolate cleanup retires the previous private Maxx utility reply
when a new utility interaction starts. Old pre-change ephemeral messages
cannot be retroactively deleted because their interaction tokens were not
retained; Cloudflare isolate replacement can also make cleanup best-effort.
Cleanup does not touch public channel messages, tickets, reviews, or the
Viewmaxxing post.

Changed and committed locally in `c4321c1` (`fix: simplify Maxx Bot Fortnite
utility inputs`): `tickets-worker/panel.js`, `tickets-worker/worker.js`,
`tickets-worker/points-live.js`, `tickets-worker/storm-calculator.js`,
`tickets-worker/points-calculator.js`, the three focused fixtures, and
`tickets-worker/README.md`. The four unrelated dirty files remain unstaged:
`astro.config.mjs`, `package-lock.json`, `package.json`, and `tsconfig.json`.

Verification for this exact local commit: all focused command/interaction
fixtures passed (`test-storm-command`, `test-points-live`,
`test-worker-interactions`, `test-points-command`, and
`test-review-command`); all changed Worker modules passed `node --check`;
`git diff --check` passed with only the repository's existing LF-to-CRLF
warnings; `npm run build` produced 27 Astro pages; and
`npx wrangler deploy --dry-run` bundled the Worker successfully with the
expected KV/env bindings. A separate read-only probe of the already deployed
source feed returned HTTP 200 for `windows?region=ALL` and `windows?region=NAC`
with exact finals and console-only qualifier windows. That is not proof that
the new Maxx Worker is deployed or that a real Discord member lookup works.

Current state: local source and tests are complete; implementation commit
`c4321c1` was four commits ahead of
`origin/codex/maxx-bot-fortnite-utilities`; this checkpoint is the fifth local
commit. Neither local commit is pushed. The new Worker is not deployed, the live `#free-stuff` panel was
not edited, slash commands were not re-registered, and no Discord notification
or external message was sent in this continuation. The publisher dry-run still
requires the bot setup environment in the release tree.

Diggy-owed gates after approval: one ordinary-member click-through of Live
Points with a currently live exact event (including one finals and one
console-only qualifier where available), one BR wizard run, and one Reload
wizard run against the actual in-game timer/tick. Confirm that a second Live
Points run leaves only the newest private result in the same Worker isolate;
pre-change stale ephemeral replies may remain until Discord expires them.

Single best next action: after explicit approval, push `c4321c1`, deploy the
Worker, and perform a silent live read-back/click test before changing any
Discord panel message.

## Fortnite utility live release — 2026-08-29

Diggy approved the live release after the local verification gate. The current
branch `codex/maxx-bot-fortnite-utilities` was pushed to
`origin/codex/maxx-bot-fortnite-utilities` at `e504ec6`. The four unrelated
working-tree files remain unstaged and were not included.

The Worker was deployed from `tickets-worker` to
`https://maxxtopia-tickets.maxxtopia.workers.dev` as version
`30ad40f1-4946-4b94-af4e-0784eeb64ddf`. Its unauthenticated GET boundary still
returns the expected `404 not found`; no interaction endpoint or command
registration change was needed.

The narrow publisher edited only the existing Maxx Bot guide message
`1543352185092444191` in the normal text channel `#free-stuff`
(`1519790996559364307`). It did not edit the original Viewmaxxing preview,
post an announcement, or send a public message. Live REST read-back confirmed
the title `MAXX DESK // PRIVATE TOOLS`, three buttons (`Live tournament
points`, `Storm · BR`, and `Storm · Reload`), display-name and storm-damage
copy, silent message flag `4096`, no message mentions, and the existing
read-only `@everyone` overwrite (`sendMessagesAllowed=false`,
`sendMessagesDenied=true`).

Current release state: source, build, tests, push, Worker deployment, panel
edit, and live panel read-back are complete. The release remains silent. A
real ordinary-member click-through is still owed for one live finals lookup,
one console-only qualifier where available, BR timing, Reload timing, and a
second lookup confirming newest-private-result cleanup. The live source can
change between checks, and Storm remains a Chapter 7 reference rather than
live telemetry; the in-game timer and damage tick remain authoritative.

Single best next action: Diggy performs those real Discord/game checks and
reports any rendered or upstream mismatch; do not edit the panel again unless
one of those checks finds a concrete issue.

## Fortnite live-points, storm, ticket, and review repair — local source + silent Discord edits (2026-08-31)

Diggy reported that Live tournament points returned **LIVE LIST // TRY AGAIN**
while an event was visibly live, the first region prompt remained open after a
selection, and the Storm Sickness result treated a Zone 1 example as if the
current 1 damage/sec tick continued forever. He also requested permanent $115
Optimizationmaxxing ticket copy, removal of visible internal ticket markers,
and a review modal button in `#reviews`.

The live-points failure was an upstream-contract drift, not a bad region
choice. Read-only checks on 2026-08-31 showed the deployed bot's legacy
`/windows` and `/standing` source routes both returning exact HTTP 404
`{"error":"not found"}` responses. The current `/tournaments?region=EU`
contract returned HTTP 200 with seven windows, and `/cutoffs?region=EU`
returned HTTP 200 with five windows. No EU window was live during the check,
so this confirms the contract repair but is not a real live-event proof.

Local source now reads `/tournaments`, `/myscore`, `/qualify`, and `/cutoffs`,
while retaining the legacy paths only as bounded route-missing fallbacks. It
requires an exact live event/window/region, rechecks the selected window before
the player lookup, rejects cross-region or ambiguous results, and does not
invent a Finals payout band when the source omits the prize ladder. The region
selection and regional refresh use Discord's deferred message-update path, so
the original private region prompt becomes the event list/status instead of
leaving a second stale prompt behind. Refresh preserves the selected region.

Storm now follows the merged damage cells and exact timing rows in Diggy's
Chapter 7 Season 1 Comp charts for both Battle Royale and Reload. The wizard
adds a required **In storm / Safe now** choice. In-storm results project
continuous exposure across the remaining phase and later zones with their
changing damage/sec values; safe results pause the player's actual damage and
warning clocks while showing a clearly labeled enter-now reference. The
result separates the player-entered phase countdown from the chart's absolute
zone-end match clock. For the reported BR example — Zone 1 closing, 30 seconds
left, 250 cumulative storm damage, in storm — the reference reaches the 500
warning in **4:10**, during Zone 3 closing, not 4:40.

The `/storm` registration schema now requires an exposure status before its
optional mode/DPS fields. The Worker defaults old slash-command payloads to
`inStorm` only for backward compatibility until the command is re-registered.

The existing Discord purchase panels were edited in place using the canonical
bot environment and an update-only, fail-closed publisher:

- `#open-ticket` Optimizationmaxxing message `1502925467802665051` now says
  $115 permanently, one payment/no subscription, lifetime future VIP updates,
  what is included, active maintenance, and possible limited first-time-tuner
  discount tickets. The dated price increase and $180 copy are gone.
- `#open-ticket` Discordmaxxer message `1502926885032820827` had its visible
  internal marker removed without changing the actual tier offer.
- Neither panel displays its `ticket-panel:*` identifier; durable lookup now
  uses invisible button IDs with the old marker only as a one-time migration
  fallback.

Both were exact bot-owned edits with mention parsing disabled. No new panel,
announcement, mention, notification, channel/permission change, pin, or delete
was created. A follow-up dry run read both messages as already current.

The existing bot-owned `#reviews` instruction message
`1543384596740309164` was also edited in place to add **Leave a review**. It
opens the existing review modal handled by the already-deployed Worker; `/review`
remains an optional fallback. The updater hard-codes the exact channel/message,
checks the bot author and hidden review signature, refuses to post or delete,
suppresses mentions, and performs a forced read-back. The live edit and a
second dry run both verified the current button without sending a new message.
A normal-member click/submit remains a human gate.

Local verification passed after the repair: `test-points-command`,
`test-points-live`, `test-storm-command`, `test-review-command`, and
`test-worker-interactions`; syntax checks for every changed JS/MJS module;
`npm run build` with 27 pages; a Wrangler Worker deployment dry-run with the
expected bindings; and `git diff --check` (only repository LF/CRLF warnings).
The resilience pass documented source-contract drift, stale/mismatched live
data, Discord migration duplication, and storm-reference drift in
`tickets-worker/RESILIENCE.md`, including fail-closed behavior and a future
remote kill-switch design.

Current state: the two ticket panels and review instruction are updated live
and silent. The live-points/storm/region source repair, focused tests, safe
publishers, and resilience notes are local and uncommitted in this worktree.
The Maxxtopia Worker has not been redeployed, `/storm` has not been
re-registered, and nothing from this repair has been committed or pushed. The
four unrelated pre-existing dirty files (`astro.config.mjs`, `package-lock.json`,
`package.json`, and `tsconfig.json`) remain preserved and unstaged.

Diggy-owed release gates after explicit approval: deploy the focused Worker,
re-register the slash commands, and push only the intended files; then run one
ordinary-member Live Points lookup during an actually live exact window plus
one BR and one Reload in-game comparison. The single best next action is to
approve that focused deploy/registration/push sequence.

## Fortnite repair production release — 2026-08-31

Diggy explicitly approved the focused live release. Implementation commit
`f449a33` (`fix: repair Maxx Bot live points and storm timing`) and publisher
verification commit `87fd939` (`fix: verify free tools panel readback`) were
pushed to `origin/codex/maxx-bot-fortnite-utilities`. The Astro site was not
deployed. The four unrelated pre-existing dirty files (`astro.config.mjs`,
`package-lock.json`, `package.json`, and `tsconfig.json`) remained unstaged and
untouched.

The production `maxxtopia-tickets` Worker was deployed at
`https://maxxtopia-tickets.maxxtopia.workers.dev` as version
`0ffff141-e523-4b21-bd7d-c750d0df216b`. A cache-busted unauthenticated GET
returned the expected `404` with body `not found`, confirming the interaction
boundary remained closed after deployment.

Slash-command registration first read the eight live guild commands and found
no unreviewed command that the replacement PUT would remove. Discord then
accepted all eight commands. The returned schema contained `/storm` with its
required `status` option, alongside `/review`, `/points`, `/gen`, `/om`, `/33`,
`/founderstatus`, and `/sccoins`. No command was silently dropped.

The existing Maxx Bot guide message `1543352185092444191` in `#free-stuff`
was edited in place with silent flag `4096`, mention parsing disabled, and the
new storm-exposure wording. No replacement message was posted. Discord's
component objects include extra default fields, so the original publisher's
raw JSON comparison produced a false pending-update report after the successful
edit. Commit `87fd939` normalized embeds/components and added forced exact
read-back; its live dry run now reports that the known guide is already current.
The two purchase panels and the `#reviews` instruction also read back as
already current in their fail-closed dry runs.

Release verification passed: five focused command/interaction fixtures, syntax
checks for all changed JavaScript modules, `npm run build` with 27 generated
pages, the Worker deployment dry-run with expected bindings, `git diff --check`,
the production Worker deploy, command-schema read-back, and silent Discord panel
read-back. No public announcement, mention, notification, channel permission
change, pin, delete, or new Discord message was created by this release.

Remaining human gates are intentionally narrow: run Live tournament points as
an ordinary member while a real exact event is currently live, compare one BR
and one Reload result against the in-game timer/tick, and submit one review from
an ordinary-member account. The 2026-08-31 source inspection had no live EU
window, so fixtures and API contract checks are not presented as live-event
proof. The single best next action is that real in-game/Discord verification;
only reopen source work if one of those checks shows a concrete mismatch.
