# Continuity - 2026-11-23 Finals game breakdown

## Scope

Add a Finals-only `View game pts` action to the Maxxtopia standings board. A row opens a modal listing the provider-reported points for each processed game. Non-Finals boards keep their existing last-game display.

## Release state

- Canonical checkout: `C:\Users\Diggy\projects\maxxtopia` remains dirty and was not modified by this release.
- Isolated release worktree: `C:\Users\Diggy\projects\maxxtopia-finals-game-breakdown-release`.
- Feature commit: `fd9ca24 feat(standings): show finals game breakdown`.
- Feature commit was pushed to `origin/main`.
- GitHub Actions workflow `45146181840` completed successfully and deployed the site through the documented Cloudflare Pages workflow.
- Live page: `https://maxxtopia.com/standings/`.

## What changed

- Added a Finals-only row button that is disabled when the provider has not published per-game data.
- Added an accessible modal with game number, signed points, pending-state copy, close button, Escape handling, scrim close, and focus restoration.
- Added defensive handling for missing or still-processing game points.
- Kept the public page free of provider account identifiers.

## Verification

- `npm run build` passed in the isolated worktree, including release-truth and sitemap checks.
- Local preview returned HTTP 200 and emitted the dialog, button text, explanation copy, and corrected close-button ID.
- Live `https://maxxtopia.com/standings/` returned HTTP 200 and emitted the same feature markers.
- Live Finals UI test passed on `ArenaFightNight / FightNight_Final3_BR`: the board loaded real rows, the first row opened `Game 1 +105 pts`, and closing restored focus to the row button.

## Remaining validation and risks

- The live Finals sample available during release had one processed game, so a multi-game live modal was not available for visual confirmation. Synthetic Worker coverage verifies chronological ordering, scoring fallback, and pending null values; test a later multi-game Finals board when available.
- Provider replay/session processing can lag. The UI intentionally labels missing values as `Processing` and does not invent a score.

## Build and release

From this worktree, run `npm ci`, `npm run build`, then use the repository workflow in `DEPLOY.md`. Pushes to `main` deploy through `.github/workflows/deploy.yml`; verify the route and the selected Finals URL after the workflow completes.

## Best next move

When the next multi-game Finals board is available, open one row and confirm the modal lists every processed game in order. No further code change is required unless the provider exposes a new session shape.
