// The changelog data lives in changelog.json so CI can append to it safely
// (see scripts/release-note-to-changelog.mjs + the sync-*-release workflows).
// Hand-authored entries for the closed-source apps (AdBlock-Maxxer,
// Streammaxxing) are added here too — just edit the JSON.
import data from './changelog.json';

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

// Always render newest-first, regardless of insertion order. Stable for equal
// dates (keeps the order they appear in the JSON).
export const changelog: ChangelogEntry[] = (data as ChangelogEntry[])
  .slice()
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
