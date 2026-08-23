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
  /** Optional public label override for a genuine major release. */
  publicVersion?: string;
  title: string;
  /** One-line summary. Optional when `items` carries the detail. */
  body?: string;
  /** Bullet list of changes — the clean, scannable format for QoL / feature
   *  passes where several small things shipped at once. Use instead of (or
   *  alongside) `body`. */
  items?: string[];
};

export const getChangelogProjectKey = (entry: ChangelogEntry) =>
  (entry.productSlug ?? entry.product).toLowerCase();

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Stable DOM/Discord identity for one public update entry. */
export const changelogEntryId = (entry: ChangelogEntry) =>
  `update-${slugify(entry.date)}-${slugify(entry.productSlug ?? entry.product)}-${slugify(entry.version ?? 'release')}-${slugify(entry.title)}`;

/**
 * Public labels are intentionally simpler than native app SemVer. Each
 * product gets its own readable sequence: v1, v1.1, v1.2, ... The exact app
 * version stays in `version` for release traceability and updater compatibility.
 */
const publicVersionByEntry = new Map<ChangelogEntry, string>();
const entriesByProject = new Map<string, ChangelogEntry[]>();
const sourceOrder = new Map<ChangelogEntry, number>();
for (const entry of data as ChangelogEntry[]) {
  sourceOrder.set(entry, sourceOrder.size);
  const projectKey = getChangelogProjectKey(entry);
  entriesByProject.set(projectKey, [...(entriesByProject.get(projectKey) ?? []), entry]);
}
for (const entries of entriesByProject.values()) {
  const chronologicalEntries = entries.slice().sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    const aVersion = (a.version ?? '').replace(/^v/i, '').split('.').map(Number);
    const bVersion = (b.version ?? '').replace(/^v/i, '').split('.').map(Number);
    for (let index = 0; index < Math.max(aVersion.length, bVersion.length); index += 1) {
      const difference = (aVersion[index] ?? -1) - (bVersion[index] ?? -1);
      if (difference !== 0) return difference;
    }
    return (sourceOrder.get(a) ?? 0) - (sourceOrder.get(b) ?? 0);
  });
  chronologicalEntries.forEach((entry, index) => {
    publicVersionByEntry.set(entry, index === 0 ? 'v1' : `v1.${index}`);
  });
}

export const getChangelogDisplayVersion = (entry: ChangelogEntry) =>
  entry.publicVersion ?? publicVersionByEntry.get(entry) ?? null;

/** One color contract shared by the Updates page and every downstream mirror. */
const SUITE_UPDATE_ACCENT_HEX = '#cbd5e1';
export const getChangelogAccentHex = (entry: ChangelogEntry) => {
  if (!entry.productSlug) return entry.product === 'Maxxtopia' ? SUITE_UPDATE_ACCENT_HEX : null;
  const product = getProduct(entry.productSlug);
  return product?.updateAccentHex ?? product?.accentHex ?? null;
};

// Fail the build if two public products would share an Updates accent, if a
// changelog entry points at a product that does not have a color contract, or
// if a new public entry forgets its version pill. The old Clipmaxxer beta note
// is the only grandfathered unversioned entry because it has no public release
// metadata.
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

const historicalUnversionedEntries = new Set([
  '2026-05-02|clipmaxxer|Premise-first reset.',
]);
const missingUpdateVersions = (data as ChangelogEntry[])
  .filter((entry) => !entry.version)
  .filter((entry) => !historicalUnversionedEntries.has(`${entry.date}|${entry.productSlug ?? entry.product}|${entry.title}`))
  .map((entry) => `${entry.date} ${entry.product}: ${entry.title}`);
if (missingUpdateVersions.length > 0) {
  throw new Error(`Updates entries must include a version pill: ${missingUpdateVersions.join('; ')}`);
}

// Always render newest-first, regardless of insertion order. Stable for equal
// dates (keeps the order they appear in the JSON).
export const changelog: ChangelogEntry[] = (data as ChangelogEntry[])
  .slice()
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
