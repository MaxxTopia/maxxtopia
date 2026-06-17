import type { APIRoute } from 'astro';
import { products } from '../data/products';
import { guides } from '../data/guides';

const SITE = 'https://maxxtopia.com';

export const GET: APIRoute = () => {
  const today = new Date().toISOString().slice(0, 10);
  // Trailing slashes required — Cloudflare Pages 308-redirects no-slash
  // URLs to slash form, and Astro builds /foo/index.html, so the canonical
  // is the slashed version. Listing no-slash URLs here triggers GSC's
  // "Page with redirect" + "Alternate page with proper canonical tag"
  // warnings on every entry. (Found 2026-05-15 via GSC email.)
  const urls = [
    { loc: `${SITE}/`,         priority: '1.0', changefreq: 'weekly' },
    { loc: `${SITE}/why/`,     priority: '0.8', changefreq: 'monthly' },
    { loc: `${SITE}/updates/`, priority: '0.8', changefreq: 'weekly' },
    ...products.map((p) => ({
      loc: `${SITE}/${p.slug}/`,
      priority: p.status === 'live' ? '0.9' : '0.6',
      changefreq: p.status === 'live' ? 'weekly' : 'monthly',
    })),
    { loc: `${SITE}/guides/`, priority: '0.7', changefreq: 'weekly' },
    ...guides.map((g) => ({
      loc: `${SITE}/guides/${g.slug}/`,
      priority: '0.7',
      changefreq: 'monthly',
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
