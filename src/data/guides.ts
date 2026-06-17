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
    slug: 'reduce-discord-ram-usage',
    title: "How to Reduce Discord's RAM Usage on Windows (2026)",
    description:
      "Discord can eat over 1 GB of RAM on Windows. Here's why it happens and seven concrete ways to cut it down — from built-in settings to a lighter client.",
    date: '2026-06-17',
    product: 'discordmaxxer',
    excerpt:
      "Why Discord eats 1 GB+ of memory while you game, and seven concrete ways to bring it back down.",
    readMins: 5,
  },
  {
    slug: 'do-windows-gaming-tweaks-boost-fps',
    title: 'Do Windows Gaming Tweaks Actually Boost FPS? (2026)',
    description:
      'Which Windows performance tweaks have real, sourced evidence behind them — and which are placebo. A no-nonsense breakdown for competitive players.',
    date: '2026-06-17',
    product: 'optimizationmaxxing',
    excerpt:
      'Which tweaks have sourced evidence behind them, which are placebo, and how to tell the difference.',
    readMins: 6,
  },
  {
    slug: 'block-youtube-ads-free',
    title: 'How to Block YouTube Ads for Free (2026)',
    description:
      'The honest, free ways to block YouTube ads on desktop in 2026 — what still works, what got patched, and the trade-offs of each. No sketchy installers.',
    date: '2026-06-17',
    product: 'extensionmaxxing',
    excerpt:
      'What actually still blocks YouTube ads for free in 2026 on desktop — and the trade-offs of each route.',
    readMins: 5,
  },
  {
    slug: 'best-fortnite-landing-spots',
    title: 'Best Fortnite Landing Spots: How to Win the Drop (2026)',
    description:
      'How to choose a landing spot and actually get there first — loot density, rotations, and the glider-cut math that decides who lands first.',
    date: '2026-06-17',
    product: 'dropmaxxer',
    excerpt:
      'Picking a drop is half the fight — landing there first is the other half. Loot, rotations, and the glider-cut math.',
    readMins: 6,
  },
  {
    slug: 'reduce-input-lag-pc-gaming',
    title: 'How to Reduce Input Lag on PC for Competitive Gaming (2026)',
    description:
      'Input lag is a chain, not one setting. The real fixes — Reflex, refresh rate, V-Sync, polling — ranked by how much they actually matter.',
    date: '2026-06-17',
    product: 'optimizationmaxxing',
    excerpt:
      'Input lag is a chain from your mouse to your monitor. The fixes that matter, ranked by real impact.',
    readMins: 6,
  },
];

export function getGuide(slug: string) {
  return guides.find((g) => g.slug === slug);
}
