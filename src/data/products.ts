// Auto-synced from each product's release CI via repository_dispatch.
// See .github/workflows/sync-*-release.yml — every time a new tag
// publishes upstream, the matching JSON gets rewritten and committed.
import dmRelease from './discordmaxxer-release.json';
import omRelease from './optimizationmaxxing-release.json';
import cmRelease from './clipmaxxer-release.json';
import dpRelease from './dropmaxxer-release.json';
import amRelease from './aimmaxxer-release.json';
import vmRelease from './viewmaxxing-release.json';

// Per-product waitlist: one Discord-OAuth click and the Maxx bot DMs the user
// the moment that product ships. Handled by the vip-worker (waitlist:* keys in
// VIP_CLAIMS); see optimizationmaxxing/vip-worker/worker.js.
const WAITLIST_BASE = 'https://optmaxxing-vip.maxxtopia.workers.dev/waitlist/start';
const waitlistUrl = (slug: string) => `${WAITLIST_BASE}?product=${slug}`;

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
      }
    | {
        kind: 'chips';
        chips: Array<{ label: string; value: string; emphasize?: boolean }>;
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
   *  tagline on the product hero. The "scroll-stopper" stat.
   *  `inline: true` renders it small — value sit beside the label at label
   *  size — instead of the giant display number (for stats like "0" where the
   *  giant treatment doesn't read as a flex). */
  heroStat?: { value: string; label: string; inline?: boolean };
  primaryCta: { label: string; href: string; external?: boolean };
  secondaryCta?: { label: string; href: string; external?: boolean };
  /** Optional third download, rendered as a subtle link + note under the buttons.
   *  Used for opt-in add-ons most users don't need (e.g. the YouTube companion). */
  tertiaryCta?: { label: string; href: string; external?: boolean; note?: string };
  glyph: string;
  /** SVG mark path under /logos/. If absent, ProductCard falls back to wordmark-only. */
  logo?: string;
  /** Small-size mark for the sidebar rail (24px). Use when the full logo is a
   *  detailed badge that turns to mush when shrunk — e.g. a bolt-only icon
   *  instead of the circular wordmark badge. Falls back to `logo`. */
  icon?: string;
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
  /** Step-by-step "How it works" walkthrough with real product screenshots.
   *  Renders the HowItWorks section on the product page — shows people how to
   *  actually use the tool, one numbered step + real screenshot at a time. */
  howItWorks?: {
    eyebrow?: string;
    heading?: { left: string; right: string };
    steps: { title: string; body: string; img: string; alt: string }[];
  };
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
          poster: '/screenshots/optimizationmaxxing/_v1_clips/poster-02_f1_tweaks.jpg',
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
          src: '/screenshots/optimizationmaxxing/_v1_clips/14_f9_realgains.mp4',
          poster: '/screenshots/optimizationmaxxing/_v1_clips/poster-14_f9_realgains.jpg',
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
          poster: '/screenshots/optimizationmaxxing/_v1_clips/poster-11_f7_proconfigs.jpg',
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
          poster: '/screenshots/optimizationmaxxing/_v1_clips/poster-04_f3_toolkit.jpg',
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
          poster: '/screenshots/optimizationmaxxing/_v1_clips/poster-12_f8_dash_top.jpg',
          alt: 'Hardware detection panel with spec readouts',
        },
      },
    ],
    howItWorks: {
      eyebrow: 'How it works',
      heading: { left: 'Tune what you measured.', right: 'Undo what you didn\'t.' },
      steps: [
        {
          title: 'Open it — your rig, scored',
          body: "It launches in about 200 ms to a dashboard that already knows your hardware: live CPU, RAM and a tweaks-applied count, with one button to tune. The suite-wide auto-update banner sits up top, so you're always on the signed latest build.",
          img: '/screenshots/optimizationmaxxing/howto/dashboard.webp',
          alt: 'Optimizationmaxxing dashboard with live rig gauges and the auto-update banner',
        },
        {
          title: 'Every tweak shows its source',
          body: "This is the whole point. Browse ~100 audited tweaks, each with a risk rating and a real citation — a Microsoft Learn doc, an NVIDIA dev note, a vendor whitepaper. The other tuners don't print sources because they don't have any.",
          img: '/screenshots/optimizationmaxxing/howto/tweaks.webp',
          alt: 'Tweak catalog with risk badges and source citations',
        },
        {
          title: 'One-click revert, any tweak, any time',
          body: "Everything you apply is snapshotted to a local ledger. \"Your Tune\" lists every change with its live status — still in place, or quietly reverted by a Windows update — and puts each one back with a single click. Undo is never a paid tier.",
          img: '/screenshots/optimizationmaxxing/howto/your-tune.webp',
          alt: 'Your Tune view listing applied tweaks with per-change revert status',
        },
        {
          title: 'Measure before and after',
          body: "A one-shot Diagnostics snapshot reads your real specs, thermals, disk, driver health and live latency — so you tune against numbers, not vibes, and can prove the change actually helped on your rig.",
          img: '/screenshots/optimizationmaxxing/howto/diagnostics.webp',
          alt: 'Diagnostics snapshot with hardware, thermals, disk and driver checks',
        },
      ],
    },
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
          kind: 'chips',
          chips: [
            { label: 'Idle CPU · in-game, Tournament Mode', value: '0%', emphasize: true },
            { label: 'Discord stays live — DMs, pings, calls', value: 'Connected' },
          ],
          caption: 'Renderer parked, background polling ticked down · fires on Ctrl+Alt+T, even mid-game',
        },
      },
      {
        eyebrow: '03 · No Phone-Home',
        headline: "Opens what you sent. Nothing else.",
        body: 'Stock Discord opens calls to telemetry, ad-tech, and crash-pipeline domains the moment it launches. We strip every one of those. You ping who you meant to ping.',
        visual: {
          kind: 'chips',
          chips: [
            { label: 'Stock Discord · domains it opens on launch', value: '14' },
            { label: 'Discordmaxxer · domains it opens on launch', value: '0', emphasize: true },
          ],
          caption: 'Before you type a single message · measured via packet capture',
        },
      },
    ],
    howItWorks: {
      eyebrow: 'How it works',
      heading: { left: 'Your Discord.', right: 'Your rules.' },
      steps: [
        {
          title: 'The DM Hub — one button, every toggle',
          body: "Click the Discordmaxxer mark next to your mic and the hub opens: Tournament Mode for competitive play, Compact View to hide the sidebars, your theme, profile badge and more — each a one-tap toggle (Tournament Mode also fires on Ctrl+Alt+T, even mid-game with Discord unfocused).",
          img: '/screenshots/discordmaxxer/howto/dm-hub.webp',
          alt: 'The Discordmaxxer Hub panel with Tournament Mode and quick toggles',
        },
        {
          title: 'A real plugin engine',
          body: "Not userscripts bolted on — a native plugin engine compiled with the client. Browse, search and toggle dozens of plugins (cursor effects, privacy, trim, and more), each written as first-class code and signed with the same key.",
          img: '/screenshots/discordmaxxer/howto/plugins.webp',
          alt: 'Discordmaxxer native plugin list with toggles',
        },
        {
          title: 'Themes that repaint everything',
          body: "Hand-tuned palettes that re-skin the entire client — not a CSS hack on top. Load a theme, switch instantly, and full BetterDiscord/Vencord theme support is there if you want to go further.",
          img: '/screenshots/discordmaxxer/howto/themes.webp',
          alt: 'Discordmaxxer theme system with a theme applied',
        },
        {
          title: 'Always up to date',
          body: "A branded in-app updater checks for new builds and shows you the release notes before anything happens. One click installs and relaunches — the same auto-update system runs across the whole Maxxtopia suite.",
          img: '/screenshots/discordmaxxer/howto/updater.webp',
          alt: 'Discordmaxxer auto-updater showing an available update with release notes',
        },
      ],
    },
  },
  {
    slug: 'clipmaxxer',
    name: 'Clipmaxxer',
    category: 'Content',
    status: 'beta',
    version: cmRelease.version ?? undefined,
    tagline: 'You stream. We cut your shorts.',
    description:
      "Done-for-you clip editing for streamers. Your best moments — cut to vertical, captioned, delivered ready to post. You don't touch an editor.",
    longDescription:
      "A managed service: you send your channel, and your top moments get reframed to 9:16, face kept in frame, captioned, and delivered to you ready to post (or dropped straight into your drafts). Built for streamers with an audience already rolling. Apply for the beta.",
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
    primaryCta: { label: 'Apply — done-for-you', href: '/clipmaxxer/apply', external: false },
    secondaryCta: { label: 'See the offer', href: '/clipmaxxer/apply', external: false },
    glyph: '✂',
    icon: '/logos/clipmaxxer-icon.svg',
    accentHex: '#00d4ff',
    // Hero screenshot dropped: the three dev-UI PNGs (queue/login/pricing)
    // looked cropped in the 3-up 9:16 grid and aren't shippable marketing.
    // queue-vod.png reappears once below in the "Queue" zone where it fits
    // a 16:10 frame correctly. Real marketing screenshots land before launch.
    heroStat: { value: 'Done-for-you', label: 'we clip + post to your socials' },
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
          kind: 'chips',
          chips: [
            { label: 'Valorant · creator playbook', value: 'live', emphasize: true },
            { label: 'Fortnite · creator playbook', value: 'live', emphasize: true },
            { label: 'More niches', value: 'in research' },
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
          kind: 'chips',
          chips: [
            { label: 'TikTok · short hook', value: '9:16 cut', emphasize: true },
            { label: 'YouTube Shorts · YT hook', value: '9:16 cut', emphasize: true },
            { label: 'Instagram Reels · IG hook', value: '9:16 cut', emphasize: true },
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
    // Placeholder mark: a tactical drop-map badge (grid + POIs + bus path to a
    // landing reticle) until real dropmaxxer art lands. Sidebar uses the
    // reticle-only icon so it stays legible at 24px.
    logo: '/logos/dropmaxxer.png',
    icon: '/logos/dropmaxxer-icon.svg',
    accentHex: '#4c51f7',
    screenshots: ['/screenshots/dropmaxxer/hero-flightplan.webp'],
    heroStat: { value: '2', label: 'routes per drop · fastest + safe' },
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
        body: "Two solvers, one decision. If your drop matches our corpus of pro and community data, you get the tested answer — flagged “pro-rooted,” with the real win-rate at that spot. If it doesn't, the calibrated physics simulator runs the math. Either way you get both lines, Fastest and Safe, plus the exact point to cut your glider.",
        visual: {
          kind: 'image',
          src: '/screenshots/dropmaxxer/flight-plan.webp',
          alt: 'Dropmaxxer Flight Plan: Fastest vs Safe ETAs, the glider-cut breakdown, and a pro-rooted confidence badge',
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
    howItWorks: {
      eyebrow: 'How to use it',
      heading: { left: 'Four clicks.', right: 'You land first.' },
      steps: [
        {
          title: 'Open the live map',
          body: 'Launch Dropmaxxer in your browser — nothing to install. The current-season island loads with every POI labelled. Customize your bus skin, marker, and pose if you want; then hit "Let\'s Drop".',
          img: '/screenshots/dropmaxxer/howto/step-1.webp',
          alt: 'Dropmaxxer live map with current-season POIs and the customize panel',
        },
        {
          title: 'Set the bus line, drop your target',
          body: 'Click "Set Bus" and trace the battle-bus path across the map, then "Set Target" and tap the POI you\'re dropping. That\'s the only input it needs — your bus line and where you\'re going.',
          img: '/screenshots/dropmaxxer/howto/step-2.webp',
          alt: 'Setting the bus path and target POI on the Dropmaxxer map',
        },
        {
          title: 'Read your drop: Fastest vs Safe',
          body: 'The Flight Plan panel hands you both lines — the fastest cut-and-nosedive (37.1s here) and the safe glide (44.6s) — with the exact point to cut your glider and how much time the cut saves. Land with a gun before the fight starts.',
          img: '/screenshots/dropmaxxer/howto/step-3.webp',
          alt: 'Dropmaxxer Flight Plan showing Fastest vs Safe ETAs and the glider cut point',
        },
        {
          title: 'See where the pros land',
          body: 'Flip on "Pro Drops" to overlay the spots competitive players actually take this season — so you can copy a proven landing or deliberately avoid a contested one.',
          img: '/screenshots/dropmaxxer/howto/step-4.webp',
          alt: 'Pro Drops overlay marking competitive landing spots across the map',
        },
      ],
    },
  },
  {
    slug: 'aimmaxxer',
    name: 'Aimmaxxer',
    category: 'Training',
    status: 'soon',
    version: amRelease.version ?? undefined,
    tagline: 'Warm up right. Per game.',
    description:
      "The community's best aim routines to warm up for your game. - Aimmaxxer V2 The Real Deal, is in the lab.",
    longDescription:
      "Ten minutes in KovaaK's before you queue, with the right scenarios for the aim your game actually demands. Plus the gear that moves your aim more than a new mouse. The real trainer is coming.",
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
        : { label: 'Get notified on launch', href: waitlistUrl('aimmaxxer'), external: true },
    secondaryCta: amRelease.releasePageUrl
        ? { label: 'Release notes', href: amRelease.releasePageUrl, external: true }
        : undefined,
    glyph: '◎',
    logo: '/logos/aimmaxxer.png',
    icon: '/logos/aimmaxxer-icon.png',
    accentHex: '#f3af19',
    heroStat: { value: '6', label: 'games · a warmup for each' },
    zones: [
      {
        eyebrow: '01 · The Metrics',
        headline: "Aim is four things. Drilled four ways.",
        body: 'Sensitivity, prediction, anchor, trigger. KovaaK\'s hands you 200 scenarios. We measure the 4 that fix what\'s actually broken, and drill each separately.',
        visual: {
          kind: 'chips',
          chips: [
            { label: 'Sensitivity', value: 'drilled' },
            { label: 'Prediction', value: 'drilled' },
            { label: 'Anchor', value: 'drilled' },
            { label: 'Trigger discipline', value: 'drilled' },
          ],
          caption: 'Four independent measurements · four independent drills',
        },
      },
      {
        eyebrow: '02 · The Routine',
        headline: "Adapts to your sens.",
        body: 'Your DPI, your in-game sensitivity, your play style. The routine flexes around them — not the other way around. No "use 800 DPI" prescriptions.',
        visual: {
          kind: 'chips',
          chips: [
            { label: "KovaaK's — one fixed sens prescription", value: 'static' },
            { label: 'Aimmaxxer — adapts to your DPI + style', value: 'adaptive', emphasize: true },
          ],
          caption: 'Calibration model · static vs adaptive',
        },
      },
    ],
  },
  {
    slug: 'viewmaxxing',
    name: 'Viewmaxxing',
    category: 'TV Streaming',
    status: 'beta',
    version: vmRelease.version ?? '0.4.38',
    tagline: 'One app. Every mood. Zero bills.',
    description:
      "Scrapped and rebuilt. The old streamer toolkit is gone — Viewmaxxing is now the one free app for your TV box: YouTube (native, ad-free), movies, shows, anime and Twitch on one D-pad home. No account, no subscription.",
    longDescription:
      "We scrapped the old streamer toolkit and rebuilt it into the one app you open when you get home — YouTube (native, ad-free), movies, shows, anime and Twitch, all on one remote-first home that runs local on your box and learns what you watch. Free. No login. Grab it in the Discord.",
    features: [
      {
        title: 'Five surfaces. One app.',
        body: 'YouTube, movies, TV, anime and Twitch under one remote. The mood switches; the app doesn\'t.',
      },
      {
        title: 'YouTube. Native. Ad-free.',
        body: 'Extracted on the box, not loaded as a web page — so ads never play. English-filtered feeds, a multi-language audio picker, captions, and Auto/720/Max quality.',
      },
      {
        title: 'No mirror picker. It just plays.',
        body: 'A TMDb-sized catalog with multi-mirror streaming and automatic best-server selection. Continue Watching, episode pickers, sub or dub.',
      },
      {
        title: 'Free. Local. Yours.',
        body: 'No account, no subscription, no monthly bill. "For You" learns on the box — nothing uploaded, no profile sold.',
      },
    ],
    stats: [
      { label: 'Apps in one', value: '5' },
      { label: 'YouTube ads', value: '0' },
      { label: 'Price', value: 'Free' },
      { label: 'Account', value: 'None' },
    ],
    primaryCta: { label: 'Get it free — Discord #free-stuff', href: 'https://discord.gg/S78eecbWdx', external: true },
    secondaryCta: undefined,
    glyph: '◐',
    logo: '/logos/viewmaxxing.png',
    icon: '/logos/viewmaxxing-icon.png',
    accentHex: '#10b981',
    heroStat: { value: '5', label: 'apps in one · $0 forever' },
    screenshots: ['/screenshots/viewmaxxing/home-hero.webp'],
    zones: [
      {
        eyebrow: '01 · The Rebuild',
        headline: "We scrapped the first one. On purpose.",
        body: 'The old Viewmaxxing was a vague streamer toolkit aimed at a tiny audience. It never shipped. We didn\'t fill the slot with slop — we deleted the concept and rebuilt it into the box app everyone actually wanted: instant-open, one tap to whatever you\'re in the mood for.',
        visual: {
          kind: 'chips',
          chips: [
            { label: 'Old Viewmaxxing · operator toolkit, never shipped', value: 'scrapped' },
            { label: 'New Viewmaxxing · everyday relax app', value: 'v0.4.38 live', emphasize: true },
          ],
          caption: 'Same name · different product · rebuilt from zero',
        },
      },
      {
        eyebrow: '02 · The Stack',
        headline: "Your living room runs six apps. This is one.",
        body: 'YouTube here, a movie service there, an anime app, Twitch on your phone — five subscriptions and five remotes\' worth of friction. Viewmaxxing collapses all of it into one home screen, and it bills you nothing.',
        visual: {
          kind: 'bars',
          bars: [
            { label: 'Stacked streaming subs', value: '$50+/mo', ratio: 1.0 },
            { label: 'YouTube Premium alone', value: '$13.99/mo', ratio: 0.28 },
            { label: 'Viewmaxxing', value: '$0/mo', ratio: 0.02, emphasize: true },
          ],
          caption: 'Typical living-room stack vs one free app · prices as listed, subject to change',
        },
      },
      {
        eyebrow: '03 · The Feed',
        headline: "YouTube on the big screen. Zero ads.",
        body: 'The stock TV YouTube app shows unskippable ads and buries the audio tracks. Viewmaxxing extracts the video natively on the box, so ad slots never load — plus a multi-language audio picker, optional captions, and quality from Auto to Max.',
        visual: {
          kind: 'chips',
          chips: [
            { label: 'TV YouTube app · ad breaks', value: 'unskippable' },
            { label: 'TV YouTube app · audio + captions', value: 'buried' },
            { label: 'Viewmaxxing · YouTube', value: 'ad-free', emphasize: true },
            { label: 'Viewmaxxing · audio + captions', value: 'built in', emphasize: true },
          ],
          caption: 'Native extraction on the box · not a browser ad-blocker',
        },
      },
      {
        eyebrow: '04 · The Pick',
        headline: "It finds the working server. You don't.",
        body: 'A TMDb-powered catalog of movies and shows, plus anime and live Twitch. Multi-mirror streaming auto-selects the best source in the background — no manual picker, no "try another link." Continue Watching remembers where you stopped; episode pickers and sub/dub are built in. All of it D-pad native.',
        visual: {
          kind: 'chips',
          chips: [
            { label: 'Other sideload apps · pick a mirror, hope it works', value: 'manual' },
            { label: 'Viewmaxxing · auto best-server', value: 'one tap', emphasize: true },
          ],
          caption: 'Reliability ranked per source · the working mirror plays first',
        },
      },
      {
        eyebrow: '05 · The Catalog',
        headline: "Every show. Real artwork. One grid.",
        body: 'Movies, prestige TV and anime in a live catalog with real poster art — not a wall of broken links. House of the Dragon, The Boys, FROM, Snowfall: all a click from the couch, sorted into Popular and Top Rated.',
        visual: {
          kind: 'image',
          src: '/screenshots/viewmaxxing/catalog.webp',
          alt: 'Viewmaxxing TV Shows catalog — Popular and Top Rated rows of real series with poster art',
        },
      },
      {
        eyebrow: '06 · The Search',
        headline: "Type it once. It's already there.",
        body: 'One search across movies, TV, anime and YouTube. Type "Snowfall" and the full FX series surfaces first — six seasons, sixty episodes deep — next to everything adjacent. No bouncing between apps to find a show you already know the name of.',
        visual: {
          kind: 'image',
          src: '/screenshots/viewmaxxing/snowfall-search.webp',
          alt: 'Searching Snowfall in Viewmaxxing — the FX series surfaces first among live results',
        },
      },
    ],
  },
  {
    slug: 'extensionmaxxing',
    name: 'AdBlock-Maxxer',
    category: 'Browser Extension',
    status: 'live',
    version: '1.5.7',
    tagline: "Way more than an ad blocker.",
    description:
      "Kills ads on YouTube, Spotify & Twitch — then keeps going: a performance mode that frees up RAM, SponsorBlock skipping, Twitch in full HD with a fullscreen chat overlay, even a built-in game. One free extension, every browser.",
    longDescription:
      "Ad blocking is just the start. 21,370 filter rules across YouTube, Spotify, Twitch & the web — plus a tab-suspending performance mode, YouTube SponsorBlock skipping, a Twitch fullscreen-chat overlay, a built-in arcade game, and a quality-lock that restores Twitch to source after every ad break. Four browsers, zero cost.",
    features: [
      {
        title: 'Beats YouTube\'s server-side ad enforcement.',
        body: "Some accounts get bucketed into YouTube's strictest tier — videos black-screen or throw an \"allow ads\" wall, and no in-browser blocker (ours, uBlock, any) can touch it, because the ads are enforced on the server. The optional YouTube Reclaim companion pulls the video ad-free and plays it right inside the normal YouTube page — 1080p/4K, quality picker, captions. Setup is quick: download the companion, unzip it, and double-click the app (nothing to install — no Python), and it runs invisibly in the background.",
      },
      {
        title: 'Loads where the others got banned.',
        body: 'Manifest V3-native, so it installs on Brave, Chrome, Edge and Firefox. No more "this extension isn\'t supported" wall when you leave Brave.',
      },
      {
        title: 'Twitch ads gone. Quality comes back.',
        body: 'A backup-stream swap hides the ad break — you may see a brief dip while it swaps, then it restores to your source quality (up to 1080p60). Other Twitch blockers just strand you at 480p with a "blocking ads" banner. Optional quality lock also stops Twitch\'s auto-quality from downgrading you the rest of the time.',
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
        title: 'Works on your phone, too.',
        body: "Mobile can't run extensions — but Brave on Android and iOS take our custom filter list, blocking ad and tracker domains across the web. One URL, paste it in Shields.",
      },
    ],
    stats: [
      { label: 'Browsers', value: '4' },
      { label: 'Filter rules', value: '21,370' },
      { label: 'Twitch quality', value: 'up to 1080p60' },
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
        headline: 'Twitch ads gone. The quality comes back.',
        body: 'Most Twitch blockers "work" by quietly leaving you on a low-res ad-free feed — you lose the ad and the quality. AdBlockMaxxer swaps in a backup stream to hide the break, then restores your source quality once it\'s over (a brief dip during the swap is normal). An optional quality lock keeps Twitch\'s auto-quality from downgrading you the rest of the time.',
        visual: {
          kind: 'bars',
          bars: [
            { label: 'Other Twitch blockers (stuck during ads)', value: '480p', ratio: 0.44 },
            { label: 'AdBlockMaxxer (restores after the swap)', value: 'up to 1080p60', ratio: 1.0, emphasize: true },
          ],
          caption: 'Stream quality once the ad break is handled · higher is better',
        },
      },
      {
        eyebrow: '03 · The Refresh',
        headline: "YouTube that doesn't lock up.",
        body: 'The hacky way to skip a YouTube ad is to race the skip button — which is exactly why mobile YouTube freezes and makes you refresh. We delete the ad slots from the player response before the player ever sees them. No race, no frozen frame.',
        visual: {
          kind: 'chips',
          chips: [
            { label: 'Skip-button hacks — stuck, hit refresh', value: 'breaks' },
            { label: 'Player-response strip — clean cut', value: 'seamless', emphasize: true },
          ],
          caption: 'How the ad gets removed',
        },
      },
      {
        eyebrow: '04 · The Reclaim',
        headline: 'When YouTube enforces ads server-side, take the video back.',
        body: "YouTube is rolling out server-side ad enforcement: flagged accounts get a black screen or an \"allow ads\" wall, and the ad is welded to the stream on Google's servers — so stripping it in the browser just turns the video off. No extension alone can win that, full stop. The optional YouTube Reclaim companion runs locally, fetches the same video ad-free, and plays it inside the normal YouTube page — search, comments and recommendations all stay native. Pick 1080p/4K, turn on captions, scrub freely. Setup is quick: download the companion, unzip it, and run the app (Python and yt-dlp are baked in — nothing to install), and it runs invisibly, optionally auto-starting on login.",
        visual: {
          kind: 'chips',
          chips: [
            { label: 'Enforced account, no companion — black screen / "allow ads"', value: 'blocked' },
            { label: 'YouTube Reclaim companion (.exe, one click)', value: 'ad-free · up to 4K', emphasize: true },
          ],
          caption: 'Companion at dl.maxxtopia.com/adblockmaxxer-companion.zip · the only thing that beats server-side enforcement',
        },
      },
      {
        eyebrow: '05 · The Phone',
        headline: 'Your phone, too — by filter list.',
        body: "Mobile browsers can't run extension code, so the YouTube player-strip and Twitch quality-swap are desktop-only — and we won't pretend otherwise. But Brave on Android and iOS both take a custom filter list. Paste ours in under Shields → Content filtering and it blocks ad and tracker domains across the whole web — display ads, trackers, Spotify-web and SoundCloud ads included — and auto-refreshes. The one honest limit: YouTube video ads stay unblockable on any phone.",
        visual: {
          kind: 'chips',
          chips: [
            { label: 'No filter list — phone ads everywhere', value: 'exposed' },
            { label: 'AdBlockMaxxer mobile list on Brave', value: 'domains blocked', emphasize: true },
          ],
          caption: 'Brave · Android + iOS · Shields → Content filtering → add custom list',
        },
      },
      {
        eyebrow: '06 · The Tune-up',
        headline: "It's a tab suspender, too — get your RAM back.",
        body: "Open tabs quietly eat memory all day. Performance mode suspends idle background tabs after a timeout you set, freeing the RAM and keeping the browser snappy — the kind of thing people install a second extension for, already built in here.",
        visual: {
          kind: 'chips',
          chips: [
            { label: '100 tabs, none suspended — memory creeps up', value: 'sluggish' },
            { label: 'Performance mode — idle tabs suspended', value: 'RAM back', emphasize: true },
          ],
          caption: 'Options → Performance mode → suspend idle tabs after N minutes',
        },
      },
      {
        eyebrow: '07 · The Extras',
        headline: 'Twitch, fully loaded — chat overlay, quality lock, and a game.',
        body: "Beyond killing the ads: a fullscreen chat overlay so you can read chat without leaving fullscreen, a lock-to-source-quality toggle so Twitch can't quietly auto-downgrade you, and a built-in Sprite Cannon mini-game you can pop open right over any stream during the boring parts.",
        visual: {
          kind: 'chips',
          chips: [
            { label: 'Fullscreen chat overlay + source-quality lock', value: 'built in' },
            { label: 'Sprite Cannon — a free game over any stream', value: 'play now', emphasize: true },
          ],
          caption: 'Options → Twitch extras · the game also lives at maxxtopia.com/play/spritecannon',
        },
      },
      {
        eyebrow: '08 · The Skip',
        headline: 'Skip the in-video sponsor reads, too.',
        body: "Ad-blocking handles the ads the network serves — SponsorBlock handles the ones the creator reads out loud. Choose which segment types to auto-skip (sponsor, intro, self-promo) and the player jumps right past them, so you only watch what you came for.",
        visual: {
          kind: 'chips',
          chips: [
            { label: '"And this video is sponsored by..." — every video', value: 'sat through' },
            { label: 'SponsorBlock — auto-skipped by category', value: 'gone', emphasize: true },
          ],
          caption: 'Options → SponsorBlock categories',
        },
      },
    ],
    primaryCta: { label: 'Download for Chrome / Brave / Edge', href: 'https://dl.maxxtopia.com/adblockmaxxer-chrome-v1.5.7.zip', external: true },
    secondaryCta: { label: 'On your phone? Get the Brave filter list', href: 'https://dl.maxxtopia.com/adblockmaxxer-mobile.txt', external: true },
    tertiaryCta: {
      label: 'YouTube showing ad-walls? Get the companion (.zip)',
      href: 'https://dl.maxxtopia.com/adblockmaxxer-companion.zip',
      external: true,
      note: 'Optional — only if your YouTube account black-screens videos or shows an "allow ads" wall. Unzip it and run the app once (nothing to install); from then on your browser starts it automatically whenever Reclaim is on — no need to launch it again. Keep the unzipped folder together. Windows may show an "unknown publisher" notice the first time — that\'s expected for a new indie tool; click More info → Run anyway. Everything else works with just the extension above.',
    },
    glyph: '⏭',
    logo: '/logos/adblockmaxxer.png',
    accentHex: '#00d4ff',
    // Real hero shot: the post-install welcome screen ("You're set.").
    screenshots: ['/screenshots/extensionmaxxing/welcome-hero.webp'],
    howItWorks: {
      eyebrow: 'How to use it',
      heading: { left: 'Sideloaded in 30 seconds.', right: 'No store needed.' },
      steps: [
        {
          title: 'Load it once — that’s the whole install',
          body: "Download the zip, unzip it somewhere you’ll keep, open chrome://extensions (or brave:// / edge://), flip on Developer mode, click “Load unpacked,” and pick the folder. It’s not on the Web Store on purpose — that’s exactly how the big blockers got gutted. No store account, no silent auto-update spyware; filter lists still refresh on their own weekly.",
          img: '/screenshots/extensionmaxxing/howto/install.webp',
          alt: 'Loading AdBlock-Maxxer as an unpacked extension on the chrome://extensions page',
        },
        {
          title: 'One popup, every toggle',
          body: "Click the icon and you get a live “ads skipped” counter, a one-click snooze, a pop-out floating panel, and a switch for each surface — YouTube extra-skip, Spotify mute, Twitch points, SponsorBlock and more. Pause it on any single site without turning the whole thing off.",
          img: '/screenshots/extensionmaxxing/howto/popup.webp',
          alt: 'AdBlock-Maxxer popup with the ads-skipped counter and per-feature toggles',
        },
        {
          title: 'A real settings dashboard',
          body: "Open the options page for the full kit: choose exactly which SponsorBlock segments to skip, add your own EasyList filter URLs, lock Twitch to source quality, turn on performance mode, watch your block stats, and export your whole setup to one file.",
          img: '/screenshots/extensionmaxxing/howto/settings.webp',
          alt: 'AdBlock-Maxxer settings dashboard: features, SponsorBlock categories, custom filter lists and stats',
        },
      ],
    },
  },
  {
    slug: 'streammaxxing',
    name: 'Streammaxxing',
    category: 'Stream Alerts',
    status: 'live',
    version: '0.1.46',
    tagline: "Everything you stream with, in one free app.",
    description:
      "Everything you need to stream, in one free app. Instant alerts, overlays, all your chat in one place, and donations read out loud — set up with OBS in one click.",
    longDescription:
      "Every tool you run a stream with, in one free app that lives on your PC — instant alerts, a full overlay studio, merged chat from every platform, and donation read-outs in a voice you cloned. No cloud, no account, no monthly bill.",
    features: [
      {
        title: 'Instant, because it runs on your PC.',
        body: 'A local Twitch EventSub connection fires your overlay the moment the event lands — no cloud round-trip to add seconds of lag between the follow and the alert.',
      },
      {
        title: "Every platform's chat, one overlay.",
        body: 'Twitch, Kick, YouTube and TikTok chat merged into a single widget — each message tagged with the platform it came from. Drop it on stream, or pop it out as an always-on-top window to read while you play.',
      },
      {
        title: 'Bring your existing alerts in one click.',
        body: 'Import from Botrix or StreamElements — it pulls every alert and downloads all the media to your disk, same look, now running locally. No rebuilding from scratch.',
      },
      {
        title: 'One click adds every overlay to OBS.',
        body: 'Connect OBS once and a single button drops any overlay in as a browser source — named, sized and placed for you. No copy-pasting URLs into fifteen browser sources.',
      },
      {
        title: 'Chat clips the stream with !clip.',
        body: "Viewers type !clip and get an instant, shareable Twitch clip — no clip software running, no waiting for the VOD. Set a cooldown and reply, and optionally save a local copy at your exact length too.",
      },
      {
        title: 'Sound alerts your viewers trigger.',
        body: 'Let chat redeem channel-point sounds that play on stream, run watch-time points with a leaderboard, draw giveaway winners, and take YouTube song requests — engagement tools built in, not bolted on.',
      },
      {
        title: 'Run a whole roster from one install.',
        body: 'Switch between streamer profiles on the sidebar — each with its own alerts, overlays, commands and login. Built for managers and anyone running more than one channel.',
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
        title: 'A whole overlay studio, built in.',
        body: 'Goal bars, recent-event labels, Starting Soon / BRB / Ending scenes, a self-extending subathon timer, a death/win counter, a social-handles bar, a webcam frame, and a Spotify now-playing widget — every one customizable in the app, with a live preview before you add it to OBS.',
      },
      {
        title: 'Run the chat, not just react to it.',
        body: 'Pin a chat comment on stream as a shoutout, run a poll your viewers vote on by typing in chat, and answer FAQs automatically with a built-in !commands bot. A profanity filter catches slurs before they’re read aloud or hit the screen.',
      },
      {
        title: 'Share your whole setup in one file.',
        body: 'Export your alerts, overlays, commands and all their media to a single .smpack file — hand it to a friend, or import someone else’s, and get the exact same look instantly.',
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
    howItWorks: {
      eyebrow: 'How it works',
      heading: { left: 'Your whole stream.', right: 'One app.' },
      steps: [
        {
          title: 'The Command Center',
          body: "Everything runs from one dashboard — go live, fire a test alert, clip the last moment, mark a highlight for your editor. No browser tabs, no cloud account, no fifteen logins. It all lives on your PC.",
          img: '/screenshots/streammaxxing/howto/command-center.webp',
          alt: 'Streammaxxing Command Center dashboard with quick actions and live session panels',
        },
        {
          title: 'Add every overlay to OBS in one click',
          body: "Connect OBS once, tick the overlays you want — or hit \"Essentials\" — and \"Add selected to OBS\" drops each one in as a browser source, named, sized and placed for you. No copy-pasting URLs into a dozen sources.",
          img: '/screenshots/streammaxxing/howto/obs-setup.webp',
          alt: 'One-click OBS setup with the Set up OBS for me overlay checklist',
        },
        {
          title: 'A whole overlay studio, with live previews',
          body: "Goal bars, a self-extending subathon timer, full-screen Starting Soon / BRB / Ending scenes, a death/win counter, social bar, webcam frame, Spotify now-playing — 21 overlays in all, each customizable with a live preview before it ever hits your stream.",
          img: '/screenshots/streammaxxing/howto/overlay-scene.webp',
          alt: 'Starting Soon full-screen scene overlay from the streammaxxing overlay studio',
        },
        {
          title: "Every platform's chat, one widget",
          body: "Twitch, Kick, YouTube and TikTok chat merged into a single overlay, each message tagged with where it came from. Drop it on stream or pop it out as an always-on-top window to read while you play. Moderation and a command bot are built in.",
          img: '/screenshots/streammaxxing/howto/merged-chat.webp',
          alt: 'Unified chat overlay merging Twitch, Kick, YouTube and TikTok',
        },
        {
          title: 'Donations read aloud — in a voice you cloned',
          body: "Generic robot TTS makes every read-out sound the same. Streammaxxing clones a voice from a short clip and reads each donor's message in it — synthesized locally on your GPU, consent-gated, never sent anywhere.",
          img: '/screenshots/streammaxxing/howto/voice.webp',
          alt: 'Message read-outs panel with the voice engine and voice picker',
        },
        {
          title: 'Bring your alerts — leveled and tested',
          body: "Import your existing alerts from Botrix or StreamElements in one click, or start from a built-in pack. Then one button normalizes every alert sound to a consistent loudness (−16 LUFS) so nothing blasts and nothing whispers.",
          img: '/screenshots/streammaxxing/howto/alerts.webp',
          alt: 'Starter alert packs grid with loudness normalization',
        },
      ],
    },
    primaryCta: { label: 'Download for Windows', href: 'https://dl.maxxtopia.com/streammaxxing/streammaxxing-latest-x64-setup.exe', external: true },
    secondaryCta: undefined,
    glyph: '⚡',
    logo: '/logos/streammaxxing.png?v=2',
    icon: '/logos/streammaxxing-icon.png',
    accentHex: '#22d3a0',
    // Real hero shot: the Command Center dashboard — the "everything in one app" proof.
    screenshots: ['/screenshots/streammaxxing/howto/command-center.webp'],
  },
  {
    slug: 'snipemaxxer',
    name: 'Snipemaxxer',
    category: 'Fortnite',
    status: 'beta',
    version: '0.1.68',
    tagline: 'Know who\'s in your lobby.',
    description:
      "Auto-detects your match and names the whole lobby — pros, live streamers, who dropped where, off-region — plus more features to help in-game.",
    longDescription:
      "Auto-detects your match and names the whole lobby — pros, live streamers, who dropped where, off-region — plus more features to help in-game.",
    features: [
      {
        title: 'The whole lobby, named.',
        body: 'Every account in your tournament game resolved to a name and cross-checked against a 300-player pro brain and live Twitch/YouTube/Kick streams. Who you\'re really up against.',
      },
      {
        title: 'Who to key. Who to fade.',
        body: 'Surfaces beaten-down players (took more than they dealt), low-HP teams, and off-region (high-ping) opponents — the easy points you can\'t see from inside your own box fight.',
      },
      {
        title: 'Push, or place?',
        body: 'An always-on HUD does the math live: your surge-safety, what your finish is worth right now, how many must die for the next tier, and whether a kill or a placement pays more.',
      },
      {
        title: 'Qualify math, automatically.',
        body: 'Enter your points and the cutoff once. The HUD tells you the gap, how many elims close it, and the moment you\'re safe to play for the qualify.',
      },
      {
        title: 'A voice in your ear.',
        body: 'Alluka, the built-in coach, speaks the one read that matters and stays quiet otherwise — so you can glance, not read, mid-game. Ask her anything with push-to-talk.',
      },
      {
        title: 'Unbannable by design.',
        body: 'No memory reading, no injection, no overlay hooked into the game. It downloads the official server replay through your own Epic login and reads it — nothing for BattlEye or EAC to flag.',
      },
    ],
    zones: [
      {
        eyebrow: 'The hidden roster',
        headline: 'Who\'s actually in your lobby.',
        body: 'The server replay captures all 100 players — not just the ones you fought. Snipemaxxer resolves every account to a name, pins the pros and live streamers to the top with their skin and where they dropped, and lists the rest. The intel you simply cannot get from inside your own game.',
        visual: { kind: 'image', src: '/screenshots/snipemaxxer/whos-in-lobby.webp', alt: 'The Who\'s in your lobby panel — pros and live streamers pinned to the top with skins and drop locations, the rest of the lobby below.' },
      },
      {
        eyebrow: 'Right now',
        headline: 'Who to key. Who to fade.',
        body: 'A single triage board: your surge standing up top, then who\'s keyable now (beaten down, low HP, off-region — with their last-seen POI), then which big names are still alive and where. One glance tells you the easy points and the real threats.',
        visual: { kind: 'image', src: '/screenshots/snipemaxxer/right-now.webp', alt: 'The Right Now board — Keyable Now lists beaten-down targets with damage and location; Threats Still In lists alive pros and live streamers.' },
      },
      {
        eyebrow: 'The points brain',
        headline: 'Push, or place?',
        body: 'Between games the overlay polls your live tournament standing — your points, your rank, and the games you have left — and reads it against the cutoff and the cup\'s format. Then it gives you the one call that decides the next game: play for placement, or push for elims to qualify. No manual point-tracking, no spreadsheet.',
        visual: { kind: 'image', src: '/screenshots/snipemaxxer/overlay-hud.webp?v=2', alt: 'The overlay HUD — your live tournament standing: points, rank, games left, the qualify gap, and the call to play for placement or push to qualify.' },
      },
      {
        eyebrow: 'The whole map',
        headline: 'Where everyone was.',
        body: 'The pros and live streamers in your game, shown with their skin and IGN right on the POI they landed — colour-coded for you, pros and streamers. The rest of the lobby as dots, with a head-count per POI. A snapshot from the replay; click the map to open it full-size.',
        visual: { kind: 'image', src: '/screenshots/snipemaxxer/scout-map.webp?v=2', alt: 'Where Everyone Was map — the current-season Fortnite map showing each pro and streamer\'s skin icon and IGN at the POI they landed, with the field as dots and per-POI head-counts.' },
      },
    ],
    primaryCta: { label: 'Download for Windows', href: 'https://dl.maxxtopia.com/snipemaxxer/Snipemaxxer-Setup-0.1.70.exe', external: true },
    secondaryCta: { label: 'Get launch updates', href: waitlistUrl('snipemaxxer'), external: true },
    glyph: '⌖',
    logo: '/logos/snipemaxxer.svg',
    accentHex: '#ff3b3b',
    screenshots: ['/screenshots/snipemaxxer/scout-glance.webp'],
    heroStat: { value: '0', label: 'game memory read', inline: true },
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
