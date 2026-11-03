# Discordmaxxer coordinated release checkpoint — 2026-11-03

## Scope

Align the public Discordmaxxer VIP page and profile-media Worker with the clean
v0.7.115 client release candidate so the second PC can update through the
normal updater instead of receiving an offline dev build.

## Source and deployment state

- Worker release worktree: `optimizationmaxxing-profile-media-release-20261103`
- Worker branch is based on current `origin/main` and contains only the three
  profile-media hardening/upload commits.
- Worker deployed at `https://optmaxxing-vip.maxxtopia.workers.dev` with live
  version `4bef9643-77c6-4d9b-a450-51dcd2bfa126`.
- `/healthz` and `/readyz` returned HTTP 200; unauthenticated empty import
  returned 400 and a synthetic missing object returned 404.
- The Worker truth is: free activated profiles can share a full-quality banner,
  animated avatar, and profile colors; paid tiers add presentation controls
  (crop/fit/scale/speed/effects).
- Worker source still needs its three integrated commits pushed to `origin/main`
  so the deployed source and repository history agree.

## Website state

- Website release worktree: this worktree, based on current `origin/main`.
- `src/pages/discordmaxxer/vip.astro` now describes free profile activation and
  shared media accurately, separates native Discord actions, and explains the
  paid presentation controls and ownership/validation behavior.
- `npm ci`, `npm run build`, and `git diff --check` pass.
- The site change is not yet committed, pushed, or live-verified.

## Client state and release gate

- Clean client candidate: `discordmaxxer-release-candidate-20261103`.
- Candidate source gates, strict overlay/rebrand checks, native audio tests,
  packaged smoke launch, and plugin verification passed locally.
- It is still v0.7.114 and has no updater feed; the next release step is bump
  to v0.7.115, add accurate release notes, run `pnpm package:win`, then push a
  tag and verify GitHub Actions, the installer, and `latest.yml`.
- Do not claim lighter-than-stock performance from this release: the candidate
  has no fresh comparison benchmark. The user should test Tournament and Normal
  after the updater, including voice/screenshare and animated flair.

## Next exact actions

1. Commit/push the website change and verify `/discordmaxxer/vip` live content.
2. Push the integrated Worker commits to `origin/main`.
3. Bump and package client v0.7.115, run all release gates, tag/push, and wait
   for the release workflow.
4. Verify the public updater feed and then have Diggy update the other PC.

Keep this checkpoint vendor-neutral and preserve unrelated dirty files in the
canonical checkouts.
