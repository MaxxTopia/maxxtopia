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
    tagline: 'Stream. Sleep. Wake up posted.',
    description:
      "Eklipse cuts on volume spikes. OpusClip cuts on sentiment. Neither one watches what's trending on TikTok today. We do. Stream tonight, queue runs while you sleep, drafts on your phone by morning.",
    longDescription:
      "Every other clipper detects the loud moment and stops there. The loud moment is table stakes — every clipper gets the kill. The hard problem is which kill the algorithm wants today, on which platform, set to which sound, with which hook. That's a matchmaker problem, not a detector problem. Five stages: candidate surfacing → semantic understanding → today's trend snapshot → matchmaker LLM → format-aware render. Per-game playbooks calibrated to your streamer archetype. Multi-game from day one. Face-aware 9:16 reframe so your eyebrow doesn't end up cropped at the worst frame. Stream the VOD, the queue runs overnight on a 2070, and you wake up to three drafts already pushed to your phone — captions written, sound matched, hashtags chosen. Tap to publish from the couch.",
    features: [
      {
        title: 'Cascade. Not cascade-fail.',
        body: "Audio peaks → chat spikes → Whisper transcripts → LLM virality → today's trending sounds → HUD events. Each layer narrows the candidates before the expensive ones run. If the top stage misses, the floor is the best audio-scored clip — never zero. The other tools either run one signal and miss, or run all of them and hand you thirty mediocre clips.",
      },
      {
        title: 'Trained on what actually went viral.',
        body: "Per-game playbooks calibrated from the clips that actually hit, sourced from creators in your niche, refreshed weekly. Your Fortnite VOD doesn't get cut like a Valorant VOD. Your VOD doesn't get cut like Tarik's. The matchmaker calibrates to your archetype, not the average streamer.",
      },
      {
        title: 'Your face stays in the frame.',
        body: "OpenCV DNN face detection running per-frame, face-tight 9:16 reframe. The thing you cared about ends up centered every cut, every time. None of the 'reframe failed, your eyebrow's in the corner' nonsense the bigger names ship.",
      },
      {
        title: 'One VOD. Three drafts. Three platforms.',
        body: "TikTok, Shorts, Reels — each rendered with its own length, hook structure, caption style, and trending sound. Same VOD, three intent-driven cuts. Drafts pushed to your phone via each platform's own inbox. You tap-to-publish from the couch.",
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
  },
  {
    slug: 'dropmaxxer',
    name: 'Dropmaxxer',
    category: 'Fortnite',
    status: 'beta',
    tagline: 'Stop guessing your drop.',
    description:
      "Most drop calculators are last-season's loot map with arrows drawn on it. Ours is a hybrid LT model: IDW-interpolated community data on known paths, server-side physics simulator on novel ones. Bus speed, glide constants, the 100 m auto-deploy — all source-cited.",
    longDescription:
      "The average drop tool is a static screenshot of someone's gut feeling. Ours is a calculator. Hybrid model: community drop corpus IDW-interpolated against verified routes for paths that have been logged, server-side physics simulator running on the rest. Bus speed (830 m/s). Auto-deploy (100 m). Glide and nosedive constants — every number cited from a real source, not the comments under a YouTube guide. Current-season POIs only, refreshed the day each season ships. Pick a path, see the math, drop the right spot.",
    features: [
      {
        title: 'IDW corpus + physics fallback.',
        body: "Community drop data IDW-interpolated against verified routes for paths that have been logged. Server-side physics simulator runs when you ask about a path nobody's measured yet. The lookup is fast and right; the simulator is slow and right; nobody else does both.",
      },
      {
        title: 'Current-season POIs. Always.',
        body: "POI list refreshed the day each season ships. Reality Falls isn't suggested anymore because Reality Falls isn't a thing anymore. The other tools tell you to drop somewhere that hasn't existed for a year.",
      },
      {
        title: 'Cited physics. Show your work.',
        body: 'Bus speed 830 m/s. Auto-deploy 100 m. Glide constant. Nosedive constant. Every number sourced from a real reference, not vibes. The other tools won\'t print their numbers because they\'re guessing them.',
      },
    ],
    primaryCta: { label: 'Get on the waitlist', href: '#waitlist' },
    glyph: '◇',
    accentHex: '#4c51f7',
    screenshots: ['/screenshots/dropmaxxer/preview.png'],
  },
  {
    slug: 'aimmaxxer',
    name: 'Aimmaxxer',
    category: 'Training',
    status: 'soon',
    tagline: 'Aim is four metrics. Not one.',
    description:
      "Sensitivity calibration. Prediction error. Anchor offset. Trigger discipline. Other aim trainers throw bots at you and call it data. We measure each axis separately and drill the one that's costing you frags.",
    longDescription:
      "Aim isn't a single skill. Aim is sensitivity calibration plus prediction error plus anchor offset plus trigger discipline — four independent metrics that diagnose four different mistakes. Throwing thirty scenarios at you doesn't isolate any of them; KovaaK's hands you a 200-scenario library and lets you guess. We measure each axis on its own bench, profile your specific gap, and build the routine from the gap up. Sensitivity calibration and 3D-rotation control loop are live in internal testing — calibration ships first, drills follow.",
    features: [
      {
        title: 'Four metrics. Four drills.',
        body: "Sensitivity, prediction, anchor, trigger — each measured independently, each drilled independently. KovaaK's hands you 200 scenarios. We hand you the four that fix what's actually broken.",
      },
      {
        title: 'Your sens. Your DPI. Your routine.',
        body: "The routine adapts to your DPI, sensitivity, mouse, and play style — not the other way around. The default 'beginner pack' the other trainers ship is a fast track to grooving the wrong muscle memory.",
      },
    ],
    primaryCta: { label: 'Get on the waitlist', href: '#waitlist' },
    glyph: '◎',
    accentHex: '#f3af19',
  },
  {
    slug: 'viewmaxxing',
    name: 'Viewmaxxing',
    category: 'Streamer Tools',
    status: 'soon',
    tagline: 'Stream presence. Under your control.',
    description:
      "A controlled-deployment toolkit for stream operators. Ratio sentinels and IP-cluster monitoring run real-time. JobRunner orchestrates session lifecycles. Built for operators who treat their audience graph as something to monitor, not pretend doesn't exist.",
    longDescription:
      "A toolkit for stream operators who take their audience-side composition seriously. Ratio and IP-cluster sentinels closed in Phase 4+5 and run live, with real-time visibility into session distribution. JobRunner manages session lifecycles end-to-end — start, monitor, retry, scale, stop — from one daemon. The product is currently in supervised end-to-end validation; this entry holds the slot until v1 is hardened. The first toolkit in this category that treats observation as a first-class feature, not an afterthought.",
    features: [
      {
        title: 'Sentinels. Live.',
        body: "Ratio and IP-cluster sentinels closed in Phase 4+5 and run real-time. Live visibility into how your sessions are distributed. The first toolkit in this space that treats observation as a feature, not an afterthought.",
      },
      {
        title: 'JobRunner. One daemon.',
        body: 'Lifecycle management for ViewerSession runs — start, monitor, retry, scale, stop. Orchestrated from one process. Restart-safe. State persisted on disk.',
      },
    ],
    primaryCta: { label: 'Get on the waitlist', href: '#waitlist' },
    glyph: '◐',
    accentHex: '#10b981',
  },
  {
    slug: 'editmaxxing',
    name: 'Editmaxxing',
    category: 'Fortnite',
    status: 'soon',
    tagline: 'One mechanic. Done right.',
    description:
      "A scoped tile-selector for the Fortnite build-edit phase. Crosshair lands on a tile, the tile selects. No fire automation, no build sequencing — one mechanic, scoped tight, intentionally inside the lane Epic has publicly tolerated.",
    longDescription:
      "Pros use macros openly. Epic has stated, on the record, that build-mechanic macros aren't bannable, and pros stream them on camera with no consequences. Editmaxxing is a tightly scoped tile-selector for the build-edit phase: when you're editing a wall, the right tile gets selected on hover. That's the entire feature surface. No fire automation. No build sequencing. No 'build a 90 in three keystrokes' shortcut. One mechanic, done right, kept inside the lane Epic has publicly drawn.",
    features: [
      {
        title: 'Tile selects on hover.',
        body: "Crosshair lands on a tile during the edit phase, the tile selects. The half-frame your hand was going to fumble for it doesn't happen anymore. The mechanic gets cleaner; nothing else changes.",
      },
      {
        title: 'One mechanic. Nothing else.',
        body: "No macro sequencing. No fire automation. No 'instant 90' or 'edit-reset combo' shortcuts. One mechanic, scoped tight, intentionally limited so it stays in the lane Epic has publicly tolerated.",
      },
    ],
    primaryCta: { label: 'Get on the waitlist', href: '#waitlist' },
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
