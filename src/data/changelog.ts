export type ChangelogEntry = {
  date: string;
  product: string;
  productSlug?: string;
  version?: string;
  title: string;
  body: string;
};

export const changelog: ChangelogEntry[] = [
  {
    date: '2026-05-07',
    product: 'Maxxtopia',
    version: 'v0.1.0',
    title: 'The shell is live.',
    body: 'maxxtopia.com goes online — hub for the maxxer suite. Cross-product sidebar, finite-rotate hero with sound, status-tape coming-soon treatment, per-product logos for opt + discord.',
  },
  {
    date: '2026-05-07',
    product: 'Optimizationmaxxing',
    productSlug: 'optimizationmaxxing',
    version: 'v0.1.35',
    title: 'Research-driven mega-batch.',
    body: 'Catalog 68 → 87. IntelMicrocodeCard, VbsStatusCard, live DPC sparkline (1-Hz toggle). HID priority quartet, vbs.hvci.disable, IFEO priority for Fortnite/Valorant/CS2, 9 service kills, telemetry-batch task disable.',
  },
  {
    date: '2026-05-06',
    product: 'Discordmaxxer',
    productSlug: 'discordmaxxer',
    version: 'v0.1',
    title: 'First production cut.',
    body: 'Tournament Mode v3 ships. Sub-300 MB RAM at idle vs 1041 MB on stock. Full plugin set (Cursor, Privacy, Trim + 7 more), 5-theme system, Apple-grade icon, custom sounds.',
  },
  {
    date: '2026-05-07',
    product: 'Optimizationmaxxing',
    productSlug: 'optimizationmaxxing',
    version: 'v0.1.34',
    title: 'Knowledge-audit gap closure.',
    body: '4 confident additions: Latency Probe on Toolkit, PCIe Link card on Diagnostics, AMD UCLK heuristic warning, Discord low-FPS research article.',
  },
  {
    date: '2026-05-07',
    product: 'Optimizationmaxxing',
    productSlug: 'optimizationmaxxing',
    version: 'v0.1.33',
    title: 'Audit deferral pass.',
    body: 'DPC migrated to per-NUMA/per-CCD counter source. NIC tweaks probe-and-log with vendor-tolerant fallbacks. formFactor desktop/laptop targeting. 5 laptop-hostile tweaks tagged desktop-only.',
  },
  {
    date: '2026-05-07',
    product: 'Optimizationmaxxing',
    productSlug: 'optimizationmaxxing',
    version: 'v0.1.32',
    title: 'Audit-driven correctness pass.',
    body: 'Catalog 78 → 68 honest tweaks. Cut 10 placebos. Fixed 2 wrong values. Fixed 2 revert bugs. Rebuilt Network Low-Latency around tweaks that actually work. Principle: every tweak must trade off verifiably.',
  },
  {
    date: '2026-05-07',
    product: 'Optimizationmaxxing',
    productSlug: 'optimizationmaxxing',
    version: 'v0.1.31',
    title: 'FileWrite engine action.',
    body: 'New TweakAction::FileWrite variant. Snapshot-backed byte-perfect revert (≤1 MB cap), env-var path expansion, user-profile vs admin routing. Catalog can now ship .ini / .nip / .cfg tweaks.',
  },
  {
    date: '2026-05-07',
    product: 'Optimizationmaxxing',
    productSlug: 'optimizationmaxxing',
    version: 'v0.1.30',
    title: 'DPC + Interrupt Time card.',
    body: 'Backend WMI Win32_PerfFormattedData_PerfOS_Processor. UI: 2 big stats + per-CPU expandable + Save baseline + diff column. Color thresholds (green ≤2% / red >5%). Apply-preset measurable before/after.',
  },
  {
    date: '2026-05-06',
    product: 'Optimizationmaxxing',
    productSlug: 'optimizationmaxxing',
    version: 'v0.1.25',
    title: 'Mega-batch v0.1.25.',
    body: '70 tweaks total (+5 curated). New /changelog page, sitemap.xml + robots.txt. SystemHealth gains category-filtered hint. Compare matrix gains free-text search.',
  },
  {
    date: '2026-05-02',
    product: 'Clipmaxxer',
    productSlug: 'clipmaxxer',
    title: 'Premise-first reset.',
    body: 'Pipeline now ships shippable clips on 2 streamers (Dasnerth 4/5, Pilat 2/2). HUD wedge code deleted. Mission locked: auto-clip + auto-post for streamers.',
  },
];
