// The changelog data lives in changelog.json so CI can append to it safely
// (see scripts/release-note-to-changelog.mjs + the sync-*-release workflows).
// Hand-authored entries for the closed-source apps (AdBlock-Maxxer,
// Streammaxxing) are added here too — just edit the JSON.
import data from './changelog.json';
import { getProduct, products } from './products';

export type ChangelogEntry = {
  date: string;             // YYYY-MM-DD
  product: string;
  productSlug?: string;
  version?: string;
  title: string;
  /** One-line summary. Optional when `items` carries the detail. */
  body?: string;
  /** Bullet list of changes — the clean, scannable format for QoL / feature
   *  passes where several small things shipped at once. Use instead of (or
   *  alongside) `body`. */
  items?: string[];
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Stable DOM/Discord identity for one public update entry. */
export const changelogEntryId = (entry: ChangelogEntry) =>
  `update-${slugify(entry.date)}-${slugify(entry.productSlug ?? entry.product)}-${slugify(entry.version ?? 'release')}-${slugify(entry.title)}`;

/** One color contract shared by the Updates page and every downstream mirror. */
const SUITE_UPDATE_ACCENT_HEX = '#cbd5e1';
export const getChangelogAccentHex = (entry: ChangelogEntry) => {
  if (!entry.productSlug) return entry.product === 'Maxxtopia' ? SUITE_UPDATE_ACCENT_HEX : null;
  const product = getProduct(entry.productSlug);
  return product?.updateAccentHex ?? product?.accentHex ?? null;
};

// Fail the build if two public products would share an Updates accent or if a
// changelog entry points at a product that does not have a color contract.
// Editorial suite notes and private/pre-release notes without productSlug stay
// intentionally unversioned and use the suite fallback styling.
const updateAccentOwners = new Map<string, string[]>();
for (const product of products) {
  const accent = (product.updateAccentHex ?? product.accentHex).toLowerCase();
  updateAccentOwners.set(accent, [...(updateAccentOwners.get(accent) ?? []), product.slug]);
}
const duplicateUpdateAccents = [...updateAccentOwners.entries()]
  .filter(([, owners]) => owners.length > 1)
  .map(([accent, owners]) => `${accent}: ${owners.join(', ')}`);
if (duplicateUpdateAccents.length > 0) {
  throw new Error(`Duplicate Updates accents: ${duplicateUpdateAccents.join('; ')}`);
}
if (updateAccentOwners.has(SUITE_UPDATE_ACCENT_HEX)) {
  throw new Error(`Suite Updates accent collides with a product: ${SUITE_UPDATE_ACCENT_HEX}`);
}

const missingUpdateAccentSlugs = (data as ChangelogEntry[])
  .filter((entry) => entry.productSlug && !getChangelogAccentHex(entry))
  .map((entry) => entry.productSlug)
  .filter((slug, index, all) => slug && all.indexOf(slug) === index);
if (missingUpdateAccentSlugs.length > 0) {
  throw new Error(`Updates entries reference products without an accent: ${missingUpdateAccentSlugs.join(', ')}`);
}

// Always render newest-first, regardless of insertion order. Stable for equal
// dates (keeps the order they appear in the JSON).
export const changelog: ChangelogEntry[] = (data as ChangelogEntry[])
  .slice()
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
