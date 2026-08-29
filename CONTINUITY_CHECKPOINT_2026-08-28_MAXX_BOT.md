# Continuity checkpoint: Maxx Bot storm and points commands

Date: 2026-08-28
Scope: recovery of the recent Maxxtopia work from the failed Codex task titled `Fix repeated viewmaxxing title`.

## Recovery identity

The old task is in a system-error state after a failed remote context compaction. Its later work had moved from the original Viewmaxxing title issue to the Maxxtopia Maxx Bot utility commands. This checkpoint is the portable source of truth for that later work.

Saved release tree:
`C:\Users\Diggy\Documents\Codex\2026-08-27\why-is-this-appearing-on-every\work\maxxtopia-storm-points-release`

Base revision: `7122a91` (`origin/main`, `main`, and `origin/HEAD` all pointed here at recovery). Local feature commit: `0fb99dd` (`feat: add Maxx Bot storm and points tools`). The tree remains detached; the main checkout at `C:\Users\Diggy\projects\maxxtopia` is separately dirty and was not edited.

## Goal

Add two public, ephemeral Discord slash commands to the Maxxtopia tickets worker:

- `/storm`: calculate a Battle Royale or Reload storm-sickness rotate window from zone, phase, time, damage, and optional DPS.
- `/points`: calculate a manual tournament pace or perform a bounded live lookup using the exact current Epic display name, region, tournament event, and window.

Both commands must fail closed on invalid or ambiguous data, avoid mention expansion, and remain separate from the Diggy-only administrative commands.

## Work recovered and changed

- `tickets-worker/worker.js` routes `/storm`, manual `/points`, and deferred live `/points` responses.
- `tickets-worker/storm-calculator.js` contains the pure storm rules and Discord formatting.
- `tickets-worker/points-calculator.js` contains the pure manual points math and formatting.
- `tickets-worker/points-live.js` selects one exact live window, reads its cutoff, then reads the score for that same `eventId` and `windowId`.
- `scripts/register-slash-commands.mjs` defines the two public commands while retaining admin-only permissions for the existing administrative commands.
- `tickets-worker/README.md` documents the commands and their safety boundaries.
- Four focused fixtures cover storm math, manual points, live exact-window/failure paths, and signed worker interactions. The worker fixture also exercises deferred live `/points`, exact event/window propagation, the final private webhook edit, and mention suppression.
- Accidental npm lockfile drift was removed. The final comment cleanup explains the public/admin permission boundary.

## Verification

Passed in the saved tree:

- `node scripts/test-storm-command.mjs`
- `node scripts/test-points-command.mjs`
- `node scripts/test-points-live.mjs`
- `node scripts/test-worker-interactions.mjs`
- `node --check` for the worker, three new worker modules, and the registration script
- `git diff --check`
- `npm run build` (Astro static build; 27 pages generated)
- Read-only `https://snipemaxxer-brain.maxxtopia.workers.dev/cutoffs?region=EU`: HTTP 200 and expected event/window/threshold shape. The feed had zero live EU windows at the time, so no score lookup was attempted.

## Latest live probe (2026-08-29)

- The live feed returned qualification-style windows for the enabled regions, but its source intentionally omits windows decoded as `final`; Maxx Bot therefore cannot currently select a finals window from `/cutoffs`.
- `Clix` resolved as an Epic display name, but the tested currently exposed windows returned no scored leaderboard result for that account. No points or qualification answer was claimed.
- `heartzkaitt` did not resolve under that exact display name. This needs an exact Epic display name/account identity and the correct event/region before it can be a valid open-tournament test.
- Recommended finals behavior: keep qualification and finals as separate result types. Qualifiers show the moving rank/points cut; finals show current rank, points, games, and a clearly labeled projected prize tier from the verified payout ladder, with no invented point cutoff. If the payout ladder is unavailable, say that placement is being tracked but prize information is unverified.

## Finals prize-race continuation (2026-08-29)

The requested Finals behavior is now implemented locally across two deliberately
separate worktrees:

- Source-of-truth Worker worktree:
  `C:\Users\Diggy\Documents\Codex\2026-08-27\why-is-this-appearing-on-every\work\snipemaxxer-finals-prize-release`
  on branch `codex-finals-prize`, local commit `7cb863d`.
- Maxx Bot release worktree:
  `C:\Users\Diggy\Documents\Codex\2026-08-27\why-is-this-appearing-on-every\work\maxxtopia-storm-points-release`
  remains detached, local commit `d2d2deb`.

The new source contract is `/windows?region=` for exact active qualification
and Finals windows, and `/standing?ign=&accountId=&eventId=&windowId=&region=`
for one exact player/event/window/region. Finals use Epic's published paid-rank
ladder for prize bands and read the live points at each boundary from that same
regional event window. The Bot calculates the current band, next better band,
live points gap, and required points per remaining game. It never substitutes a
different region, an older similar tournament, or an opaque payout id as a
dollar amount. A 32-character Epic account ID is accepted when a console or
platform alias does not resolve as an Epic display name. A partial `ALL` scan
can use a clearly identified healthy region; a failed requested region remains
unavailable.

The deployed Worker is unchanged. At the checkpoint update,
`https://snipemaxxer-brain.maxxtopia.workers.dev/windows?region=EU` still returns
HTTP 404, while the old `/cutoffs` route remains live. No Discord registration,
Worker deployment, site deployment, push, or external message was performed.

## Release state

- Local source: Finals contract committed locally at `7cb863d` in the separate `snipemaxxer-finals-prize-release` worktree; Maxx Bot adapter committed locally at `d2d2deb` in this release tree.
- Built: yes; the site build is local only.
- Tested: yes. Focused fixtures, syntax checks, `git diff --check`, Astro build (27 pages), and both Worker packaging dry-runs passed after the Finals changes.
- Committed: yes, local commits `7cb863d` and `d2d2deb`; not published.
- Pushed: no.
- Registered with Discord: no; the registration script was not executed.
- Worker deployed: no.
- Site deployed: no new site deployment for this feature.
- Verified live: no; the read-only probe confirmed the new `/windows` route is not in the current deployment. No real Finals player result has been claimed.

The Maxxtopia release tree still displays status-only modification flags for
several LF/CRLF-sensitive tracked files (`astro.config.mjs`, `package-lock.json`,
`package.json`, `tsconfig.json`) even where the textual diff is empty. They were
not staged. The source worktree is clean after its scoped commit. Do not restore
or reset these files broadly.

## Remaining gates and risks

- Review the command definitions and exact live-feed behavior before release.
- A real Discord interaction test is still owed by Diggy after registration.
- Any command registration, local commit, push, worker deploy, or production/live test requiring credentials must be explicitly approved before execution.
- The live qualifying line can move; manual estimates are not a substitute for the current Epic feed.
- A real open-tournament and a real Finals test are still owed by Diggy. The open test needs the exact Epic identity or account ID, event/window, and region; the Finals test must occur while the exact Finals leaderboard has populated scores.
- `heartzkaitt` did not resolve by exact display name in the prior probe; `Clix` resolved but had no score in the tested current windows. These are identity/window test blockers, not successful feature tests.
- Boundary points are projections until the window closes. Ties, late score ingestion, missing payout fields, a board that is not live, and upstream schema changes remain explicit unavailable states.

## Single best next action

Review the two local commits, then explicitly approve the release sequence if
you want it made live: deploy the source Worker first, register the updated
Discord command schema, deploy Maxx Bot, and run one real exact-identity test
in an active qualifier and one in an active Finals window. Do not perform that
sequence without Diggy's approval.
