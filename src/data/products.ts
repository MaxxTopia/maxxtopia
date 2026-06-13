// Auto-synced from each product's release CI via repository_dispatch.
// See .github/workflows/sync-*-release.yml — every time a new tag
// publishes upstream, the matching JSON gets rewritten and committed.
import dmRelease from './discordmaxxer-release.json';
import omRelease from './optimizationmaxxing-release.json';
import cmRelease from './clipmaxxer-release.json';
import dpRelease from './dropmaxxer-release.json';
import amRelease from './aimmaxxer-release.json';
import vmRelease from './viewmaxxing-release.json';

// Single shared waitlist URL. Drop a Tally / ConvertKit / MailerLite /
// getwaitlist.com link in PUBLIC_WAITLIST_URL (Cloudflare Pages env
// vars) and every "Get on the waitlist" button across the site flips
// to it instantly.
// Until that's wired, fall back to the live Discord — launches are
// announced there first (#announcements + per-product forum threads),
// so "join for updates" actually works, with no backend to maintain and
// no personal email exposed in the page source.
const WAITLIST_URL =
    import.meta.env.PUBLIC_WAITLIST_URL ||
    'https://discord.gg/S78eecbWdx';

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
    tagline: 'One hundred tweaks. Zero placebos.',
    description:
      'The only Windows tuner that shows its work. Every tweak traced to a Microsoft Learn doc or a vendor whitepaper. One UAC prompt applies the whole preset. Snapshot-backed revert, any tweak, any time.',
    longDescription:
      "100 sourced tweaks. 3.6 MB. One UAC prompt to apply the whole preset. Snapshot revert at any time, any tweak.",
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
      { label: 'Audited tweaks', value: '100' },
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
    heroStat: { value: '100', label: 'tweaks · zero placebos' },
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
      "Calibrated on the viral creators in your game — not on generic audio-volume rules. Three platform-ready clips on your phone by morning.",
    longDescription:
      "Per-niche playbook distilled from real viral creators in your game. Stream tonight; overnight queue scores your VOD against those patterns. Three platform-ready drafts on your phone by morning.",
    features: [
      {
        title: 'Per-niche playbook.',
        body: 'Real viral creators in your game — analyzed, patterns extracted, encoded into the matchmaker.',
      },
      {
        title: 'Face stays in frame.',
        body: 'Per-frame OpenCV DNN face-tight reframe. Subject re-centered every frame, never cropped.',
      },
      {
        title: '1 VOD. 3 platforms.',
        body: 'TikTok, Shorts, Reels — each its own length, hook, caption, sound.',
      },
    ],
    primaryCta: cmRelease.installerUrl
        ? { label: 'Download for Windows', href: cmRelease.installerUrl, external: true }
        : { label: 'Get on the waitlist', href: WAITLIST_URL, external: true },
    secondaryCta: cmRelease.releasePageUrl
        ? { label: 'Release notes', href: cmRelease.releasePageUrl, external: true }
        : undefined,
    glyph: '✂',
    accentHex: '#00d4ff',
    // Hero screenshot dropped: the three dev-UI PNGs (queue/login/pricing)
    // looked cropped in the 3-up 9:16 grid and aren't shippable marketing.
    // queue-vod.png reappears once below in the "Queue" zone where it fits
    // a 16:10 frame correctly. Real marketing screenshots land before launch.
    heroStat: { value: '3 clips', label: 'on your phone by morning' },
    zones: [
      {
        eyebrow: '01 · The Playbook',
        headline: "We score on what's hitting. Not on what's loud.",
        body: "Per-niche viral playbook. We ingest the actual creators going viral in your game — their viral signals, anti-signals, stylebooks — and score your VOD against THAT. Eklipse scores on audio volume. OpusClip scores on sentiment. Neither watches your scene.",
        visual: {
          kind: 'bars',
          bars: [
            { label: 'Eklipse · audio-volume threshold', value: '1 signal', ratio: 0.18 },
            { label: 'OpusClip · sentiment scoring', value: '1 signal', ratio: 0.18 },
            { label: 'Clipmaxxer · per-niche creator playbook', value: 'multi-signal', ratio: 1.0, emphasize: true },
          ],
          caption: 'Scoring source · generic threshold vs per-niche playbook',
        },
      },
      {
        eyebrow: '02 · The Research',
        headline: "We watch the shorts before we pick yours.",
        body: "For each game we analyze viral shorts from the creators actually winning in that niche. Patterns get distilled into a playbook YAML, injected into the matchmaker prompt. Generic clippers don't know what's viral in your scene — we do, because we did the homework.",
        visual: {
          kind: 'bars',
          bars: [
            { label: 'Valorant · creator playbook live', value: 'in build', ratio: 1.0, emphasize: true },
            { label: 'Fortnite · creator playbook live', value: 'in build', ratio: 1.0, emphasize: true },
            { label: 'Additional niches · queued', value: 'in research', ratio: 0.5 },
          ],
          caption: 'Per-niche playbook coverage · expanded each release',
        },
      },
      {
        eyebrow: '03 · The Queue',
        headline: "You approve. We render.",
        body: "Overnight queue scores every action moment in your VOD. Top candidates surface in the morning — you swipe approve / reject before any platform render burns. The matchmaker proposes; you commit.",
        visual: {
          kind: 'image',
          src: '/screenshots/clipmaxxer/queue-vod.png',
          alt: 'Clipmaxxer queue with candidate clips ranked by playbook score',
        },
      },
      {
        eyebrow: '04 · The Format',
        headline: "1 VOD. 3 platforms. 3 cuts.",
        body: "TikTok, Shorts, Reels — each its own length, hook, caption, sound. Tap once on your phone in the morning. Drafts ready before you read your texts.",
        visual: {
          kind: 'bars',
          bars: [
            { label: 'TikTok · 9:16 · short hook', value: 'platform fit', ratio: 1.0, emphasize: true },
            { label: 'YouTube Shorts · 9:16 · YT hook', value: 'platform fit', ratio: 1.0, emphasize: true },
            { label: 'Instagram Reels · 9:16 · IG hook', value: 'platform fit', ratio: 1.0, emphasize: true },
          ],
          caption: '3 cuts · one queue run · each tuned for its platform',
        },
      },
    ],
  },
  {
    slug: 'dropmaxxer',
    name: 'Dropmaxxer',
    category: 'Fortnite',
    status: 'beta',
    version: dpRelease.version ?? undefined,
    tagline: 'Stop guessing your drop.',
    description:
      "Two routes for every POI: cut-and-free-fall fast, or glide in safe. Built for the glider-cut meta. Current-season POIs.",
    longDescription:
      "Built for the new glider-cut mechanic: get the fastest cut-and-free-fall line and the safe glide line for any POI — both ETAs, the exact cut point, and the highest-ground spot to land first. Community-data lookup when your path matches the corpus; calibrated physics simulator when it doesn't. Current-season POIs, refreshed every season.",
    features: [
      {
        title: 'Fastest vs Safe.',
        body: 'Cut the glider and free-fall for the quickest landing, or glide in safe. Both ETAs, the exact spot to cut, and roll-land guidance to keep full HP.',
      },
      {
        title: 'Two solvers. One answer.',
        body: 'Community-data lookup when your path matches the corpus. Physics simulator on novel paths.',
      },
      {
        title: 'Current-season POIs.',
        body: 'Refreshed every season — sourced from the live game catalog. No legacy names.',
      },
      {
        title: 'Cited constants.',
        body: 'Bus 75 m/s at 832 m. Auto-deploy 100 m. Glide and nosedive published, not hidden.',
      },
    ],
    // Dropmaxxer is a browser app (no installer) — launch it directly.
    primaryCta: { label: 'Launch Dropmaxxer', href: 'https://dropmaxxer.pages.dev', external: true },
    secondaryCta: dpRelease.releasePageUrl
        ? { label: 'Release notes', href: dpRelease.releasePageUrl, external: true }
        : undefined,
    glyph: '◇',
    accentHex: '#4c51f7',
    screenshots: ['/screenshots/dropmaxxer/preview.png'],
    heroStat: { value: '832 m', label: 'bus altitude · cited' },
    zones: [
      {
        eyebrow: '01 · The Constants',
        headline: "Four numbers. All published.",
        body: "Bus speed, auto-deploy altitude, glide speed, nosedive speed. The four numbers every drop calc needs — and the four every loot-map tool refuses to print. The math is in the page header, not buried in a Discord.",
        visual: {
          kind: 'bars',
          bars: [
            { label: 'Bus speed', value: '~75 m/s', ratio: 1.0, emphasize: true },
            { label: 'Nosedive (terminal)', value: '~60 m/s', ratio: 0.8 },
            { label: 'Glide (horizontal)', value: '~17 m/s', ratio: 0.23 },
            { label: 'Auto-deploy altitude', value: '100 m', ratio: 0.35 },
          ],
          caption: 'Constants published with the build · cross-referenced against community research',
        },
      },
      {
        eyebrow: '02 · The Algorithm',
        headline: "Community data first. Physics solver second.",
        body: "Two solvers, one decision. If your drop matches our corpus (47 current-season POIs × 4 bus paths) we serve the community-tested answer. If it doesn't, the calibrated physics simulator runs the math. Every result carries the badge — you see which one answered.",
        visual: {
          kind: 'bars',
          bars: [
            { label: 'LT-EXACT · community match within tight bound', value: 'corpus answer', ratio: 1.0, emphasize: true },
            { label: 'LT-NEAR · community match within loose bound', value: 'corpus answer', ratio: 0.78, emphasize: true },
            { label: 'SIMULATOR · novel path · physics solves it', value: 'physics fallback', ratio: 0.55 },
          ],
          caption: 'Solver transparency · UI badge on every drop tells you which answered',
        },
      },
      {
        eyebrow: '03 · The Map',
        headline: "Current season only.",
        body: "Reality Falls is not suggested because Reality Falls is not a thing. POIs are sourced from the live game catalog and refresh the day a season ships. No legacy names. No arrows pointing at last-chapter rubble.",
        visual: {
          kind: 'image',
          src: '/screenshots/dropmaxxer/preview.png',
          alt: 'Dropmaxxer drop-path preview with current-season POIs',
        },
      },
    ],
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
    zones: [
      {
        eyebrow: '01 · The Metrics',
        headline: "Aim is four things. Drilled four ways.",
        body: 'Sensitivity, prediction, anchor, trigger. KovaaK\'s hands you 200 scenarios. We measure the 4 that fix what\'s actually broken, and drill each separately.',
        visual: {
          kind: 'bars',
          bars: [
            { label: 'Sensitivity', value: 'scenario set A', ratio: 1.0, emphasize: true },
            { label: 'Prediction', value: 'scenario set B', ratio: 1.0, emphasize: true },
            { label: 'Anchor', value: 'scenario set C', ratio: 1.0, emphasize: true },
            { label: 'Trigger discipline', value: 'scenario set D', ratio: 1.0, emphasize: true },
          ],
          caption: 'Four independent measurements · four independent drills',
        },
      },
      {
        eyebrow: '02 · The Routine',
        headline: "Adapts to your sens.",
        body: 'Your DPI, your in-game sensitivity, your play style. The routine flexes around them — not the other way around. No "use 800 DPI" prescriptions.',
        visual: {
          kind: 'bars',
          bars: [
            { label: 'KovaaK\'s — fixed sens prescription', value: 'static', ratio: 1.0 },
            { label: 'Aimmaxxer — per-player adaptive', value: 'dynamic', ratio: 1.0, emphasize: true },
          ],
          caption: 'Calibration model · static vs adaptive',
        },
      },
    ],
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
    zones: [
      {
        eyebrow: '01 · The Side',
        headline: "Built for the operator. Not the viewer.",
        body: 'Every streamer dashboard pretends to serve everyone. Past that — what makes the operator faster, calmer, less interrupted — is where we\'re looking. The angle is in flux on purpose.',
        visual: {
          kind: 'bars',
          bars: [
            { label: 'Stream Deck, OBS, Streamlabs — generic ops', value: 'multi-audience', ratio: 1.0 },
            { label: 'Viewmaxxing — operator-first only', value: 'single-audience', ratio: 1.0, emphasize: true },
          ],
          caption: 'Design target · operator vs operator+viewer',
        },
      },
      {
        eyebrow: '02 · The Standard',
        headline: "We hold the slot. We don’t fill it.",
        body: 'We don\'t ship to fill space in the suite. The slot stays reserved until the direction is worth shipping. When it is, the page will say what it is — not what we hope it might be.',
        visual: {
          kind: 'bars',
          bars: [
            { label: 'Hype-ship — promise first, build later', value: 'industry norm', ratio: 1.0 },
            { label: 'Slot-reserve — direction first, page later', value: 'our standard', ratio: 1.0, emphasize: true },
          ],
          caption: 'Shipping ethic · slot reserved until the angle lands',
        },
      },
    ],
  },
  {
    slug: 'extensionmaxxing',
    name: 'AdBlock-Maxxer',
    category: 'Browser Extension',
    status: 'live',
    version: '1.2.7',
    tagline: "The ad blocker they couldn't ban.",
    description:
      "uBlock got gutted on Chrome and locked out everywhere else. AdBlockMaxxer is built native to the new standard (Manifest V3), so it loads on Brave, Chrome, Edge and Firefox with no 'unsupported' wall. It kills ads on YouTube, Spotify and Twitch — and keeps Twitch at full 1080p instead of dropping you to 480p like every other Twitch blocker.",
    longDescription:
      "One extension. Four browsers. YouTube, Spotify, Twitch + 21,370 filter rules — and Twitch stays full quality.",
    features: [
      {
        title: 'Loads where the others got banned.',
        body: 'Manifest V3-native, so it installs on Brave, Chrome, Edge and Firefox. No more "this extension isn\'t supported" wall when you leave Brave.',
      },
      {
        title: 'Twitch ads gone. 1080p stays.',
        body: 'A stream-swap during ad breaks keeps you at full 1080p60. Every other Twitch blocker drops you to 480p with a "blocking ads" banner.',
      },
      {
        title: "YouTube that doesn't freeze.",
        body: 'Strips the ad slots out of the player before it loads — no skip-button race, no stuck player you have to refresh.',
      },
      {
        title: '21,370 rules + per-site control.',
        body: 'EasyList + EasyPrivacy network blocking, a cosmetic ad-box hider, and a one-click "pause on this site" — all toggleable.',
      },
      {
        title: 'Updates itself.',
        body: 'Filter lists and the Twitch fix refresh on a weekly schedule, so it keeps working when the ad networks change the game.',
      },
      {
        title: 'Honest about your iPhone.',
        body: "Apple bans real extensions on iOS — so instead of pretending, we ship the exact DNS + app setup that actually kills your phone's ads.",
      },
    ],
    stats: [
      { label: 'Browsers', value: '4' },
      { label: 'Filter rules', value: '21,370' },
      { label: 'Twitch quality', value: '1080p60' },
      { label: 'Price', value: 'Free' },
    ],
    heroStat: { value: '0', label: 'ads · every browser' },
    zones: [
      {
        eyebrow: '01 · The Ban',
        headline: 'Loads where uBlock got locked out.',
        body: "Google killed Manifest V2 — the thing the old blockers were built on — so they got gutted on Chrome and refused to install on Edge. AdBlockMaxxer is written native to Manifest V3, so it loads on all four major browsers without the \"unsupported\" wall.",
        visual: {
          kind: 'bars',
          bars: [
            { label: 'Old uBlock setup — Brave only, banned elsewhere', value: '1 browser', ratio: 0.25 },
            { label: 'AdBlockMaxxer — native Manifest V3', value: '4 browsers', ratio: 1.0, emphasize: true },
          ],
          caption: 'Where it actually installs · Brave · Chrome · Edge · Firefox',
        },
      },
      {
        eyebrow: '02 · The Quality',
        headline: 'Twitch ads gone. The 1080p stays.',
        body: 'Most Twitch blockers "work" by quietly swapping you to a low-res ad-free feed — you lose the ad and the quality. AdBlockMaxxer swaps in a full-resolution backup stream during the break, so the ad disappears and 1080p60 never does.',
        visual: {
          kind: 'bars',
          bars: [
            { label: 'Other Twitch blockers (during ads)', value: '480p', ratio: 0.44 },
            { label: 'AdBlockMaxxer (during ads)', value: '1080p60', ratio: 1.0, emphasize: true },
          ],
          caption: 'Stream quality while an ad break is being blocked · higher is better',
        },
      },
      {
        eyebrow: '03 · The Refresh',
        headline: "YouTube that doesn't lock up.",
        body: 'The hacky way to skip a YouTube ad is to race the skip button — which is exactly why mobile YouTube freezes and makes you refresh. We delete the ad slots from the player response before the player ever sees them. No race, no frozen frame.',
        visual: {
          kind: 'bars',
          bars: [
            { label: 'Skip-button hacks — stuck, hit refresh', value: 'breaks', ratio: 0.4 },
            { label: 'Player-response strip — clean cut', value: 'seamless', ratio: 1.0, emphasize: true },
          ],
          caption: 'How the ad gets removed',
        },
      },
      {
        eyebrow: '04 · The iPhone',
        headline: "We won't lie about iOS.",
        body: "Apple forbids every iPhone browser from running the code an ad blocker needs — Safari, Chrome and Brave are all Safari underneath. So no extension can do this on iOS, ours included. Instead of faking it, the app ships the exact blocking-DNS + AdGuard setup that genuinely kills your phone's Spotify and in-app ads.",
        visual: {
          kind: 'bars',
          bars: [
            { label: 'Blockers that claim "works everywhere"', value: 'marketing', ratio: 1.0 },
            { label: 'AdBlockMaxxer — extension on desktop, real DNS guide on iOS', value: 'the truth', ratio: 1.0, emphasize: true },
          ],
          caption: 'Honesty over reach · the same ethic as the rest of the suite',
        },
      },
    ],
    primaryCta: { label: 'Download for Chrome / Brave / Edge', href: 'https://dl.maxxtopia.com/adblockmaxxer-chrome-v1.2.7.zip', external: true },
    secondaryCta: undefined,
    glyph: '⏭',
    logo: '/logos/adblockmaxxer.png',
    accentHex: '#00d4ff',
  },
  {
    slug: 'streammaxxing',
    name: 'Streammaxxing',
    category: 'Stream Alerts',
    status: 'live',
    version: '0.1.0',
    tagline: "Alerts that fire the instant it happens.",
    description:
      "Cloud alert tools route every follow, sub and donation through their servers first — so your overlay can lag the moment by tens of seconds. Streammaxxing runs on your PC and fires the instant Twitch emits the event. Import your Botrix alerts in one click, trim clips and level every sound with built-in ffmpeg, and read donor messages aloud in a voice you cloned — 100% local, no account, free.",
    longDescription:
      "Local-first stream alerts: instant Twitch EventSub, one-click Botrix import, a built-in clip trimmer + loudness-normalize, and consent-gated voice-clone read-outs. Free.",
    features: [
      {
        title: 'Instant, because it runs on your PC.',
        body: 'A local Twitch EventSub connection fires your overlay the moment the event lands — no cloud round-trip to add seconds of lag between the follow and the alert.',
      },
      {
        title: 'Bring your Botrix alerts in one click.',
        body: 'Paste your Botrix link and it pulls every alert and downloads all the media to your disk — same look, now running locally. No rebuilding from scratch.',
      },
      {
        title: 'Trim clips without leaving the app.',
        body: 'A built-in ffmpeg trimmer cuts any video, GIF or sound to length for an alert — frame-exact, with a live preview. Nothing ever uploads.',
      },
      {
        title: 'Every alert at one level.',
        body: 'One click normalizes all your alert sounds to a consistent loudness (EBU R128, −16 LUFS) so nothing blasts and nothing whispers. Non-destructive — restore the originals anytime.',
      },
      {
        title: 'Read donor messages in your own voice.',
        body: 'Consent-gated voice cloning reads each donation or sub message aloud in a voice you trained from a short clip — synthesized locally on your GPU, never sent anywhere.',
      },
      {
        title: 'Spam floods, handled.',
        body: 'A follow-bot raid collapses into a single "+N follows" alert instead of a stampede, and a unified queue means alerts never overlap. Free, no account, media stays on your machine.',
      },
    ],
    stats: [
      { label: 'Alert latency', value: 'Local' },
      { label: 'Botrix import', value: '1-click' },
      { label: 'Read-outs', value: 'Cloned' },
      { label: 'Price', value: 'Free' },
    ],
    heroStat: { value: 'Instant', label: 'alerts · fired on your PC' },
    zones: [
      {
        eyebrow: '01 · The Delay',
        headline: 'No cloud means no waiting.',
        body: "Cloud alert services have to receive the event, queue it, and push it back down to your overlay — which is why a follow can take tens of seconds to show up. Streammaxxing holds a direct EventSub connection on your own machine, so the alert fires the instant Twitch sends it.",
        visual: {
          kind: 'bars',
          bars: [
            { label: 'Cloud alert tools — event round-trips a server', value: '~30s', ratio: 1.0 },
            { label: 'Streammaxxing — fired locally on your PC', value: 'instant', ratio: 0.04, emphasize: true },
          ],
          caption: 'Time from event to on-screen alert · lower is better',
        },
      },
      {
        eyebrow: '02 · The Levels',
        headline: 'One button, every alert the same loudness.',
        body: "Alert packs are a mess of mismatched volumes — one sound clips your ears, the next is inaudible. Streammaxxing measures and re-levels every alert sound to a broadcast standard (−16 LUFS), so they all sit at one consistent level. It's non-destructive: your originals are kept and one click restores them.",
        visual: {
          kind: 'bars',
          bars: [
            { label: 'Raw alert sounds — wildly different volumes', value: '17.7 dB', ratio: 1.0 },
            { label: 'After one-click normalize', value: '0.4 dB', ratio: 0.12, emphasize: true },
          ],
          caption: 'Loudness spread across a real alert set · tighter is better',
        },
      },
      {
        eyebrow: '03 · The Voice',
        headline: 'Donations read aloud — in a voice you cloned.',
        body: "Generic robot TTS makes every read-out sound the same. Streammaxxing clones a voice from a short reference clip and reads each donor's actual message in it, synthesized locally on your GPU. It's consent-gated and never leaves your machine.",
        visual: {
          kind: 'bars',
          bars: [
            { label: 'Stock TTS — one robotic voice', value: 'canned', ratio: 0.5 },
            { label: 'Streammaxxing — your cloned voice, local', value: 'yours', ratio: 1.0, emphasize: true },
          ],
          caption: 'How donation messages get read · consent-gated, 100% on-device',
        },
      },
    ],
    primaryCta: { label: 'Download for Windows', href: 'https://dl.maxxtopia.com/streammaxxing/streammaxxing_0.1.0_x64-setup.exe', external: true },
    secondaryCta: undefined,
    glyph: '⚡',
    accentHex: '#22d3a0',
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
