import type { APIRoute } from 'astro';
import { changelog, changelogEntryId, getChangelogAccentHex } from '../data/changelog';

export const prerender = true;

const SITE_ORIGIN = 'https://maxxtopia.com';

export const GET: APIRoute = () => {
  const updates = changelog.map((entry) => ({
    id: changelogEntryId(entry),
    date: entry.date,
    product: entry.product,
    productSlug: entry.productSlug ?? null,
    version: entry.version ?? null,
    title: entry.title,
    body: entry.body ?? null,
    items: entry.items ?? [],
    accentHex: getChangelogAccentHex(entry),
    url: `${SITE_ORIGIN}/updates#${changelogEntryId(entry)}`,
  }));

  return new Response(JSON.stringify({ schemaVersion: 1, updates }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  });
};
