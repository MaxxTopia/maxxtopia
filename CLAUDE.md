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
    manifesto.astro  # the why
    [slug].astro     # dynamic per-product page (generates 7 routes)
    404.astro
    sitemap.xml.ts   # generated sitemap
  styles/global.css  # Tailwind import + theme tokens + utility classes
public/
  favicon.svg
  robots.txt
```

## Routes
- `/` — landing
- `/manifesto`
- `/optimizationmaxxing` (live)
- `/discordmaxxer` (live)
- `/clipmaxxer` (beta)
- `/dropmaxxer` (beta)
- `/aimmaxxer` (soon)
- `/viewmaxxing` (soon)
- `/editmacros` (soon)
- `/sitemap.xml`

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
- `--color-bg` `#050505` — near-black canvas
- `--color-accent` `#00FFA3` — electric mint, single accent
- Type: Geist Sans (display + body), Geist Mono (labels)
- All tokens defined inline at `src/styles/global.css` under `@theme`.

## Deploy → Cloudflare Pages
See `DEPLOY.md`.

## Future
- OG image (1200×630) generation — placeholder reference at `/og.png`
- Per-live-product download routes once installer hosting is decided (GitHub Releases vs R2)
- Email capture for waitlist (Cloudflare Workers + KV, or Resend)
