# Continuity checkpoint: Maxx Bot live Finals points release

Date: 2026-08-29
Scope: recovery and completion of the later Maxx Bot/SnipeMaxxer work that
grew out of the failed Codex task titled `Fix repeated viewmaxxing title`.

## Authoritative worktrees

Bot release tree:
`C:\Users\Diggy\Documents\Codex\2026-08-27\why-is-this-appearing-on-every\work\maxxtopia-storm-points-release`

Source Worker release tree:
`C:\Users\Diggy\Documents\Codex\2026-08-27\why-is-this-appearing-on-every\work\snipemaxxer-finals-prize-release`

The main checkouts at `C:\Users\Diggy\projects\maxxtopia` and
`C:\Users\Diggy\projects\snipemaxxer` were dirty before this work and were
not edited, reset, cleaned, staged, pushed, or deployed from.

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

## Current release state

Source code commit: `c3eacca` (`fix: polish finals window metadata`).
Source documentation commit: `8625666` (`docs: record live lookup abuse boundaries`).
Source deployed Worker version: `19ca57bf-b140-472d-ad26-a26552465995` at
`https://snipemaxxer-brain.maxxtopia.workers.dev`.

Bot code commit: `58cff5d` (`fix: give VIPs faster live points refresh`). The
prior abuse-guard release is included in its history at `cef3e11`; the prior
bot visual release is included in its history at `9fdc540`.
Bot deployed Worker version: `f1da54de-25b5-4980-9318-7bf5479057cd` at
`https://maxxtopia-tickets.maxxtopia.workers.dev`.

The unchanged seven-command Discord schema was silently registered before the
bot deploy: `/storm`, `/points`, `/gen`, `/om`, `/33`, `/founderstatus`, and
`/sccoins`. No public announcement, notification, or ticket-panel edit was
sent. The later channel-surface update added one silent instructional embed
only, with no mentions.

## Discord channel surface

The existing `#free-stuff` text channel (`1519790996559364307`) remains in the
existing `— maxxtopia —` category. Its topic is now `Free Maxxtopia tools and
private Fortnite tournament lookups. Use /points or /storm. Results are
private.` The separate later caption message `1519794106233262193` containing
`Viewmaxxing, as it looks now` was removed at Diggy's request. The original
Viewmaxxing app preview post `1519790997595226315` was verified present and
unchanged, including its components and silent-message flag.

A new silent instruction embed `1543352185092444191`, titled
`🧭 FREE TOOLS // PRIVATE BY DEFAULT`, explains `/points`, the Finals prize
race, the console account-ID fallback, supported regions, `/storm`, and the
private command-only use case. It has five fields, no components, no mentions,
and message flag `4096` (`SUPPRESS_NOTIFICATIONS`).

The channel now exposes the composer to ordinary members while retaining the
command-only behavior. The `@everyone` overwrite is allow `3072` / deny
`377957122112`, which adds `SEND_MESSAGES` and removes only that bit from the
previous deny mask; the slash-command permission remains allowed. AutoMod rule
`1543354527045132308` (`free-stuff | commands only`) is enabled with a silent
block action for any ordinary non-empty member message. It exempts the other
27 currently message-capable channels/active thread and does not exempt
`#free-stuff`, so regular users can type `/` and choose `/points` or `/storm`
without turning the channel into a public chat stream. The installed app's
interaction is not treated as an ordinary member message.

This exemption list is a live-server safeguard with a maintenance edge: any
new message-capable channel or thread must be added to the rule's exemptions,
or the catch-all rule could block ordinary messages there. The deployed
interaction Worker is not a Discord Gateway listener, so an instant-delete-
after-send design is not implemented; deletion after delivery would not
guarantee that other members were never notified.

## Verification evidence

Passed in the bot release tree:

- `node scripts/test-storm-command.mjs`
- `node scripts/test-points-command.mjs`
- `node scripts/test-points-live.mjs`
- `node scripts/test-worker-interactions.mjs`, including regular-user 30-second
  and signed `@VIP`-role 5-second live lookup throttling
- syntax checks for the changed Worker modules
- `git diff --check`
- `npm run build` (Astro static build, 27 pages)
- `npx wrangler deploy --config wrangler.toml --dry-run` from `tickets-worker`

The live Discord channel metadata was re-read after the channel-surface
update: the channel is `#free-stuff`, the old caption message is absent, the
original Viewmaxxing preview post remains unchanged, and the new instruction
embed is present with flag `4096`. The live permission read-back confirms
`SEND_MESSAGES` is allowed and not denied. The live AutoMod read-back confirms
the command-only rule is enabled, targets the channel (the target is not
exempt), and has no missing or unexpected exemptions against the current
channel/thread inventory. The live guild command read-back includes `/points`
and `/storm`.

Latest read-only live source check returned HTTP 200 for EU Finals window
`FNCSDivisionalCup Division1`, event
`epicgames_S42_FNCSDivisionalCup_Division1_EU`, window
`S42_FNCSDivisionalCup_Division1_Week1Final_EU`, with canonical `round=Finals`.
The three supplied exact names resolved with verified live standings at the
check: `xset clix 1x.` rank 45 / 30 points, `XSET ØØ8` rank 45 / 30 points,
and `T1 darmboss` rank 2 / 299 points. Rank and boundary values are live and
can move as scores arrive.

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

## Local Kinch-style panel implementation (not live)

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

No live Discord permission, AutoMod, message, command registration, Worker
deployment, push, or external message was changed for this panel milestone.
The currently deployed Worker and channel still represent the prior
slash-command plus temporary composer/AutoMod workaround until an explicit
rollout is approved. The safe rollout order is Worker deploy, silent panel
update, read-only permission restore, then AutoMod workaround removal, with a
read-back after each boundary.

The panel's live-window refresh is also guarded at five seconds per Discord
user, independently of the final live-points cooldown and ticket/VIP KV
limiter, so repeated select clicks cannot create an unbounded `/windows` proxy.

## Separate status claims

- Local: yes; the new panel implementation is present only in the isolated bot
  release tree, while the main Maxxtopia and Snipemaxxer checkouts remain
  untouched and dirty.
- Built: the prior site build and Worker dry-run passed; this panel milestone
  still needs its post-edit build/dry-run evidence.
- Tested: the prior focused fixtures passed, and the new panel fixtures still
  need to be recorded here; real Discord rendering remains owed.
- Committed: prior source `c3eacca` plus docs `8625666`; prior bot `58cff5d`.
  The panel milestone is not committed until its final verification passes.
- Pushed: no.
- Registered: yes, silently; the schema was unchanged by the abuse guard.
- Deployed: source and prior bot yes; the panel milestone is not deployed;
  Maxxtopia site has no new deployment.
- Verified live: source data, bot rejection paths, the silent `#free-stuff`
  channel surface, the regular-member composer permission, the enabled
  command-only AutoMod rule, and the registered `/points`/`/storm` commands
  yes; the new panel's real regular-user click/select/modal flow is not live
  or verified, and a real plain-message block inside Discord is not yet
  verified.

## Diggy-owed tests and next action

After a panel rollout is approved, click each panel control as a regular member,
choose one active qualifier and one active Finals event, visually inspect the
private results, and test a console alias by supplying the Epic account ID if
the display name fails. Confirm ordinary members cannot send a normal message
in `#free-stuff` while panel interactions still work. If you want a true Kinch
channel-by-channel comparison, provide authenticated channel screenshots/export
or explicitly approve a live Discord login/join flow at the moment it is
requested.

Single best next action: finish local verification and review the isolated diff;
then, if the panel looks right, approve the four-step live migration rather
than changing the live channel while the new Worker is unverified.
