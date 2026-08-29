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

## Release state

- Local source: present in this detached release tree, committed locally at `0fb99dd`.
- Built: yes; the site build is local only.
- Tested: yes for the focused fixtures and syntax/build checks above.
- Committed: yes, local commit `0fb99dd`; not published.
- Pushed: no.
- Registered with Discord: no; the registration script was not executed.
- Worker deployed: no.
- Site deployed: no new site deployment for this feature.
- Verified live: no Discord command or production worker verification has been performed.

Git status still displays status-only modification flags for several LF/CRLF-sensitive tracked files (`astro.config.mjs`, `package-lock.json`, `package.json`, `tsconfig.json`) even where the textual diff is empty. Do not restore or reset them broadly; re-check the worktree before any staging decision. The intended textual diff is limited to the three tracked feature files above plus the new modules, fixtures, and this checkpoint.

## Remaining gates and risks

- Review the command definitions and exact live-feed behavior before release.
- A real Discord interaction test is still owed by Diggy after registration.
- Any command registration, local commit, push, worker deploy, or production/live test requiring credentials must be explicitly approved before execution.
- The live qualifying line can move; manual estimates are not a substitute for the current Epic feed.

## Single best next action

After Diggy approves the release boundary, decide separately whether to push
`0fb99dd`, register the slash commands, and deploy the worker. Stop before
those external actions unless each is explicitly approved. Once registered,
run one real Discord test for `/storm` and `/points` and verify the private
response behavior.
