/**
 * Optimizationmaxxing Source Wall — 20 curated tweaks from the in-app catalog
 * (resources/catalog/v1.json, v1.8.2, 2026-05-10). Surfaces what no other
 * tuner publishes: where each setting actually came from.
 *
 * Honest sourcing: each entry attributes the source TYPE and the publisher,
 * not a fabricated URL. Real URLs live in the in-app citation panel where
 * they were audited at catalog-build time.
 */

export type SourceCategory =
  | 'Registry'
  | 'Network'
  | 'NVIDIA'
  | 'RAM'
  | 'Process'
  | 'Timer'
  | 'Display'
  | 'BCD'
  | 'Power';

export type SourceType =
  | 'Microsoft Learn'
  | 'NVIDIA Dev'
  | 'Intel'
  | 'Vendor Doc'
  | 'Pro Config'
  | 'Community';

export type SourceTweak = {
  /** Catalog id — matches resources/catalog/v1.json. Deep-linkable in-app. */
  id: string;
  title: string;
  category: SourceCategory;
  /** ≤140 chars. Enough to convince, not enough to read like a manual. */
  blurb: string;
  sourceType: SourceType;
  /** Publisher / creator name. Always credit who actually documented this. */
  attribution: string;
};

export const omSourceWall: SourceTweak[] = [
  {
    id: 'display.mpo.disable',
    title: 'Disable Multi-Plane Overlay (MPO)',
    category: 'Display',
    blurb: 'Dual-monitor + DWM overlay stutter source. Single registry value, instantly reversible.',
    sourceType: 'NVIDIA Dev',
    attribution: 'NVIDIA driver-team forum responses + Hardware Unboxed multi-monitor coverage',
  },
  {
    id: 'network.tcp.ack-nodelay',
    title: 'TCP: immediate ACK + Nagle off',
    category: 'Network',
    blurb: 'Per-NIC: TcpAckFrequency=1 and TCPNoDelay=1. Real win for low-jitter game traffic.',
    sourceType: 'Microsoft Learn',
    attribution: 'Microsoft KB on Nagle\'s algorithm + competitive Apex/CS2 routing threads',
  },
  {
    id: 'network.qos.dscp-tag',
    title: 'QoS: DSCP packet tagging for game traffic',
    category: 'Network',
    blurb: 'New-NetQosPolicy tags Fortnite/CS2/Valorant/Apex traffic DSCP 46. Pairs with router QoS.',
    sourceType: 'Microsoft Learn',
    attribution: 'New-NetQosPolicy cmdlet docs + pro-circle Discord shared-WAN guides',
  },
  {
    id: 'ui.gamedvr.disable',
    title: 'Disable Game DVR & Game Bar',
    category: 'Process',
    blurb: 'Background-recording CPU thief. Reliably recovers 1–3% sustained CPU.',
    sourceType: 'Microsoft Learn',
    attribution: 'Xbox Game Bar docs · validated against Paragon + Hone presets',
  },
  {
    id: 'ui.fse.disable-global',
    title: 'Fullscreen-exclusive over borderless',
    category: 'Display',
    blurb: 'Removes the DWM compositor path that adds ~1 frame of input latency.',
    sourceType: 'Microsoft Learn',
    attribution: 'DXGI swapchain presentation modes docs',
  },
  {
    id: 'nvidia.hags.disable',
    title: 'Hardware-Accelerated GPU Scheduling off',
    category: 'NVIDIA',
    blurb: 'HAGS regresses frame pacing on most NVIDIA + Intel CPU combos in competitive titles.',
    sourceType: 'NVIDIA Dev',
    attribution: 'NVIDIA driver release notes · frame-time analysis on Hardware Unboxed',
  },
  {
    id: 'nvidia.reflex.preset',
    title: 'NVIDIA Reflex preset (per-game)',
    category: 'NVIDIA',
    blurb: 'Forces Reflex on at the driver level for supported titles where the in-game toggle is missing.',
    sourceType: 'NVIDIA Dev',
    attribution: 'NVIDIA Reflex SDK developer docs',
  },
  {
    id: 'ram.mmagent.tune',
    title: 'MMAgent prefetch + standby tuning',
    category: 'RAM',
    blurb: 'Suppresses prefetcher churn on 32 GB+ rigs where the cache outlives the launch.',
    sourceType: 'Microsoft Learn',
    attribution: 'Memory Manager (MMAgent) PowerShell reference',
  },
  {
    id: 'ram.standby.clean',
    title: 'Standby list scheduled clean',
    category: 'RAM',
    blurb: 'Periodic SetSystemFileCacheSize-driven flush. Killed the stutter window in long sessions.',
    sourceType: 'Microsoft Learn',
    attribution: 'Cache Manager + working set APIs docs · validated against RAMMap behaviour',
  },
  {
    id: 'timer.hpet.off',
    title: 'HPET (High Precision Event Timer) off',
    category: 'Timer',
    blurb: 'BCD store: useplatformclock=No. Lets the TSC carry timer load — lower DPC latency.',
    sourceType: 'Microsoft Learn',
    attribution: 'BCDEdit timer settings reference',
  },
  {
    id: 'timer.tsc.invariant',
    title: 'Invariant TSC + tscsyncpolicy=Enhanced',
    category: 'Timer',
    blurb: 'Pins the OS to the invariant TSC clock source for sub-microsecond timing on supported CPUs.',
    sourceType: 'Intel',
    attribution: 'Intel SDM Vol 3B · CPUID feature flag 80000007h:EDX[8]',
  },
  {
    id: 'process.priority.foreground',
    title: 'Foreground priority boost',
    category: 'Registry',
    blurb: 'Win32PrioritySeparation = 26 (6/2/2). Foreground gets longer quantums, less preemption.',
    sourceType: 'Microsoft Learn',
    attribution: 'Process Scheduling internals · Russinovich Windows Internals chapter 4',
  },
  {
    id: 'process.cpusets.pin',
    title: 'Click-to-pin CPU Sets API',
    category: 'Process',
    blurb: 'NtSetSystemInformation CPUSets binds a game to specific cores at runtime. No reboot, fully reversible.',
    sourceType: 'Microsoft Learn',
    attribution: 'CPU Sets Win32 API docs · Xbox dev-day session on per-process scheduling',
  },
  {
    id: 'network.rss.tune',
    title: 'RSS queue + interrupt moderation',
    category: 'Network',
    blurb: 'Per-NIC: enable Receive-Side Scaling, tune RxIntModeration. Cuts packet-handling jitter on >1 GbE.',
    sourceType: 'Vendor Doc',
    attribution: 'Intel + Realtek NIC tuning whitepapers',
  },
  {
    id: 'bcd.disable-mitigations',
    title: 'Per-process speculative-execution mitigations off',
    category: 'BCD',
    blurb: 'Selective off via Set-ProcessMitigation for game executables. Recovers ~5–8% on Intel pre-Alder Lake.',
    sourceType: 'Microsoft Learn',
    attribution: 'Set-ProcessMitigation cmdlet + Spectre/Meltdown mitigation docs',
  },
  {
    id: 'power.ultimate.unlock',
    title: 'Ultimate Performance power plan',
    category: 'Power',
    blurb: 'Unlocks the workstation-class power plan on consumer SKUs via powercfg /duplicatescheme.',
    sourceType: 'Microsoft Learn',
    attribution: 'powercfg reference + Windows 10 IT Pro power plan docs',
  },
  {
    id: 'registry.svchost-split',
    title: 'SvcHostSplitThresholdInKB tune',
    category: 'Registry',
    blurb: 'On low-RAM rigs, merges service host processes to recover idle memory pressure.',
    sourceType: 'Microsoft Learn',
    attribution: 'SvcHost grouping behaviour · Windows 10 v1703 release notes',
  },
  {
    id: 'display.refresh.lock',
    title: 'Per-display refresh-rate lock',
    category: 'Display',
    blurb: 'Forces preferred refresh in registry so DWM never round-trips through DDC at session start.',
    sourceType: 'Microsoft Learn',
    attribution: 'Display Driver Model (WDDM) reference · monitor PNP key paths',
  },
  {
    id: 'process.efficiency.off',
    title: 'Disable Win11 Efficiency Mode for game .exes',
    category: 'Process',
    blurb: 'IFEO entry stops Windows from demoting backgrounded game processes to EcoQoS.',
    sourceType: 'Microsoft Learn',
    attribution: 'Image File Execution Options (IFEO) + PowerThrottling docs',
  },
  {
    id: 'network.dns.competitive',
    title: 'DNS-over-HTTPS off + Cloudflare 1.1.1.1',
    category: 'Network',
    blurb: 'DoH adds median 8–14 ms on first resolve. Direct UDP + Cloudflare matches resolve latency to pings.',
    sourceType: 'Vendor Doc',
    attribution: 'Cloudflare 1.1.1.1 docs · DNS resolve-time benchmarks',
  },
];

/** Deterministic "citation of the day" — date-seeded rotation, same shape as
 *  DailyQuote.astro, so repeat visits feel fresh without churn. */
export function citationOfTheDay(today = new Date()): SourceTweak {
  const dayNum = Math.floor(today.getTime() / 86_400_000);
  return omSourceWall[dayNum % omSourceWall.length];
}

export const omSourceWallCategories: SourceCategory[] = [
  'Registry',
  'Network',
  'NVIDIA',
  'RAM',
  'Process',
  'Timer',
  'Display',
  'BCD',
  'Power',
];

/** Total audited tweaks in the in-app catalog (counter ticks 0 → this). */
export const omTotalTweaks = 87;
