# Standings resilience

This note covers the public tournament board at `leaderboard.maxxtopia.com`
and its first-party `/api/standings` proxy. The board is intentionally
replay-aware: an upstream response can be healthy while the newest game is
still processing, so the interface must distinguish a fresh provider snapshot
from the last usable snapshot.

## Risk register

| Failure | Blast radius | Detection signal | Fix class | Plan B |
| --- | --- | --- | --- | --- |
| Epic event catalog is unavailable or the burner session expires | Everyone using tournament selection | Catalog request fails or returns an empty result | REBUILD / provider recovery | Keep the last selected URL usable, show `Catalog unavailable`, and restore the worker session through the existing one-tap Epic recovery flow. |
| Standings request times out or returns an upstream error | Everyone viewing that round | `/api/standings` is non-2xx or exceeds the 12-second client timeout | HOT | Keep the rendered rows and label them `LAST GOOD SNAPSHOT`; poll again using the existing bounded cadence. |
| Replay processing is behind the live broadcast | Everyone viewing a current round | Worker returns `replayAware` and a processed timestamp older than the broadcast | HOT | Show `PROCESSING DELAY EXPECTED`, the provider timestamp, and never invent a score, win, prize, or movement value. |
| Epic changes session field names or point rules | Some or all Fortnite rounds | `lastGamePoints`, wins, or scoring reconstruction become null while base points still load | REBUILD | Preserve the base leaderboard, show `LAST GAME —` / `—`, and add a focused parser update after capturing a sanitized live shape. |
| Payout ladder is absent or not cash-denominated | Tournaments without published cash payouts | `prize` is null in the public response | HOT | Show `PRIZE DATA PENDING`; do not turn a rank into a guessed dollar amount. |
| A bad Pages deploy breaks the board shell | Everyone opening the public board | Build failure or live route/browser check fails | REBUILD | Stop the release before publish when possible; after publish, revert the focused page commit and let Pages redeploy the last known-good revision. |
| OBS browser source is pointed at a stale or non-overlay URL | Individual streamer | Overlay URL lacks `overlay=1`, or browser source shows the full page | HOT / user configuration | The board exposes `Copy OBS URL`, `Open overlay`, a compact overlay mode, and a `Full board` escape hatch. |

## Prioritized safeguard backlog

1. Keep the current explicit freshness labels and last-good rendering contract
   covered by a live browser check after every standings release.
2. Add a small synthetic monitor for the selected public standings canary that
   checks response shape (`rows`, `fetched`, `pollAfterSeconds`) without
   logging player identifiers.
3. Add a versioned remote feature flag only if a provider regression requires
   disabling the standings overlay without rebuilding the Maxxtopia site. The
   flag must fail open to its last-known-good value and must never block page
   startup.
4. Add a sanitized fixture test for tracked-stat point reconstruction and
   payout decoding when Epic supplies a stable public fixture.

## Current operational contract

- The Maxxtopia page and overlay share one static build and one first-party
  API path; there is no second leaderboard database to drift.
- The worker keeps provider credentials server-side and exposes only sanitized
  standings fields.
- Client refreshes are bounded by the worker's `pollAfterSeconds` value and
  visibility-aware polling; the current default is replay-friendly rather
  than an aggressive request loop.
- A real tournament replay and an OBS Browser Source session remain field
  checks; a successful HTTP response alone is not proof of rendered, current
  content.
