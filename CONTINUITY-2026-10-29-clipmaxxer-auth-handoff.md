# Clipmaxxer CTA and auth handoff - 2026-10-29

## Scope

This isolated Maxxtopia worktree prepares the public Clipmaxxer handoff. The
page now names the product in its two app-entry buttons and its microtrust
line, and the live readout uses the user-approved roster framing
"APPROVED PROS + STREAMERS" with "SAMPLE OUTPUT" instead of implying that
every rotating example is a verified detection.

## Source and build evidence

- Changed file: `src/pages/clipmaxxer/index.astro`.
- The CTA still targets `https://app.maxxtopia.com/`, which is the real app
  entry: authenticated users are routed to `/upload`; unauthenticated users
  see the app login/landing surface.
- `npm run build` passed the release-truth and sitemap gates and completed the
  Astro static build.
- Generated artifact verified at `dist/clipmaxxer/index.html`; it contains
  `Open Clipmaxxer`, `IN BETA`, `APPROVED PROS + STREAMERS`, and
  `SAMPLE OUTPUT`.

## Release state

- Worktree: `E:\CodexTemp\maxxtopia-clipmaxxer-live-20261029`.
- Branch: `codex/clipmaxxer-live-20261029`.
- The source changes are not pushed or deployed yet.
- The previously published Clipmaxxer page remains the live public version.

## Remaining gate and next action

Review and commit only the Clipmaxxer source change plus this continuity note.
The user has now explicitly authorized publishing. Push the isolated branch to
the repository's `main` ref through the documented Maxxtopia Pages workflow,
then verify the public route and the app entry separately. Mobile visual proof
and a real authenticated browser flow remain separate acceptance checks.
