import type { APIRoute } from 'astro';
import { changelog } from '../data/changelog';

const SITE = 'https://maxxtopia.com';

// Escape XML special chars in case any changelog body contains < > & ' "
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = () => {
  const lastBuild = new Date().toUTCString();

  const items = changelog
    .slice(0, 50)
    .map((entry) => {
      const date = new Date(`${entry.date}T12:00:00Z`).toUTCString();
      const link = entry.productSlug ? `${SITE}/${entry.productSlug}` : `${SITE}/updates`;
      const title = entry.version
        ? `${entry.product} ${entry.version} — ${entry.title}`
        : `${entry.product} — ${entry.title}`;
      const guid = `${SITE}/updates#${entry.date}-${entry.product.toLowerCase()}-${(entry.version ?? entry.title)
        .replace(/[^a-z0-9]+/gi, '-')
        .toLowerCase()}`;
      return `    <item>
      <title>${esc(title)}</title>
      <link>${link}</link>
      <guid isPermaLink="false">${guid}</guid>
      <pubDate>${date}</pubDate>
      <category>${esc(entry.product)}</category>
      <description>${esc(entry.body)}</description>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Maxxtopia — Updates</title>
    <link>${SITE}/updates</link>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Native gaming utilities for the players who count frame times. Every release, one feed.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
