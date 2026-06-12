# Maxxtopia

The shell site for the maxxer suite. Lives at https://maxxtopia.com.

## Stack
- **Astro 5** (static, file-based routing, fast)
- **Tailwind 4** (via `@tailwindcss/vite`, theme tokens inline in `src/styles/global.css`)
- **TypeScript** (strict)
- **Hosting:** Cloudflare Pages (registrar + CDN + DNS, all on one provider)

## Project layout
```
src/
  components/        # Logo, Header, Footer, Hero, ProductCard, StatusPill
  layouts/Layout.astro   # base shell with meta/OG/fonts/header/footer
  data/products.ts   # single source of truth for the 7 products
  pages/
    index.astro      # hero + suite grid + principles + CTA
    why.astro        # the why
    updates.astro    # changelog feed
    [slug].astro     # dynamic per-product page (generates 7 routes)
    404.astro
    sitemap.xml.ts   # generated sitemap
    rss.xml.ts       # generated RSS feed
  styles/global.css  # Tailwind import + theme tokens + utility classes
public/
  favicon.svg
  robots.txt
```

## Routes
- `/` — landing
- `/why`
- `/updates` (changelog feed; backed by `src/data/changelog.ts`)
- `/optimizationmaxxing` (live)
- `/discordmaxxer` (live)
- `/discordmaxxer/vip` (pricing tiers)
- `/clipmaxxer` (soon)
- `/dropmaxxer` (beta)
- `/aimmaxxer` (soon)
- `/viewmaxxing` (soon)
- `/extensionmaxxing` (soon)
- `/404`
- `/sitemap.xml` · `/rss.xml`

## Local dev
```
cd C:\Users\Diggy\projects\maxxtopia
npm install
npm run dev      # http://localhost:4321
```

## Production build
```
npm run build    # outputs to dist/
npm run preview  # serve dist/ locally
```

## Adding a new product
1. Add an entry to `src/data/products.ts` (status, tagline, features, stats, glyph).
2. The dynamic `/[slug]` page auto-generates the marketing page.
3. The home grid + footer + sitemap auto-update.

No new files needed for new products.

## Design tokens
- `--color-bg` `#0a0612` — deep cosmic purple-black canvas
- `--color-magenta` `#e25bff` — primary accent · `--color-cyan` `#00d4ff` — secondary
- Type: Geist Sans (display + body), Geist Mono (labels), Bebas Neue (`--font-display`),
  Bowlby One (`--font-accent` / `.serif-accent`), Crimson Pro (DailyQuote), Metal Mania (one sidebar tooltip)
- All tokens defined inline at `src/styles/global.css` under `@theme`.

## Deploy → Cloudflare Pages
See `DEPLOY.md`.

## Future
- OG image (1200×630) generation — placeholder reference at `/og.png`
- Per-live-product download routes once installer hosting is decided (GitHub Releases vs R2)
- Email capture for waitlist (Cloudflare Workers + KV, or Resend)
