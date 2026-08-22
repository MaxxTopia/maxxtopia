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
    blurb: 'Can help dual-monitor DWM stutter on some driver/display paths; test against a restore point.',
    sourceType: 'NVIDIA Dev',
    attribution: 'NVIDIA driver-team forum responses + Hardware Unboxed multi-monitor coverage',
  },
  {
    id: 'network.tcp.ack-nodelay',
    title: 'TCP: immediate ACK + Nagle off',
    category: 'Network',
    blurb: 'Changes ACK/Nagle behavior per NIC; it matters only for some traffic patterns, so measure before keeping it.',
    sourceType: 'Microsoft Learn',
    attribution: 'Microsoft KB on Nagle\'s algorithm + competitive Apex/CS2 routing threads',
  },
  {
    id: 'network.qos.dscp-tag',
    title: 'QoS: DSCP packet tagging for game traffic',
    category: 'Network',
    blurb: 'Tags selected game packets; it helps only when the router/WAN honors DSCP and does not lower server ping by itself.',
    sourceType: 'Microsoft Learn',
    attribution: 'New-NetQosPolicy cmdlet docs + pro-circle Discord shared-WAN guides',
  },
  {
    id: 'ui.gamedvr.disable',
    title: 'Disable Game DVR & Game Bar',
    category: 'Process',
    blurb: 'Disables background capture; may reduce overhead when capture is active, so compare CPU and frame time before keeping it.',
    sourceType: 'Microsoft Learn',
    attribution: 'Xbox Game Bar docs · validated against Paragon + Hone presets',
  },
  {
    id: 'ui.fse.disable-global',
    title: 'Fullscreen-exclusive over borderless',
    category: 'Display',
    blurb: 'Changes the presentation path; compositor behavior and latency vary by game and display, so compare both modes.',
    sourceType: 'Microsoft Learn',
    attribution: 'DXGI swapchain presentation modes docs',
  },
  {
    id: 'nvidia.hags.disable',
    title: 'Hardware-Accelerated GPU Scheduling off',
    category: 'NVIDIA',
    blurb: 'Windows, driver, and GPU dependent; compare frame time and latency with HAGS on and off on the same game build.',
    sourceType: 'NVIDIA Dev',
    attribution: 'NVIDIA driver release notes · frame-time analysis on Hardware Unboxed',
  },
  {
    id: 'nvidia.reflex.preset',
    title: 'NVIDIA Reflex preset (per-game)',
    category: 'NVIDIA',
    blurb: 'Uses a driver profile only where supported; the in-game Reflex toggle is preferred, then compare the game indicator.',
    sourceType: 'NVIDIA Dev',
    attribution: 'NVIDIA Reflex SDK developer docs',
  },
  {
    id: 'ram.mmagent.tune',
    title: 'MMAgent prefetch + standby tuning',
    category: 'RAM',
    blurb: 'Changes prefetch and standby behavior; system-dependent, so use it only when memory pressure or stutter is measured.',
    sourceType: 'Microsoft Learn',
    attribution: 'Memory Manager (MMAgent) PowerShell reference',
  },
  {
    id: 'ram.standby.clean',
    title: 'Standby list scheduled clean',
    category: 'RAM',
    blurb: 'Flushes standby cache periodically; it may hide pressure but can hurt cache behavior, so compare long-session frame time.',
    sourceType: 'Microsoft Learn',
    attribution: 'Cache Manager + working set APIs docs · validated against RAMMap behaviour',
  },
  {
    id: 'timer.hpet.off',
    title: 'HPET (High Precision Event Timer) off',
    category: 'Timer',
    blurb: 'Experimental BCD timer change; it can help or hurt by platform. Snapshot first and measure DPC and frame time.',
    sourceType: 'Microsoft Learn',
    attribution: 'BCDEdit timer settings reference',
  },
  {
    id: 'timer.tsc.invariant',
    title: 'Invariant TSC + tscsyncpolicy=Enhanced',
    category: 'Timer',
    blurb: 'Experimental timer policy for supported CPUs; firmware and OS behavior vary, so keep the restore path and measure.',
    sourceType: 'Intel',
    attribution: 'Intel SDM Vol 3B · CPUID feature flag 80000007h:EDX[8]',
  },
  {
    id: 'process.priority.foreground',
    title: 'Foreground priority boost',
    category: 'Registry',
    blurb: 'Changes foreground quantum bias; it may affect responsiveness but offers no universal FPS or input-latency guarantee.',
    sourceType: 'Microsoft Learn',
    attribution: 'Process Scheduling internals · Russinovich Windows Internals chapter 4',
  },
  {
    id: 'process.cpusets.pin',
    title: 'Click-to-pin CPU Sets API',
    category: 'Process',
    blurb: 'Runtime affinity policy; it may help a CPU-bound game on some rigs and hurt scheduling on others. Compare 1% lows.',
    sourceType: 'Microsoft Learn',
    attribution: 'CPU Sets Win32 API docs · Xbox dev-day session on per-process scheduling',
  },
  {
    id: 'network.rss.tune',
    title: 'RSS queue + interrupt moderation',
    category: 'Network',
    blurb: 'NIC and driver dependent; it can alter packet CPU work and jitter, so compare under the same network traffic.',
    sourceType: 'Vendor Doc',
    attribution: 'Intel + Realtek NIC tuning whitepapers',
  },
  {
    id: 'bcd.disable-mitigations',
    title: 'Per-process speculative-execution mitigations off',
    category: 'BCD',
    blurb: 'Experimental security trade-off; workload overhead varies, there is no fixed gain, and the exact revert path must remain available.',
    sourceType: 'Microsoft Learn',
    attribution: 'Set-ProcessMitigation cmdlet + Spectre/Meltdown mitigation docs',
  },
  {
    id: 'power.ultimate.unlock',
    title: 'Ultimate Performance power plan',
    category: 'Power',
    blurb: 'Keeps a more aggressive power policy; it may reduce idle savings but has no universal FPS gain. Compare clocks and frame time.',
    sourceType: 'Microsoft Learn',
    attribution: 'powercfg reference + Windows 10 IT Pro power plan docs',
  },
  {
    id: 'registry.svchost-split',
    title: 'SvcHostSplitThresholdInKB tune',
    category: 'Registry',
    blurb: 'Legacy low-RAM experiment; it can change process overhead and fault isolation. Skip it on modern rigs unless pressure is measured.',
    sourceType: 'Microsoft Learn',
    attribution: 'SvcHost grouping behaviour · Windows 10 v1703 release notes',
  },
  {
    id: 'display.refresh.lock',
    title: 'Per-display refresh-rate lock',
    category: 'Display',
    blurb: 'Sets a preferred display mode; it cannot override every driver/display setting or guarantee latency. Verify actual refresh.',
    sourceType: 'Microsoft Learn',
    attribution: 'Display Driver Model (WDDM) reference · monitor PNP key paths',
  },
  {
    id: 'process.efficiency.off',
    title: 'Disable Win11 Efficiency Mode for game .exes',
    category: 'Process',
    blurb: 'Stops selected executables from Efficiency Mode demotion; Windows and game behavior vary, so compare background and active play.',
    sourceType: 'Microsoft Learn',
    attribution: 'Image File Execution Options (IFEO) + PowerThrottling docs',
  },
  {
    id: 'network.dns.competitive',
    title: 'DNS-over-HTTPS off + Cloudflare 1.1.1.1',
    category: 'Network',
    blurb: 'Changes name resolution only; it does not change in-match ping after connection. Compare resolver lookup time on your network.',
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
export const omTotalTweaks = 100;
