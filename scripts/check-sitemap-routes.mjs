import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function collectFiles(relativeDirectory) {
  const directory = path.join(repoRoot, relativeDirectory);
  const files = [];

  function visit(currentDirectory) {
    for (const entry of fs.readdirSync(currentDirectory, { withFileTypes: true })) {
      const absolutePath = path.join(currentDirectory, entry.name);
      if (entry.isDirectory()) visit(absolutePath);
      else files.push(path.relative(directory, absolutePath).replaceAll(path.sep, '/'));
    }
  }

  visit(directory);
  return files;
}

function routeFromAstroPage(relativePath) {
  if (!relativePath.endsWith('.astro')) return null;

  const withoutExtension = relativePath.slice(0, -'.astro'.length);
  if (withoutExtension === '404' || withoutExtension.includes('[')) return null;

  const route = withoutExtension === 'index'
    ? ''
    : withoutExtension.endsWith('/index')
    ? withoutExtension.slice(0, -'/index'.length)
    : withoutExtension;

  return route ? `/${route}/` : '/';
}

const sitemapSource = read('src/pages/sitemap.xml.ts');
const productsSource = read('src/data/products.ts');
const pageRoutes = collectFiles('src/pages')
  .map(routeFromAstroPage)
  .filter(Boolean);
const productSlugs = [...productsSource.matchAll(/^\s*slug:\s*['"]([^'"]+)['"],/gm)].map(
  (match) => `/${match[1]}/`,
);
const failures = [];

for (const route of pageRoutes) {
  if (productSlugs.includes(route)) {
    if (!sitemapSource.includes('...products.map')) {
      failures.push(`${route} is a product page but the sitemap no longer expands products`);
    }
    continue;
  }

  if (route.startsWith('/guides/') && route !== '/guides/') {
    if (!sitemapSource.includes('...guides.map')) {
      failures.push(`${route} is a guide page but the sitemap no longer expands guides`);
    }
    continue;
  }

  if (!sitemapSource.includes(`\${SITE}${route}`)) {
    failures.push(`${route} exists under src/pages but is missing from sitemap.xml.ts`);
  }
}

// This is a public HTML app copied from public/, not an Astro page.
const publicRoute = '/play/spritecannon/';
if (!fs.existsSync(path.join(repoRoot, 'public', 'play', 'spritecannon', 'index.html'))) {
  failures.push(`${publicRoute} is listed as a public route but its index.html is missing`);
} else if (!sitemapSource.includes(`\${SITE}${publicRoute}`)) {
  failures.push(`${publicRoute} exists under public/ but is missing from sitemap.xml.ts`);
}

if (failures.length > 0) {
  console.error('Sitemap route check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Sitemap route check passed for ${pageRoutes.length} Astro page routes and ${publicRoute}.`);
