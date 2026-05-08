export type ProductStatus = 'live' | 'beta' | 'waitlist' | 'soon';

export type Product = {
  slug: string;
  name: string;
  category: string;
  status: ProductStatus;
  version?: string;
  tagline: string;
  description: string;
  longDescription: string;
  features: { title: string; body: string }[];
  stats?: { label: string; value: string }[];
  /** Massive headline number / phrase shown in display font above the
   *  tagline on the product hero. The "scroll-stopper" stat. */
  heroStat?: { value: string; label: string };
  primaryCta: { label: string; href: string; external?: boolean };
  secondaryCta?: { label: string; href: string; external?: boolean };
  glyph: string;
  /** SVG mark path under /logos/. If absent, ProductCard falls back to wordmark-only. */
  logo?: string;
  /** Suite-canon accent for sidebar + per-product highlights. */
  accentHex: string;
  /** Hero shot images under /screenshots/<slug>/. */
  screenshots?: string[];
  /** External live build URL — for beta products that have a working site outside maxxtopia. */
  deployedUrl?: string;
};

export const products: Product[] = [
  {
    slug: 'optimizationmaxxing',
    name: 'Optimizationmaxxing',
    category: 'PC Tuning',
    status: 'live',
    version: 'v0.1.35',
    tagline: 'Eighty-seven tweaks. Zero placebos.',
    description:
      'The only Windows tuner that shows its work. Every tweak traced to a Microsoft Learn doc or a vendor whitepaper. One UAC prompt applies the whole preset. Snapshot-backed revert, any tweak, any time.',
    longDescription:
      "87 sourced tweaks. 3.6 MB native. One UAC prompt. Full undo. Built for the players who count their frame times.",
    features: [
      {
        title: 'Sourced or it doesn\'t ship.',
        body: 'Every tweak cites a Microsoft Learn doc or vendor whitepaper. The other tuners don\'t print sources because they don\'t have any.',
      },
      {
        title: '10 presets. Or roll your own.',
        body: 'Esports, BR, Streamer, Frame Pacing, Tournament FPS — plus five more. Custom builder for the rest.',
      },
      {
        title: 'One prompt. Full undo.',
        body: 'Whole preset behind one UAC. Snapshot-backed. Roll any tweak back, anytime. Undo isn\'t a paid tier.',
      },
      {
        title: 'Measure, then tune.',
        body: 'Live DPC sparkline. Latency probes. PCIe diagnostics. We show the before, the after, and what changed.',
      },
      {
        title: 'Knows your rig.',
        body: 'Detects CPU, RAM, OS, laptop or desktop. Hides everything that doesn\'t apply. No more squinting at irrelevant options.',
      },
      {
        title: '3.6 MB. Native.',
        body: 'Hone is 200 MB. Paragon is 81. Ours is 3.6 MB of Rust on Tauri 2. Opens in 200 ms.',
      },
    ],
    stats: [
      { label: 'Audited tweaks', value: '87' },
      { label: 'Curated presets', value: '10' },
      { label: 'Installer', value: '3.6 MB' },
      { label: 'Idle RAM', value: '~30 MB' },
    ],
    primaryCta: { label: 'Get it. Free.', href: '#download' },
    secondaryCta: { label: "What's new", href: '/changelog' },
    glyph: '⚡',
    logo: '/logos/optimizationmaxxing.svg',
    accentHex: '#e25bff',
    screenshots: ['/screenshots/optimizationmaxxing/og.png'],
    heroStat: { value: '87', label: 'tweaks · zero placebos' },
  },
  {
    slug: 'discordmaxxer',
    name: 'Discordmaxxer',
    category: 'Communication',
    status: 'live',
    version: 'v0.1',
    tagline: 'Discord. Minus 753 MB.',
    description:
      "Stock Discord uses 1,041 MB on this machine. Ours uses 288. Same servers, same friends, same pings — we just stripped the part where it pretended to be a browser running a chat app.",
    longDescription:
      "Stock: 1,041 MB. Ours: 288. Same servers, same pings — minus the bloat.",
    features: [
      {
        title: 'Tournament Mode v3.',
        body: '0% idle CPU. 288 MB resident. 753 MB lighter than stock. Same machine, same servers.',
      },
      {
        title: '10 plugins. Native.',
        body: 'Cursor. Privacy. Trim. Plus 7 more, written as first-class code. No Vencord runtime tax.',
      },
      {
        title: '5 themes. 5 sound packs.',
        body: 'Hand-tuned palettes, each with its own sound. Your Discord, your aesthetic.',
      },
      {
        title: 'No phone-home.',
        body: 'Zero outbound calls outside your messages. Stock Discord opens 14 to 6 domains. Ours opens what you sent.',
      },
    ],
    stats: [
      { label: 'Idle CPU', value: '0%' },
      { label: 'Resident RAM', value: '288 MB' },
      { label: 'Native plugins', value: '10' },
      { label: 'Themes', value: '5' },
    ],
    primaryCta: { label: 'Get it. Free.', href: '#download' },
    secondaryCta: { label: 'See the bench', href: '#benchmarks' },
    glyph: '◆',
    logo: '/logos/discordmaxxer.svg',
    accentHex: '#5865F2',
    screenshots: ['/screenshots/discordmaxxer/hub-panel.png'],
    heroStat: { value: '−753 MB', label: 'vs stock Discord' },
  },
  {
    slug: 'clipmaxxer',
    name: 'Clipmaxxer',
    category: 'Content',
    status: 'soon',
    tagline: 'Stream. Sleep. Wake up posted.',
    description:
      "Eklipse cuts on volume. OpusClip cuts on sentiment. Neither watches today's TikTok. We do.",
    longDescription:
      "Stream tonight. Queue runs overnight. 3 drafts on your phone by morning — captions, sound, hashtags, ready to post.",
    features: [
      {
        title: 'Cascade scoring.',
        body: 'Audio → chat → transcript → virality → trends → HUD. Five layers. Floor is never zero.',
      },
      {
        title: 'Trained on what hit.',
        body: 'Per-game playbooks from clips that actually went viral. Calibrated to your archetype, not the average streamer.',
      },
      {
        title: 'Face stays in frame.',
        body: 'Per-frame OpenCV DNN face-tight reframe. Your eyebrow never ends up cropped.',
      },
      {
        title: '1 VOD. 3 platforms.',
        body: 'TikTok, Shorts, Reels — each its own length, hook, caption, sound. Tap to publish from your couch.',
      },
    ],
    primaryCta: { label: 'Get on the waitlist', href: '#waitlist' },
    secondaryCta: { label: 'See sample clips', href: '#samples' },
    glyph: '✂',
    accentHex: '#00d4ff',
    screenshots: [
      '/screenshots/clipmaxxer/queue-vod.png',
      '/screenshots/clipmaxxer/login-queue.png',
      '/screenshots/clipmaxxer/pricing.png',
    ],
    heroStat: { value: '3 clips', label: 'on your phone by morning' },
  },
  {
    slug: 'dropmaxxer',
    name: 'Dropmaxxer',
    category: 'Fortnite',
    status: 'beta',
    tagline: 'Stop guessing your drop.',
    description:
      "Other tools: last-season's loot map with arrows. Ours: a calculator with cited physics.",
    longDescription:
      "Bus 830 m/s. Auto-deploy 100 m. Cited constants. Current-season POIs only. Pick a path, see the math, drop the right spot.",
    features: [
      {
        title: 'IDW corpus + physics fallback.',
        body: 'Community-data lookup on known paths. Server-side simulator on novel ones. Fast and right, every time.',
      },
      {
        title: 'Current-season POIs.',
        body: 'Refreshed the day each season ships. Reality Falls isn\'t suggested because Reality Falls isn\'t a thing.',
      },
      {
        title: 'Cited physics.',
        body: 'Bus speed: 830 m/s. Auto-deploy: 100 m. Glide and nosedive constants — all sourced. Other tools won\'t print theirs.',
      },
    ],
    primaryCta: { label: 'Get on the waitlist', href: '#waitlist' },
    glyph: '◇',
    accentHex: '#4c51f7',
    screenshots: ['/screenshots/dropmaxxer/preview.png'],
    heroStat: { value: '830 m/s', label: 'bus speed · cited' },
  },
  {
    slug: 'aimmaxxer',
    name: 'Aimmaxxer',
    category: 'Training',
    status: 'soon',
    tagline: 'Aim is four metrics. Not one.',
    description:
      "Sensitivity. Prediction. Anchor. Trigger. We measure all four. Other trainers throw bots and call it data.",
    longDescription:
      "KovaaK's hands you 200 scenarios. We hand you the 4 that fix what's actually broken.",
    features: [
      {
        title: '4 metrics. 4 drills.',
        body: 'Sensitivity, prediction, anchor, trigger — measured separately, drilled separately.',
      },
      {
        title: 'Your sens. Your routine.',
        body: 'Routine adapts to your DPI, sensitivity, and play style. Not the other way around.',
      },
    ],
    primaryCta: { label: 'Get on the waitlist', href: '#waitlist' },
    glyph: '◎',
    accentHex: '#f3af19',
    heroStat: { value: '4', label: 'metrics · not one' },
  },
  {
    slug: 'viewmaxxing',
    name: 'Viewmaxxing',
    category: 'Streamer Tools',
    status: 'soon',
    tagline: 'Stream presence. Under your control.',
    description:
      "Controlled-deployment toolkit. Ratio sentinels live. IP-cluster monitoring real-time. Observation as a first-class feature.",
    longDescription:
      "Ratio and IP-cluster sentinels live. JobRunner orchestrates session lifecycles. Supervised v1 in flight.",
    features: [
      {
        title: 'Sentinels. Live.',
        body: 'Ratio + IP-cluster monitoring real-time. Live visibility into session distribution.',
      },
      {
        title: 'JobRunner.',
        body: 'Lifecycle management — start, monitor, retry, scale, stop. One daemon. Restart-safe.',
      },
    ],
    primaryCta: { label: 'Get on the waitlist', href: '#waitlist' },
    glyph: '◐',
    accentHex: '#10b981',
    heroStat: { value: 'LIVE', label: 'sentinels · real-time' },
  },
  {
    slug: 'editmaxxing',
    name: 'Editmaxxing',
    category: 'Fortnite',
    status: 'soon',
    tagline: 'One mechanic. Done right.',
    description:
      "Scoped tile-selector for build edits. Crosshair on tile, tile selects. No fire automation. No build sequencing.",
    longDescription:
      "Pros use macros on stream. Epic has tolerated build-mechanic macros publicly. We do that one mechanic, tight.",
    features: [
      {
        title: 'Tile selects on hover.',
        body: 'Crosshair lands on a tile, the tile selects. The half-frame fumble disappears.',
      },
      {
        title: '1 mechanic. Nothing else.',
        body: 'No fire automation. No build sequencing. No combos. Stays in the lane Epic publicly tolerated.',
      },
    ],
    primaryCta: { label: 'Get on the waitlist', href: '#waitlist' },
    glyph: '◈',
    accentHex: '#ff6b8b',
    heroStat: { value: '1', label: 'mechanic · done right' },
  },
];

export const liveProducts = products.filter((p) => p.status === 'live');
export const upcomingProducts = products.filter((p) => p.status !== 'live');

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function statusLabel(status: ProductStatus): string {
  switch (status) {
    case 'live':
      return 'Live';
    case 'beta':
      return 'Beta';
    case 'waitlist':
      return 'Waitlist';
    case 'soon':
      return 'Coming soon';
  }
}

/** Two-letter monogram from product name (e.g., "Optimizationmaxxing" → "OM"). */
export function monogram(name: string): string {
  const root = name.replace(/maxx(er|ing)$/i, '');
  return (root[0] + 'M').toUpperCase();
}
