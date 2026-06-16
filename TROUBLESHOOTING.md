# Maxxtopia — Troubleshooting Runbook

Self-contained playbook for the shell site (Astro 5 + Tailwind 4 on Cloudflare
Pages). Written so anyone — you, a new contributor, or any AI — can diagnose and
fix it without prior context.

Golden rule: reproduce locally first (`npm run dev` / `npm run build`), read the
actual error, then match it below. Don't guess at the live site.

## How to read what's happening

1. **Build/type errors:** `npm run build` — Astro prints the file + line. Most
   breakages are a bad import, a missing `src/data/*` field, or a TS error.
2. **Runtime (page looks wrong):** open the page → browser DevTools Console.
3. **Deploy status:** Cloudflare dashboard → Pages → this project → latest
   deployment log. (Deploys are push-to-`main` → auto-build; see `DEPLOY.md`.)

## Failure modes → cause → fix

| Symptom | Cause | Fix |
|---|---|---|
| Build fails in CI / Pages | Astro/TS error, bad import, or a `src/data/*` shape change | `npm run build` locally, fix the printed error, push |
| A product page 404s | `src/data/products.ts` entry missing/typo'd (routes generate from it) | Add/fix the entry; `/[slug].astro` regenerates routes |
| `/updates` missing a release | The changelog feed reads `src/data/changelog.json`; OM/DM auto-sync only adds an entry if the release notes have a `## Highlights` section (see CLAUDE.md) | Add the entry by hand, or add Highlights to the release notes |
| Download CTA shows old version | `src/data/discordmaxxer-release.json` not updated — the cross-repo `repository_dispatch` from discordmaxxer's release didn't fire | Check discordmaxxer's "Notify maxxtopia" step + the `MAXXTOPIA_DISPATCH_PAT` secret; or edit the JSON manually |
| Site up but stale | Cloudflare Pages didn't rebuild | CF dashboard → Pages → Retry deployment; confirm the push hit `main` |
| OG images broken | `npm run og` / `og:cards` not regenerated | Re-run the og script, commit `public/og/*` |

## Where things live

| What | Where |
|---|---|
| Pages / routes | `src/pages/` (`[slug].astro` generates the 7 product pages) |
| Product data (source of truth) | `src/data/products.ts` |
| Changelog feed | `src/data/changelog.json` (typed by `changelog.ts`) |
| Discordmaxxer version pointer | `src/data/discordmaxxer-release.json` (auto-synced) |
| Cross-repo release sync | `.github/workflows/sync-*-release.yml` |
| Ticket / votes backends | `tickets-worker/`, `votes-worker/` (CF Workers — `wrangler deploy`) |
| Deploy docs | `DEPLOY.md` |

## Is the site actually up?

The suite monitor (`projects/suite-monitor`) pings maxxtopia.com + the product
pages every 15 min and alerts Discord on a change. For an instant check, GET
`https://suite-monitor.maxxtopia.workers.dev`.

## Deploy

Push to `main` → Cloudflare Pages auto-builds + deploys. Workers
(`tickets-worker`, `votes-worker`) deploy separately with `wrangler deploy` from
their folders.
