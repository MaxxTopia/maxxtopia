// Auto-synced from each product's release CI via repository_dispatch.
// See .github/workflows/sync-*-release.yml — every time a new tag
// publishes upstream, the matching JSON gets rewritten and committed.
import dmRelease from './discordmaxxer-release.json';
import omRelease from './optimizationmaxxing-release.json';
import cmRelease from './clipmaxxer-release.json';
import dpRelease from './dropmaxxer-release.json';
import amRelease from './aimmaxxer-release.json';
import vmRelease from './viewmaxxing-release.json';
import emRelease from './editmaxxing-release.json';

// Single shared waitlist URL. Drop a Tally / ConvertKit / MailerLite /
// getwaitlist.com link in PUBLIC_WAITLIST_URL (Cloudflare Pages env
// vars) and every "Get on the waitlist" button across the site flips
// to it instantly.
// Until that's wired, fall back to a mailto: that drafts an email so
// clicks do *something* (silent #waitlist anchors felt broken). Users
// without a configured mailto handler will get a browser prompt — still
// better than nothing happening.
const WAITLIST_URL =
    import.meta.env.PUBLIC_WAITLIST_URL ||
    'mailto:lucidcobra@gmail.com?subject=Maxxer%20suite%20%E2%80%94%20waitlist%20signup&body=Hey%2C%20I%20want%20to%20be%20notified%20when%20more%20maxxer%20products%20ship.%0A%0AProduct%20I%27m%20most%20interested%20in%3A%20%5Bclipmaxxer%20%2F%20dropmaxxer%20%2F%20aimmaxxer%20%2F%20viewmaxxing%20%2F%20editmaxxing%5D%0AHow%20I%20found%20you%3A%20%0A';

export type ProductStatus = 'live' | 'beta' | 'waitlist' | 'soon' | 'dev';

export type DemoVariant = {
  src: string;       // 1080p mp4
  src720?: string;   // smaller mp4 served on mobile
  poster: string;    // still frame shown while loading + fallback
};

/** Alternating full-width "Apple-style" story zone. LIVE products use these
 *  instead of the 3-col features card grid — one zone per feature with a
 *  visual that demonstrates the claim. */
export type ProductZone = {
  eyebrow: string;
  headline: string;
  body: string;
  visual:
    | { kind: 'image'; src: string; alt: string }
    | { kind: 'video'; src: string; src720?: string; poster: string; alt: string }
    | {
        kind: 'bars';
        bars: Array<{ label: string; value: string; ratio: number; accent?: string; emphasize?: boolean }>;
        caption?: string;
      };
};

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
  /** Optional full-width zones that replace the features grid on LIVE pages.
   *  When present, the page renders these instead of the card grid. SOON
   *  products keep the grid until they earn the bespoke treatment. */
  zones?: ProductZone[];
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
  /** Optional demo video that replaces the static hero shot.
   *  If an array is provided, a random variant is picked client-side
   *  on each page load (rotates through edits). */
  demoVideo?: DemoVariant | DemoVariant[];
  /** External live build URL — for beta products that have a working site outside maxxtopia. */
  deployedUrl?: string;
};

export const products: Product[] = [
  {
    slug: 'optimizationmaxxing',
    name: 'Optimizationmaxxing',
    category: 'PC Tuning',
    status: 'live',
    version: omRelease.version,
    tagline: 'Eighty-seven tweaks. Zero placebos.',
    description:
      'The only Windows tuner that shows its work. Every tweak traced to a Microsoft Learn doc or a vendor whitepaper. One UAC prompt applies the whole preset. Snapshot-backed revert, any tweak, any time.',
    longDescription:
      "87 sourced tweaks. 3.6 MB. One UAC prompt to apply the whole preset. Snapshot revert at any time, any tweak.",
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
    primaryCta: omRelease.installerUrl
        ? { label: 'Download for Windows', href: omRelease.installerUrl, external: true }
        : { label: 'Get it. Free.', href: '#download' },
    secondaryCta: omRelease.releasePageUrl
        ? { label: 'Release notes', href: omRelease.releasePageUrl, external: true }
        : { label: "What's new", href: '/updates' },
    glyph: '⚡',
    logo: '/logos/optimizationmaxxing.svg',
    accentHex: '#e25bff',
    screenshots: ['/screenshots/optimizationmaxxing/og.png'],
    demoVideo: [
      {
        src: '/screenshots/optimizationmaxxing/demo.mp4',
        src720: '/screenshots/optimizationmaxxing/demo-720.mp4',
        poster: '/screenshots/optimizationmaxxing/demo-poster.jpg',
      },
      {
        src: '/screenshots/optimizationmaxxing/demo-cut2.mp4',
        src720: '/screenshots/optimizationmaxxing/demo-cut2-720.mp4',
        poster: '/screenshots/optimizationmaxxing/demo-cut2-poster.jpg',
      },
      {
        src: '/screenshots/optimizationmaxxing/demo-cut3.mp4',
        src720: '/screenshots/optimizationmaxxing/demo-cut3-720.mp4',
        poster: '/screenshots/optimizationmaxxing/demo-cut3-poster.jpg',
      },
    ],
    heroStat: { value: '87', label: 'tweaks · zero placebos' },
    zones: [
      {
        eyebrow: '01 · The Audit',
        headline: "Every tweak prints its source.",
        body: 'Microsoft Learn doc. Vendor whitepaper. NVIDIA dev note. The other tuners don\'t cite because they can\'t. We open the citation in your browser before you flip the switch.',
        visual: {
          kind: 'video',
          src: '/screenshots/optimizationmaxxing/_v1_clips/02_f1_tweaks.mp4',
          poster: '/screenshots/optimizationmaxxing/demo-poster.jpg',
          alt: 'Tweak detail view with inline citation URL',
        },
      },
      {
        eyebrow: '02 · The Size',
        headline: "3.6 MB. Hone is 200.",
        body: 'Tauri-on-Rust ships smaller than your discord avatar. No Electron. No 300 MB Chromium binary. Opens in 200 ms.',
        visual: {
          kind: 'bars',
          bars: [
            { label: 'Hone.gg', value: '200 MB', ratio: 1.0 },
            { label: 'Paragon Tweaks', value: '81 MB', ratio: 0.405 },
            { label: 'Optimizationmaxxing', value: '3.6 MB', ratio: 0.018, emphasize: true },
          ],
          caption: 'Installer size · lower is better · 56× smaller than Hone',
        },
      },
      {
        eyebrow: '03 · The Undo',
        headline: "One UAC. Full revert.",
        body: 'Whole preset applies behind a single elevation prompt. Every tweak snapshots its pre-state. Roll any change back at any time — undo isn\'t a paid tier.',
        visual: {
          kind: 'video',
          src: '/screenshots/optimizationmaxxing/_v1_clips/15_f9_reversible.mp4',
          poster: '/screenshots/optimizationmaxxing/demo-poster.jpg',
          alt: 'Snapshot revert UI with timestamped pre-states',
        },
      },
      {
        eyebrow: '04 · The Presets',
        headline: "10 presets. Or roll your own.",
        body: 'Esports · BR · Streamer · Frame Pacing · Tournament FPS · five more. Each one a curated bundle. Each tweak still toggleable. Build a custom preset in the same panel.',
        visual: {
          kind: 'video',
          src: '/screenshots/optimizationmaxxing/_v1_clips/11_f7_proconfigs.mp4',
          poster: '/screenshots/optimizationmaxxing/demo-poster.jpg',
          alt: 'Preset gallery with pro-config bundles',
        },
      },
      {
        eyebrow: '05 · The Measure',
        headline: "Live DPC. Live ping. Live frame time.",
        body: 'DPC latency sparkline. Bufferbloat probe. PCIe link-state readout. We show the before, the after, and the delta — not a "trust me" toggle.',
        visual: {
          kind: 'video',
          src: '/screenshots/optimizationmaxxing/_v1_clips/04_f3_toolkit.mp4',
          poster: '/screenshots/optimizationmaxxing/demo-poster.jpg',
          alt: 'Toolkit panel with DPC sparkline + latency probes',
        },
      },
      {
        eyebrow: '06 · The Hardware',
        headline: "Knows your rig before you do.",
        body: 'Detects CPU vendor, RAM kit, OS build, laptop vs desktop. Hides every tweak that doesn\'t apply. Laptops never see PCIe ASPM off. AMD rigs never see Intel-only flags.',
        visual: {
          kind: 'video',
          src: '/screenshots/optimizationmaxxing/_v1_clips/12_f8_dash_top.mp4',
          poster: '/screenshots/optimizationmaxxing/demo-poster.jpg',
          alt: 'Hardware detection panel with spec readouts',
        },
      },
    ],
  },
  {
    slug: 'discordmaxxer',
    name: 'Discordmaxxer',
    category: 'Communication',
    status: 'live',
    version: dmRelease.version,
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
        body: 'Cursor. Privacy. Trim. Plus 7 more, written as first-class code. Native plugin engine, no third-party runtime tax.',
      },
      {
        title: '5 themes.',
        body: 'Hand-tuned palettes — Maxxer · Valorant · Sonic · DMC · BO3. Pick the vibe that matches your Discord.',
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
    primaryCta: { label: 'Download for Windows', href: dmRelease.installerUrl, external: true },
    secondaryCta: { label: 'Release notes', href: dmRelease.releasePageUrl, external: true },
    glyph: '◆',
    logo: '/logos/discordmaxxer.png',
    accentHex: '#5865F2',
    screenshots: ['/screenshots/discordmaxxer/hub-panel.png'],
    demoVideo: {
      src: '/screenshots/discordmaxxer/demo.mp4',
      src720: '/screenshots/discordmaxxer/demo-720.mp4',
      poster: '/screenshots/discordmaxxer/demo-poster.jpg',
    },
    heroStat: { value: '−753 MB', label: 'vs stock Discord' },
    zones: [
      {
        eyebrow: '01 · The Cut',
        headline: "Stock Discord weighs 1,041 MB.",
        body: 'We strip the part where Discord pretends to be a browser running a chat app. Same servers, same friends, same pings — 753 MB lighter on the resident set.',
        visual: {
          kind: 'bars',
          bars: [
            { label: 'Stock Discord', value: '1,041 MB', ratio: 1.0 },
            { label: 'Discordmaxxer', value: '288 MB', ratio: 0.277, emphasize: true },
          ],
          caption: 'Resident RAM · same workload · measured idle on Windows 11',
        },
      },
      {
        eyebrow: '02 · Tournament Mode',
        headline: "0% idle CPU. Pinned.",
        body: 'Tournament Mode v3 cuts wakeups, ticks down background polling, and parks the renderer when you\'re focused on the game. Discord stays connected. Your frame pacing stays flat.',
        visual: {
          kind: 'video',
          src: '/screenshots/discordmaxxer/_v8_clips/03_stat1.mp4',
          poster: '/screenshots/discordmaxxer/demo-poster.jpg',
          alt: 'Tournament Mode toggle with idle CPU at 0%',
        },
      },
      {
        eyebrow: '03 · The Plugins',
        headline: "10 plugins. First-class code.",
        body: 'Native plugin engine — no third-party runtime tax. Cursor, Privacy, Trim, plus seven more. Each one written as TypeScript, compiled with the client, signed with the same key.',
        visual: {
          kind: 'video',
          src: '/screenshots/discordmaxxer/_v8_clips/06_branded.mp4',
          poster: '/screenshots/discordmaxxer/demo-poster.jpg',
          alt: 'Plugin panel showing 10 native plugins',
        },
      },
      {
        eyebrow: '04 · No Phone-Home',
        headline: "Opens what you sent. Nothing else.",
        body: 'Stock Discord opens calls to telemetry, ad-tech, and crash-pipeline domains the moment it launches. We strip every one of those. You ping who you meant to ping.',
        visual: {
          kind: 'bars',
          bars: [
            { label: 'Stock Discord · outbound domains on launch', value: '14', ratio: 1.0 },
            { label: 'Discordmaxxer · outbound domains on launch', value: '0', ratio: 0.0, emphasize: true },
          ],
          caption: 'Before you type a single message · measured via packet capture',
        },
      },
      {
        eyebrow: '05 · The Themes',
        headline: "5 hand-tuned palettes.",
        body: 'Maxxer · Valorant · Sonic · DMC · BO3. Five complete colorways — not skins, not CSS hacks. Each one re-paints the entire client without breaking native UI.',
        visual: {
          kind: 'video',
          src: '/screenshots/discordmaxxer/_v8_clips/07_themes.mp4',
          poster: '/screenshots/discordmaxxer/demo-poster.jpg',
          alt: 'Five-theme palette switcher',
        },
      },
    ],
  },
  {
    slug: 'clipmaxxer',
    name: 'Clipmaxxer',
    category: 'Content',
    status: 'soon',
    version: cmRelease.version ?? undefined,
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
    primaryCta: cmRelease.installerUrl
        ? { label: 'Download for Windows', href: cmRelease.installerUrl, external: true }
        : { label: 'Get on the waitlist', href: WAITLIST_URL, external: true },
    secondaryCta: cmRelease.releasePageUrl
        ? { label: 'Release notes', href: cmRelease.releasePageUrl, external: true }
        : { label: 'See sample clips', href: '#samples' },
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
    version: dpRelease.version ?? undefined,
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
    primaryCta: dpRelease.installerUrl
        ? { label: 'Download for Windows', href: dpRelease.installerUrl, external: true }
        : { label: 'Get on the waitlist', href: WAITLIST_URL, external: true },
    secondaryCta: dpRelease.releasePageUrl
        ? { label: 'Release notes', href: dpRelease.releasePageUrl, external: true }
        : undefined,
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
    version: amRelease.version ?? undefined,
    tagline: 'Aim is four metrics. Not one.',
    description: 'In development.',
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
    primaryCta: amRelease.installerUrl
        ? { label: 'Download for Windows', href: amRelease.installerUrl, external: true }
        : { label: 'Get on the waitlist', href: WAITLIST_URL, external: true },
    secondaryCta: amRelease.releasePageUrl
        ? { label: 'Release notes', href: amRelease.releasePageUrl, external: true }
        : undefined,
    glyph: '◎',
    accentHex: '#f3af19',
    heroStat: { value: '4', label: 'metrics · not one' },
  },
  {
    slug: 'viewmaxxing',
    name: 'Viewmaxxing',
    category: 'Streamer Tools',
    status: 'soon',
    version: vmRelease.version ?? undefined,
    tagline: 'A tool for streamers.',
    description: 'In development.',
    longDescription:
      "A streamer toolkit in scope research. The framing will land when we lock the angle worth shipping.",
    features: [
      {
        title: 'Streamer-side.',
        body: 'Built for the operator, not the viewer. Past that — the framing is in flux.',
      },
      {
        title: 'Slot reserved.',
        body: 'We hold the slot until the direction is worth shipping. We don\'t ship to fill space.',
      },
    ],
    primaryCta: vmRelease.installerUrl
        ? { label: 'Download for Windows', href: vmRelease.installerUrl, external: true }
        : { label: 'Get on the waitlist', href: WAITLIST_URL, external: true },
    secondaryCta: vmRelease.releasePageUrl
        ? { label: 'Release notes', href: vmRelease.releasePageUrl, external: true }
        : undefined,
    glyph: '◐',
    accentHex: '#10b981',
    heroStat: { value: 'TBD', label: 'direction in flux' },
  },
  {
    slug: 'extensionmaxxing',
    name: 'Extensionmaxxing',
    category: 'Extensions',
    status: 'soon',
    version: emRelease.version ?? undefined,
    tagline: '',
    description: '',
    longDescription: '',
    features: [],
    primaryCta: emRelease.installerUrl
        ? { label: 'Download for Windows', href: emRelease.installerUrl, external: true }
        : { label: 'Notify me if it ships', href: WAITLIST_URL, external: true },
    secondaryCta: emRelease.releasePageUrl
        ? { label: 'Release notes', href: emRelease.releasePageUrl, external: true }
        : undefined,
    glyph: '◈',
    accentHex: '#ff6b8b',
    heroStat: { value: '✕', label: 'on research hold' },
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
    case 'dev':
      return 'In development';
  }
}

/** Two-letter monogram from product name (e.g., "Optimizationmaxxing" → "OM"). */
export function monogram(name: string): string {
  const root = name.replace(/maxx(er|ing)$/i, '');
  return (root[0] + 'M').toUpperCase();
}
