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
    tagline: 'Eighty-seven tweaks. Zero placebos.',
    description:
      'The only Windows tuner that shows its work. Every tweak traced to a Microsoft Learn doc or a vendor whitepaper. One UAC prompt applies the whole preset. Snapshot-backed revert, any tweak, any time.',
    longDescription:
      "Most Windows tuners are batch scripts in a UI costume — Hone is a 200 MB Electron app, Paragon is 81 MB, half of them are someone's Discord script with a Stripe button taped on. Ours is 3.6 MB of native Rust running on Tauri 2. Opens in 200 ms. Idles at 30 MB. Eighty-seven tweaks, every one cited from Microsoft Learn or a vendor whitepaper, every one rig-targeted and snapshot-backed in SQLite. Apply a whole preset behind a single UAC prompt. Roll any tweak back the second you don't like the feel. Built for the people who count their frame times.",
    features: [
      {
        title: 'Sourced — or it\'s not in here.',
        body: "Every tweak traced to a Microsoft Learn doc, a vendor whitepaper, or a published kernel reference. If we couldn't find a primary source, we didn't ship it. The average tuner is a YouTuber-tier list of registry edits with zero citations, half of which contradict each other.",
      },
      {
        title: 'Ten presets. Or build your own.',
        body: "Esports. BR. Streamer. Frame Pacing. Calm Mode. Tournament FPS. Clean State Gaming. Plus three more. Don't like the curated picks? Open the custom builder and toggle the other seventy-seven tweaks one at a time. Your machine, your call.",
      },
      {
        title: 'One UAC. Full undo.',
        body: "Whole preset goes on behind a single elevation prompt — not the eight most tuners ask for. Every change snapshot-backed in SQLite. Undo any single tweak the second you don't like how it feels. Undo isn't gated behind a paid tier here.",
      },
      {
        title: 'Measure first. Then tune.',
        body: 'Live per-CPU DPC sparkline. Scheduled latency probes. VBS / HVCI detection. PCIe link diagnostics. The other tuners flip registry keys and call it done. We show you the before, the after, and exactly what changed.',
      },
      {
        title: 'Knows your rig. Knows what to skip.',
        body: "Detects CPU vendor, RAM type, OS build, laptop or desktop. Hides every tweak that doesn't apply. You'll never have to ask whether something's for AMD or Intel — it already filtered.",
      },
      {
        title: '3.6 MB. Native. Not Electron.',
        body: 'Hone is 200 MB. Paragon is 81 MB. We are 3.6 MB of Rust on Tauri 2, idling at 30 MB of RAM, opening in 200 ms. The tool is fast because we wrote the tool to be fast.',
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
      "Discord ships as an Electron app cosplaying as a chat client — 1,041 MB resident on a fresh boot, 30–50% CPU at idle, and an animation budget that reminds you the app exists. We forked Vesktop, took the bloat off the bone, and rebuilt the perf profile around Tournament Mode v3: zero idle CPU, 288 MB resident, lazy-loaded guilds, no telemetry. Ten plugins written native, five themes with their own sound packs, and a privacy posture that doesn't phone home. Same Discord. Same servers. Same friends. Half the weight, none of the leash.",
    features: [
      {
        title: 'Tournament Mode v3 — 0% CPU. 288 MB.',
        body: "Idle CPU drops to flat zero. Resident RAM lands at 288 MB versus stock Discord's 1,041 on the same machine. Animations stripped. Guild list lazy-loaded. Perf-profile shipped after nine production commits, benched on real hardware. The before-chart and the after-chart aren't on the same scale.",
      },
      {
        title: 'Ten plugins. Built native.',
        body: "Cursor. Privacy. Trim. Plus seven more — written as first-class native code, not Vencord scripts bolted on at runtime. They load with the app, never break on Discord's next API shift, and don't add a Discord-DOM tax.",
      },
      {
        title: 'Five themes. Five sound packs.',
        body: "Hand-tuned palettes. Each one ships with its own sound pack. Your Discord, your aesthetic — not a beige skin engine that ate three Vencord plugins to render.",
      },
      {
        title: 'No telemetry. No phone-home.',
        body: "Zero remote calls outside the conversation traffic you opt into. Local-only logging. Source available. The official client opens 14 connections to 6 domains on launch — ours opens what your messages need, and nothing else.",
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
