import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesStandingsSearch, matchingStandingsName } from './standings-search.js';

const coldTeam = {
  rank: 8,
  name: 'Twis Cold & Muz',
  members: [{ name: 'Twis Cold' }, { name: 'Muz' }],
};

test('finds a player from a partial name and returns the current team rank row', () => {
  assert.equal(matchesStandingsSearch(coldTeam, 'cold'), true);
  assert.equal(matchingStandingsName(coldTeam, 'cold'), 'Twis Cold');
  assert.equal(coldTeam.rank, 8);
});

test('matches a transposed typo in a longer name token', () => {
  assert.equal(matchesStandingsSearch(coldTeam, 'clod'), true);
  assert.equal(matchingStandingsName(coldTeam, 'clod'), 'Twis Cold');
});

test('matches multiple query words across player names in the team', () => {
  assert.equal(matchesStandingsSearch(coldTeam, 'twis muz'), true);
  assert.equal(matchesStandingsSearch(coldTeam, 'twis cold'), true);
});

test('does not fuzzy-match unrelated short names', () => {
  assert.equal(matchesStandingsSearch({ name: 'Muz' }, 'mup'), false);
  assert.equal(matchesStandingsSearch({ name: 'Muz' }, 'cold'), false);
});

test('ignores accents and punctuation when matching', () => {
  assert.equal(matchesStandingsSearch({ name: 'Cøld—EU' }, 'cold eu'), true);
});

test('empty search matches every loaded row', () => {
  assert.equal(matchesStandingsSearch({ name: 'Anything' }, '  '), true);
});
