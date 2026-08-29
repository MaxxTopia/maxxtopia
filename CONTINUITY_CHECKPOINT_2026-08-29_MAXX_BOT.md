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
guessing; and never notify a Discord channel.

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
`/sccoins`. No public Discord message, announcement, notification, or ticket
panel edit was sent.

## Discord channel surface

The existing `#free-stuff` text channel was renamed to `#tournament-live`
(`1519790996559364307`) in the existing `— maxxtopia —` category. Its topic is
now `Live Fortnite tournament points and prize-race lookups. Use /points live.
Results are private.` The separate later caption message
`1519794106233262193` containing `Viewmaxxing, as it looks now` was removed at
Diggy's request. The original Viewmaxxing app preview post
`1519790997595226315` was verified present and unchanged, including its
components and silent-message flag.

The channel remains read-only for ordinary member messages. This is
intentional: members can enter `/points live` and receive the existing
ephemeral result, while ordinary text cannot become a notification stream.
The deployed interaction Worker is not a Discord Gateway listener, so an
instant-delete-after-send design is not implemented; deletion after delivery
would not guarantee that other members were never notified.

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

The live Discord channel metadata was re-read after the update: the channel is
`#tournament-live`, the old caption message is absent, and the original
Viewmaxxing preview post remains the only message returned in the first-page
check.

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

## Separate status claims

- Local: yes, in both isolated release worktrees.
- Built: yes, site build and Worker dry-run passed.
- Tested: yes for focused fixtures, signed privacy behavior, source live data,
  and unauthenticated endpoint rejection; real Discord rendering remains owed.
- Committed: yes, source `c3eacca` plus docs `8625666`; bot `58cff5d`.
- Pushed: no.
- Registered: yes, silently; the schema was unchanged by the abuse guard.
- Deployed: source and bot yes; Maxxtopia site no new deployment.
- Verified live: source data and bot rejection paths yes; a real user-issued
  `/points live` card inside Discord is not yet verified.

## Diggy-owed tests and next action

Run `/points live` in the target Discord server for one active open/qualifier
and one active Finals event, visually inspect the private card, and test a
console alias by supplying the Epic account ID if the display name fails. If
you want a true Kinch channel-by-channel comparison, provide authenticated
channel screenshots/export or explicitly approve a live Discord login/join
flow at the moment it is requested.

Single best next action: perform the real Discord visual test, including a VIP
member and a console account-ID fallback, then decide whether the remaining
distributed-abuse boundary warrants a separate Cloudflare WAF/rate-limit rule
before any broader rollout.
