// Long-tail SEO content. Each guide targets a real search query and ties to a
// LIVE product (no claims about unshipped tools). The hub page, the sitemap, and
// each article all read from this list — single source of truth.

export type Guide = {
  slug: string;
  title: string; // <title> + <h1>
  description: string; // meta description (~150-160 chars)
  date: string; // ISO yyyy-mm-dd
  updated?: string;
  /** Related product slug, for the in-article CTA + internal link. */
  product?: string;
  /** Card blurb on the /guides hub. */
  excerpt: string;
  readMins: number;
  /** A small, deliberate next-reading path for the in-article guide graph. */
  related?: string[];
};

export const guides: Guide[] = [
  {
    slug: 'viewmaxxing-on-pc',
    title: 'How to Run Viewmaxxing on PC Without a TV Box (2026)',
    description:
      'Use Viewmaxxing on a VSeeBox, SuperBox, compatible Android TV box, or Windows PC. The new web beta is browser-ready; the APK route uses BlueStacks and keyboard controls.',
    date: '2026-07-11',
    updated: '2026-11-19',
    product: 'viewmaxxing',
    excerpt:
      'Viewmaxxing is built for VSeeBox, SuperBox, and compatible Android TV boxes — with a new PC web beta and an APK route for Windows.',
    readMins: 6,
    related: ['block-youtube-ads-free', 'reduce-discord-ram-usage'],
  },
  {
    slug: 'reduce-discord-ram-usage',
    title: 'Lightweight Discord Client on Windows: How to Cut RAM Use (2026)',
    description:
      'Lightweight Discord client on Windows? Cut RAM with settings, cache cleanup, and Discordmaxxer Tournament Mode for game sessions while you play.',
    date: '2026-06-17',
    updated: '2026-11-19',
    product: 'discordmaxxer',
    excerpt:
      'Make Discord lighter on Windows with quick settings, then use Discordmaxxer and Tournament Mode when you need less background load while you play.',
    readMins: 5,
    related: ['do-windows-gaming-tweaks-boost-fps', 'reduce-input-lag-pc-gaming'],
  },
  {
    slug: 'set-up-stream-alerts-obs',
    title: 'How to Set Up Stream Alerts and Multi-Platform Chat in OBS (2026)',
    description:
      'Set up free stream alerts and multi-platform chat in OBS with Streammaxxing. Connect OBS once, import alerts, and merge Twitch, Kick, YouTube, and TikTok chat.',
    date: '2026-11-19',
    updated: '2026-11-19',
    product: 'streammaxxing',
    excerpt:
      'Connect OBS once, import the alerts you already use, and put Twitch, Kick, YouTube, and TikTok chat in one stream overlay.',
    readMins: 6,
    related: ['reduce-discord-ram-usage', 'reduce-input-lag-pc-gaming'],
  },
  {
    slug: 'combine-music-library',
    title: 'How to Combine Spotify, SoundCloud, and YouTube in One Music Library (2026)',
    description:
      'Combine Spotify, SoundCloud, and YouTube in one browser library. Paste playlists into Playlistmaxxing, fix unmatched songs, and play without an account.',
    date: '2026-11-19',
    updated: '2026-11-19',
    product: 'playlistmaxxing',
    excerpt:
      'Keep Spotify, SoundCloud, and YouTube together, paste in what you already use, and keep unresolved matches visible instead of losing them.',
    readMins: 5,
    related: ['block-youtube-ads-free', 'viewmaxxing-on-pc'],
  },
  {
    slug: 'do-windows-gaming-tweaks-boost-fps',
    title: 'Do Windows Gaming Tweaks Actually Boost FPS? (2026)',
    description:
      'A practical Windows tuning guide: measure first, use Optimizationmaxxing safely, and skip registry folklore that does not move your FPS.',
    date: '2026-06-17',
    updated: '2026-11-19',
    product: 'optimizationmaxxing',
    excerpt:
      'A practical route from measuring your PC to using Optimizationmaxxing, with the placebo tweaks worth skipping.',
    readMins: 6,
    related: ['reduce-input-lag-pc-gaming', 'reduce-discord-ram-usage'],
  },
  {
    slug: 'block-youtube-ads-free',
    title: 'How to Block YouTube Ads for Free (2026)',
    description:
      'Install AdBlock-Maxxer on Chrome, Brave, or Edge, turn it on, and block YouTube ads for free — plus what to do when YouTube shows an ad-wall.',
    date: '2026-06-17',
    updated: '2026-11-19',
    product: 'adblockmaxxer',
    excerpt:
      'Download AdBlock-Maxxer, load it into your browser, turn on the right toggles, and handle server-side YouTube ad-walls honestly.',
    readMins: 5,
    related: ['viewmaxxing-on-pc', 'combine-music-library'],
  },
  {
    slug: 'best-fortnite-landing-spots',
    title: 'Best Fortnite Landing Spots: How to Win the Drop (2026)',
    description:
      'How to pick a Fortnite drop, set your bus line in Dropmaxxer, compare Fastest vs Safe, and land with a rotation plan.',
    date: '2026-06-17',
    updated: '2026-11-19',
    product: 'dropmaxxer',
    excerpt:
      'Use Dropmaxxer to set your bus path, choose a POI, compare Fastest vs Safe, and overlay Pro Drops before the match.',
    readMins: 6,
    related: ['do-windows-gaming-tweaks-boost-fps', 'reduce-input-lag-pc-gaming'],
  },
  {
    slug: 'reduce-input-lag-pc-gaming',
    title: 'How to Reduce Input Lag on PC for Competitive Gaming (2026)',
    description:
      'A practical input-lag checklist, then an honest Optimizationmaxxing walkthrough: Reflex, V-Sync, refresh rate, FPS caps, and measurement.',
    date: '2026-06-17',
    updated: '2026-11-19',
    product: 'optimizationmaxxing',
    excerpt:
      'Fix the big three first, then use Optimizationmaxxing to measure and roll back the last few milliseconds safely.',
    readMins: 6,
    related: ['do-windows-gaming-tweaks-boost-fps', 'reduce-discord-ram-usage'],
  },
  {
    slug: 'snipemaxxer-valorant-mobile-setup',
    title: 'How to Use Snipemaxxer for Valorant: RR, Teammates, Skins, and Mobile Setup (2026)',
    description:
      'Use Snipemaxxer for Valorant to read rank and RR, review teammates and skins, and choose a single-PC, two-PC, or mobile setup with read-only Riot context.',
    date: '2026-11-19',
    updated: '2026-11-19',
    product: 'snipemaxxer',
    excerpt:
      'See what Snipemaxxer can read from Riot Client, then choose the single-PC, two-PC, or phone setup that puts the lobby on the right screen.',
    readMins: 7,
    related: ['reduce-input-lag-pc-gaming', 'best-fortnite-landing-spots'],
  },
  {
    slug: 'use-aimmaxxer-aim-trainer',
    title: 'How to Use Aimmaxxer as a Game-Specific Aim Trainer (2026)',
    description:
      'Use Aimmaxxer’s short local aim read to check flicking, tracking, and switching, then copy a focused KovaaK’s routine for your game without an account.',
    date: '2026-11-19',
    updated: '2026-11-19',
    product: 'aimmaxxer',
    excerpt:
      'Run the local read, keep only signals with enough evidence, copy the game-specific KovaaK’s routine, and retest after a focused ten-minute block.',
    readMins: 5,
    related: ['reduce-input-lag-pc-gaming', 'do-windows-gaming-tweaks-boost-fps'],
  },
];

export function getGuide(slug: string) {
  return guides.find((g) => g.slug === slug);
}
