const COMBINING_MARKS = /[\u0300-\u036f]/g;

function normalizeSearchText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .toLocaleLowerCase('en-US')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function namesForRow(row) {
  const names = [row?.name, row?.teamName, row?.displayName];
  if (Array.isArray(row?.members)) {
    names.push(...row.members.map((member) => member?.name));
  }
  if (Array.isArray(row?.trackedPlayers)) names.push(...row.trackedPlayers);
  return [...new Set(names.map(normalizeSearchText).filter(Boolean))];
}

function editDistanceWithinOne(left, right) {
  if (left === right) return 0;
  if (Math.abs(left.length - right.length) > 1) return Infinity;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return Infinity;
    if (left.length === right.length) {
      if (left[i] === right[j + 1] && left[i + 1] === right[j]) {
        i += 2;
        j += 2;
        continue;
      }
      i += 1;
      j += 1;
    } else if (left.length > right.length) {
      i += 1;
    } else {
      j += 1;
    }
  }
  if (i < left.length || j < right.length) edits += 1;
  return edits <= 1 ? edits : Infinity;
}

function tokenMatchScore(queryToken, candidateToken) {
  if (candidateToken === queryToken) return 0;
  if (candidateToken.startsWith(queryToken) || candidateToken.includes(queryToken)) return 0;
  if (queryToken.length < 4) return Infinity;
  return editDistanceWithinOne(queryToken, candidateToken);
}

function matchScore(names, queryTokens) {
  const candidateTokens = names.flatMap((name) => name.split(/\s+/));
  let total = 0;
  for (const queryToken of queryTokens) {
    let best = Infinity;
    for (const candidateToken of candidateTokens) {
      best = Math.min(best, tokenMatchScore(queryToken, candidateToken));
      if (best === 0) break;
    }
    if (!Number.isFinite(best)) return Infinity;
    total += best;
  }
  return total;
}

export function matchesStandingsSearch(row, query) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;
  const queryTokens = normalizedQuery.split(/\s+/);
  return Number.isFinite(matchScore(namesForRow(row), queryTokens));
}

export function matchingStandingsName(row, query) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return '';
  const queryTokens = normalizedQuery.split(/\s+/);
  const names = namesForRow(row);
  if (!Number.isFinite(matchScore(names, queryTokens))) return '';
  const originalNames = [];
  if (Array.isArray(row?.members)) originalNames.push(...row.members.map((member) => member?.name));
  if (Array.isArray(row?.trackedPlayers)) originalNames.push(...row.trackedPlayers);
  originalNames.push(row?.name, row?.teamName, row?.displayName);
  const matched = originalNames.find((name) => {
    const normalized = normalizeSearchText(name);
    return normalized && Number.isFinite(matchScore([normalized], queryTokens));
  });
  return typeof matched === 'string' ? matched.trim() : '';
}
