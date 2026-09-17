import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

const registry = read('src/data/release-registry.ts');
const products = read('src/data/products.ts');
const productPage = read('src/pages/[slug].astro');
const failures = [];

const expectedProducts = [
  'optimizationmaxxing',
  'discordmaxxer',
  'clipmaxxer',
  'dropmaxxer',
  'aimmaxxer',
  'viewmaxxing',
  'adblockmaxxer',
  'streammaxxing',
  'snipemaxxer',
  'playlistmaxxing',
];

for (const slug of expectedProducts) {
  if (!new RegExp(`^  ${slug}:`, 'm').test(registry)) {
    failures.push(`release registry is missing ${slug}`);
  }
}

if (!products.includes("from './release-registry'")) {
  failures.push('products.ts does not use the release registry');
}

if (!productPage.includes("from '../data/release-registry'")) {
  failures.push('[slug].astro does not use the release registry');
}

for (const [relativePath, source] of [
  ['src/data/products.ts', products],
  ['src/pages/[slug].astro', productPage],
]) {
  if (/from ['"][^'"]*-release\.json['"]/.test(source)) {
    failures.push(`${relativePath} imports a release JSON file directly`);
  }

  if (/\bversion\s*:\s*['"]v?\d+\.\d+\.\d+['"]/.test(source)) {
    failures.push(`${relativePath} contains a hard-coded product version`);
  }

  if (/adblockmaxxer-chrome-v\d+\.\d+\.\d+\.zip/.test(source)) {
    failures.push(`${relativePath} contains a hard-coded AdBlock release URL`);
  }

  if (/Snipemaxxer-Setup-\d+\.\d+\.\d+\.exe/.test(source)) {
    failures.push(`${relativePath} contains a hard-coded Snipemaxxer release URL`);
  }

  if (/streammaxxing_(?:\d+\.){2}\d+[^'"\s]*\.exe/.test(source)) {
    failures.push(`${relativePath} contains a hard-coded Streammaxxing release URL`);
  }
}

if (/^\s*version:\s/m.test(productPage) || /^\s*versionDate:\s/m.test(productPage)) {
  failures.push('[slug].astro receipt metadata contains a second version source');
}

if (!productPage.includes('const receiptVersion = releaseVersion(productRelease);')) {
  failures.push('[slug].astro does not derive the receipt version from the registry');
}

if (!productPage.includes('productRelease?.installerUrl')) {
  failures.push('[slug].astro does not derive download links from the registry');
}

if (failures.length > 0) {
  console.error('Release truth check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Release truth check passed for ${expectedProducts.length} products.`);
