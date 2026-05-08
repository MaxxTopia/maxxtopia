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
    tagline: 'Tune your PC like a pro.',
    description:
      'A native desktop tuner that ships 87 hand-curated, source-cited tweaks across 10 presets. One UAC prompt. Full revert. No telemetry.',
    longDescription:
      'Built in Rust + Tauri 2 — 3.6 MB installer, no Electron bloat. Each tweak is rig-targeted, audited against Microsoft Learn, and reversibly snapshotted to SQLite. Includes live DPC monitoring, latency probes, VBS/HVCI detection, and a custom preset builder. The tuner that measures, not just applies.',
    features: [
      {
        title: '87 audited tweaks',
        body: 'Every entry traced to a verifiable Microsoft Learn or vendor source. Placebos rejected on principle.',
      },
      {
        title: '10 presets, custom builder',
        body: 'Esports, BR, Streamer, Frame Pacing, Calm Mode, Tournament FPS, Clean State Gaming + 3 more. Or build your own.',
      },
      {
        title: 'Single-UAC apply',
        body: 'Whole preset applies behind one elevation prompt. Snapshot-backed revert. Undo any tweak, anytime.',
      },
      {
        title: 'DPC + latency monitoring',
        body: 'Live per-CPU DPC sparkline, scheduled latency probes, PCIe link diagnostics. Measure before/after.',
      },
      {
        title: 'Rig-aware recommendations',
        body: 'Detects CPU vendor, RAM, OS build, laptop/desktop. Surfaces only tweaks that match your hardware.',
      },
      {
        title: 'Native, not Electron',
        body: '3.6 MB installer. ~30 MB RAM idle. Compare to Hone (heavy) or Paragon (81 MB).',
      },
    ],
    stats: [
      { label: 'Curated tweaks', value: '87' },
      { label: 'Presets', value: '10' },
      { label: 'Installer size', value: '3.6 MB' },
      { label: 'RAM at idle', value: '~30 MB' },
    ],
    primaryCta: { label: 'Download for Windows', href: '#download' },
    secondaryCta: { label: 'See changelog', href: '/changelog' },
    glyph: '⚡',
    logo: '/logos/optimizationmaxxing.svg',
    accentHex: '#e25bff',
    screenshots: ['/screenshots/optimizationmaxxing/og.png'],
  },
  {
    slug: 'discordmaxxer',
    name: 'Discordmaxxer',
    category: 'Communication',
    status: 'live',
    version: 'v0.1',
    tagline: 'Discord, optimized.',
    description:
      'A drop-in Discord client built for performance. Ten custom plugins, five themes, sub-300 MB memory footprint.',
    longDescription:
      'Forked from Vesktop and rebuilt around Tournament Mode v3 — a perf profile that strips animations, lazy-loads guilds, and idles at 0% CPU. Ships with Cursor, Privacy, and Trim plugins, plus a 5-theme system, custom sounds, and an Apple-grade icon. The Discord experience for people who actually care about latency.',
    features: [
      {
        title: 'Tournament Mode v3',
        body: '0% CPU at idle. 288 MB RAM vs 1041 MB on stock Discord. Tested in production over 9 commits.',
      },
      {
        title: '10 custom plugins',
        body: 'Cursor, Privacy, Trim, plus 7 more — built natively, not bolted on. No Vencord scripting required.',
      },
      {
        title: '5-theme system',
        body: 'Hand-tuned palettes plus per-theme sound packs. Your Discord, your aesthetic.',
      },
      {
        title: 'Privacy-first',
        body: 'No telemetry. No remote calls. Local-only logging. Source available.',
      },
    ],
    stats: [
      { label: 'CPU at idle', value: '0%' },
      { label: 'RAM', value: '288 MB' },
      { label: 'Plugins', value: '10' },
      { label: 'Themes', value: '5' },
    ],
    primaryCta: { label: 'Download v0.1', href: '#download' },
    secondaryCta: { label: 'See benchmarks', href: '#benchmarks' },
    glyph: '◆',
    logo: '/logos/discordmaxxer.svg',
    accentHex: '#5865F2',
    screenshots: ['/screenshots/discordmaxxer/hub-panel.png'],
  },
  {
    slug: 'clipmaxxer',
    name: 'Clipmaxxer',
    category: 'Content',
    status: 'soon',
    tagline: 'Auto-clip viral moments from your VODs.',
    description:
      'A 5-stage matchmaker that finds the moments worth posting and renders them for TikTok, Shorts, and Reels.',
    longDescription:
      'Most clippers cut on volume spikes. Clipmaxxer cross-references gameplay events, chat reactions, on-screen HUD, and per-platform virality patterns to pick the moments that will actually win. Per-niche playbooks calibrate to your streamer archetype. Multi-game (Fortnite, Valorant, more) with face-aware recentering.',
    features: [
      {
        title: 'Cascade scoring',
        body: 'Audio → chat → Whisper → LLM virality → trending → HUD. Five passes, with fallbacks.',
      },
      {
        title: 'Per-niche playbooks',
        body: 'TikTok-trained matchmakers calibrated from real viral creators in your game.',
      },
      {
        title: 'Face-aware framing',
        body: 'OpenCV DNN + face-tight crop. No more your eyebrow getting cropped at the worst frame.',
      },
      {
        title: 'Per-platform output',
        body: 'TikTok, Shorts, Reels — each gets the right length, hook, and aspect for the platform.',
      },
    ],
    primaryCta: { label: 'Join the waitlist', href: '#waitlist' },
    secondaryCta: { label: 'See sample clips', href: '#samples' },
    glyph: '✂',
    accentHex: '#00d4ff',
    screenshots: [
      '/screenshots/clipmaxxer/queue-vod.png',
      '/screenshots/clipmaxxer/login-queue.png',
      '/screenshots/clipmaxxer/pricing.png',
    ],
  },
  {
    slug: 'dropmaxxer',
    name: 'Dropmaxxer',
    category: 'Fortnite',
    status: 'beta',
    tagline: 'Pick the best Fortnite drop spot, every game.',
    description:
      'A drop calculator that cross-references real bus path physics, current-season POIs, and live community data.',
    longDescription:
      'Built on a hybrid LT-first model — cross-checked against the live community corpus and a server-side physics simulator as fallback. Ships with current-season POIs only (never stale data) and source-backed BR drop physics. The drop tool that runs the math instead of guessing.',
    features: [
      {
        title: 'Hybrid LT model',
        body: 'IDW corpus lookup against verified community data, with simulator fallback for novel paths.',
      },
      {
        title: 'Current-season only',
        body: 'POIs auto-refresh every season. No stale Reality Falls suggestions.',
      },
      {
        title: 'Source-backed physics',
        body: 'Bus 830m. Auto-deploy 100m. Real glide and nosedive constants. Cited.',
      },
    ],
    primaryCta: { label: 'Join the waitlist', href: '#waitlist' },
    glyph: '◇',
    accentHex: '#4c51f7',
    screenshots: ['/screenshots/dropmaxxer/preview.png'],
  },
  {
    slug: 'aimmaxxer',
    name: 'Aimmaxxer',
    category: 'Training',
    status: 'soon',
    tagline: 'AI-driven aim training.',
    description:
      'A training rig that profiles your sensitivity, tracking, flicking, and microadjust — then drills the gap.',
    longDescription:
      'Most aim trainers throw bots at you and call it data. Aimmaxxer measures sensitivity calibration, prediction error, anchor offset, and trigger discipline as separate metrics — then builds your routine from the gap. Sensitivity calibration and 3D rotation control loop are live in internal testing.',
    features: [
      {
        title: 'Per-axis profiling',
        body: 'Sensitivity, prediction, anchor, trigger — measured separately, drilled separately.',
      },
      {
        title: 'Calibration first',
        body: 'Your routine adapts to your DPI, sensitivity, and play style — not the other way around.',
      },
    ],
    primaryCta: { label: 'Join the waitlist', href: '#waitlist' },
    glyph: '◎',
    accentHex: '#f3af19',
  },
  {
    slug: 'viewmaxxing',
    name: 'Viewmaxxing',
    category: 'Streamer Tools',
    status: 'soon',
    tagline: 'Stream presence engine.',
    description:
      'Audience-side tooling for streamers. Phase 4+5 sentinels live, Phase 2 in interactive debug.',
    longDescription:
      'A controlled-deployment toolkit for stream operators. Ratio and IP-cluster sentinels are live; the JobRunner orchestrates session lifecycle. Currently undergoing supervised end-to-end validation.',
    features: [
      {
        title: 'Ratio + IP-cluster sentinels',
        body: 'Phase 4+5 closed. Live monitoring of session distribution.',
      },
      {
        title: 'JobRunner orchestration',
        body: 'Lifecycle management for ViewerSession runs.',
      },
    ],
    primaryCta: { label: 'Join the waitlist', href: '#waitlist' },
    glyph: '◐',
    accentHex: '#10b981',
  },
  {
    slug: 'editmaxxing',
    name: 'Editmaxxing',
    category: 'Fortnite',
    status: 'soon',
    tagline: 'Build editing assistant for Fortnite.',
    description:
      'A focused build-edit assistant for one mechanic. Pros use macros openly; we made one that respects the game.',
    longDescription:
      "Pros use macros openly — Epic stated they're not bannable, and pros have been caught on stream with no action taken. Editmaxxing is a personal-use tile-selector for build edits, scoped tightly to a single mechanic.",
    features: [
      {
        title: 'Tile selection on hover',
        body: 'Auto-select build tiles under your crosshair during the edit phase.',
      },
      {
        title: 'Scoped to one mechanic',
        body: "No macro sequencing. No fire automation. One feature, done well.",
      },
    ],
    primaryCta: { label: 'Join the waitlist', href: '#waitlist' },
    glyph: '◈',
    accentHex: '#ff6b8b',
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
