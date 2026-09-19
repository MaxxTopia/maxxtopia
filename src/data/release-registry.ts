/**
 * The one site-facing source of release truth.
 *
 * Product release CI writes the six imported JSON records. The products that
 * publish outside that workflow are verified against their public manifests
 * and live download endpoints here. Product cards and receipts must read this
 * registry rather than carrying their own version or installer literals.
 */
import dmRelease from './discordmaxxer-release.json';
import omRelease from './optimizationmaxxing-release.json';
import cmRelease from './clipmaxxer-release.json';
import dpRelease from './dropmaxxer-release.json';
import amRelease from './aimmaxxer-release.json';
import vmRelease from './viewmaxxing-release.json';

export type ReleaseRecord = {
  version: string | null;
  installerUrl: string | null;
  releasePageUrl: string | null;
  publishedAt: string | null;
  source: 'release-ci' | 'public-manifest' | 'public-site' | 'web';
};

type SyncedRelease = Pick<ReleaseRecord, 'version' | 'installerUrl' | 'releasePageUrl' | 'publishedAt'>;

const fromReleaseCi = (release: SyncedRelease): ReleaseRecord => ({
  ...release,
  source: 'release-ci',
});

export const releaseRegistry = {
  optimizationmaxxing: fromReleaseCi(omRelease),
  discordmaxxer: fromReleaseCi(dmRelease),
  clipmaxxer: fromReleaseCi(cmRelease),
  dropmaxxer: fromReleaseCi(dpRelease),
  aimmaxxer: fromReleaseCi(amRelease),

  // The Android source is currently ahead of the public build. Keep the
  // version that the public Maxxtopia site actually distributes until a
  // matching 0.4.107 artifact is published and live-verified.
  viewmaxxing: {
    version: vmRelease.version ?? '0.4.102',
    installerUrl: null,
    releasePageUrl: null,
    publishedAt: null,
    source: 'public-site',
  },

  adblockmaxxer: {
    version: '1.6.22',
    installerUrl: 'https://dl.maxxtopia.com/adblockmaxxer-chrome-v1.6.22.zip',
    releasePageUrl: null,
    publishedAt: null,
    source: 'public-manifest',
  },

  streammaxxing: {
    version: '0.1.59',
    installerUrl: 'https://dl.maxxtopia.com/streammaxxing/streammaxxing-latest-x64-setup.exe',
    releasePageUrl: null,
    publishedAt: '2026-09-01T21:57:47Z',
    source: 'public-manifest',
  },

  snipemaxxer: {
    version: '0.3.10',
    installerUrl: 'https://dl.maxxtopia.com/snipemaxxer/Snipemaxxer-Setup-0.3.10.exe',
    releasePageUrl: null,
    publishedAt: null,
    source: 'public-manifest',
  },

  playlistmaxxing: {
    version: null,
    installerUrl: null,
    releasePageUrl: null,
    publishedAt: null,
    source: 'web',
  },
} satisfies Record<string, ReleaseRecord>;

export type ReleaseSlug = keyof typeof releaseRegistry;

export function releaseFor(slug: string): ReleaseRecord | null {
  return releaseRegistry[slug as ReleaseSlug] ?? null;
}

export function releaseVersion(release: ReleaseRecord | null): string {
  if (!release?.version) return '';
  return `v${release.version.replace(/^v/i, '')}`;
}

export function installerUrlFor(slug: ReleaseSlug): string {
  const url = releaseRegistry[slug].installerUrl;
  if (!url) throw new Error(`Release registry is missing an installer URL for ${slug}`);
  return url;
}
