# Deploying maxxtopia.com → Cloudflare Pages

## One-time setup

### 1. Push to GitHub
```bash
cd C:\Users\Diggy\projects\maxxtopia
git init
git add .
git commit -m "feat: initial maxxtopia shell site"
gh repo create maxxtopia --public --source=. --push
```

(If you don't have `gh` set up, create the repo on github.com and push manually.)

### 2. Create the Cloudflare Pages project
1. Open https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Authorize Cloudflare to read your GitHub.
3. Select the `maxxtopia` repo.
4. Build settings:
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/`
   - **Node version:** `20` (set as env var `NODE_VERSION=20`)
5. **Save and deploy.** First build takes ~60s. You'll get a `*.pages.dev` URL.

### 3. Wire the domain

If you bought the domain at Cloudflare:
1. Pages project → **Custom domains** → **Set up a custom domain** → enter `maxxtopia.com`.
2. Cloudflare auto-creates the DNS records and SSL cert.
3. Repeat for `www.maxxtopia.com` if you want both.

If you bought the domain elsewhere (Namecheap, GoDaddy, etc.):
1. **Recommended:** transfer the domain into Cloudflare first (free, takes ~5 min, unifies registrar + DNS + Pages).
2. Or set the domain's nameservers to Cloudflare's at the registrar, then add it to Cloudflare as a site.
3. Then add the custom domain in Pages exactly as above.

## Subsequent deploys
Every push to `main` auto-deploys. PRs get preview URLs at `<branch>.maxxtopia.pages.dev`.

## Local preview of production build
```bash
npm run build
npm run preview
```

## DNS notes
- For naked-apex `maxxtopia.com`, Cloudflare uses a CNAME flattening trick — works automatically.
- Add `www → maxxtopia.com` as a permanent redirect (Pages → Custom domains, or Page Rule).
- TLS is auto. Cloudflare Universal SSL covers it.

## Verifying
After DNS propagates (usually <5 min on Cloudflare):
- https://maxxtopia.com → home
- https://maxxtopia.com/optimizationmaxxing → product page
- https://maxxtopia.com/manifesto → manifesto
- https://maxxtopia.com/sitemap.xml → 7 product URLs

## Future: serving installer downloads
When you're ready to host installers under the same domain:
1. Create a Cloudflare R2 bucket (`maxxtopia-releases`).
2. Wire it to a custom domain (`releases.maxxtopia.com` or `maxxtopia.com/releases/*`).
3. Replace the `#download` placeholders in `src/data/products.ts` with the R2 URLs.

Alternatively, point each product's primary CTA at its GitHub Releases page.
