export const STANDINGS_PAGE_SIZE = 100;
export const STANDINGS_MAX_PAGES = 100;
export const STANDINGS_PAGE_CONCURRENCY = 3;

export function standingsPageCount(data) {
  const reported = Number(data?.reportedPages);
  if (Number.isInteger(reported) && reported > 0) return reported;

  const total = Number(data?.totalPlayers ?? data?.totalEntries ?? data?.totalTeams);
  if (Number.isFinite(total) && total >= 0) {
    return Math.max(1, Math.ceil(total / (Number(data?.pageSize) || STANDINGS_PAGE_SIZE)));
  }

  const entriesOnPage = Number(data?.entriesOnPage);
  if (data?.scanComplete === true || (data?.entriesOnPage != null && Number.isFinite(entriesOnPage) && entriesOnPage < STANDINGS_PAGE_SIZE)) {
    return 1;
  }
  return null;
}

export function planStandingsScan(data) {
  const knownPages = standingsPageCount(data);
  const expectedPages = Math.min(STANDINGS_MAX_PAGES, knownPages || STANDINGS_MAX_PAGES);
  const pageLimited = Boolean(data?.scanLimited) || (knownPages != null && knownPages > STANDINGS_MAX_PAGES);
  const batchesAfterFirstPage = Math.ceil(Math.max(0, expectedPages - 1) / STANDINGS_PAGE_CONCURRENCY);

  return {
    knownPages,
    expectedPages,
    pageLimited,
    timeoutMs: Math.min(420_000, 60_000 + batchesAfterFirstPage * 10_000),
  };
}
