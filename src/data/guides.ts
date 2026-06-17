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
];

export function getGuide(slug: string) {
  return guides.find((g) => g.slug === slug);
}
