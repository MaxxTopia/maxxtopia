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
};

export const guides: Guide[] = [
  {
    slug: 'viewmaxxing-on-pc',
    title: 'How to Run Viewmaxxing on PC Without a TV Box (2026)',
    description:
      'Use Viewmaxxing on a VSeeBox, SuperBox, compatible Android TV box, or Windows PC. The new web beta is browser-ready; the APK route uses BlueStacks and keyboard controls.',
    date: '2026-07-11',
    updated: '2026-08-23',
    product: 'viewmaxxing',
    excerpt:
      'Viewmaxxing is built for VSeeBox, SuperBox, and compatible Android TV boxes — with a new PC web beta and an APK route for Windows.',
    readMins: 6,
  },
  {
    slug: 'reduce-discord-ram-usage',
    title: "How to Reduce Discord's RAM Usage on Windows (2026)",
    description:
      'Seven practical ways to cut Discord memory on Windows, including installing Discordmaxxer and turning on Tournament Mode for game sessions.',
    date: '2026-06-17',
    updated: '2026-08-23',
    product: 'discordmaxxer',
    excerpt:
      'Start with quick settings, then install Discordmaxxer and turn on Tournament Mode when you need Discord lighter while you play.',
    readMins: 5,
  },
  {
    slug: 'do-windows-gaming-tweaks-boost-fps',
    title: 'Do Windows Gaming Tweaks Actually Boost FPS? (2026)',
    description:
      'A practical Windows tuning guide: measure first, use Optimizationmaxxing safely, and skip registry folklore that does not move your FPS.',
    date: '2026-06-17',
    updated: '2026-08-23',
    product: 'optimizationmaxxing',
    excerpt:
      'A practical route from measuring your PC to using Optimizationmaxxing, with the placebo tweaks worth skipping.',
    readMins: 6,
  },
  {
    slug: 'block-youtube-ads-free',
    title: 'How to Block YouTube Ads for Free (2026)',
    description:
      'Install AdBlock-Maxxer on Chrome, Brave, or Edge, turn it on, and block YouTube ads for free — plus what to do when YouTube shows an ad-wall.',
    date: '2026-06-17',
    updated: '2026-08-23',
    product: 'adblockmaxxer',
    excerpt:
      'Download AdBlock-Maxxer, load it into your browser, turn on the right toggles, and handle server-side YouTube ad-walls honestly.',
    readMins: 5,
  },
  {
    slug: 'best-fortnite-landing-spots',
    title: 'Best Fortnite Landing Spots: How to Win the Drop (2026)',
    description:
      'How to pick a Fortnite drop, set your bus line in Dropmaxxer, compare Fastest vs Safe, and land with a rotation plan.',
    date: '2026-06-17',
    updated: '2026-08-23',
    product: 'dropmaxxer',
    excerpt:
      'Use Dropmaxxer to set your bus path, choose a POI, compare Fastest vs Safe, and overlay Pro Drops before the match.',
    readMins: 6,
  },
  {
    slug: 'reduce-input-lag-pc-gaming',
    title: 'How to Reduce Input Lag on PC for Competitive Gaming (2026)',
    description:
      'A practical input-lag checklist, then an honest Optimizationmaxxing walkthrough: Reflex, V-Sync, refresh rate, FPS caps, and measurement.',
    date: '2026-06-17',
    updated: '2026-08-23',
    product: 'optimizationmaxxing',
    excerpt:
      'Fix the big three first, then use Optimizationmaxxing to measure and roll back the last few milliseconds safely.',
    readMins: 6,
  },
];

export function getGuide(slug: string) {
  return guides.find((g) => g.slug === slug);
}
