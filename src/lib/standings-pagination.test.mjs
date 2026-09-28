import test from 'node:test';
import assert from 'node:assert/strict';
import { planStandingsScan, standingsPageCount } from './standings-pagination.js';

test('plans the complete 79-page event field within the bounded page ceiling', () => {
  const plan = planStandingsScan({ reportedPages: 79, totalPlayers: 7900, pageSize: 100 });

  assert.equal(standingsPageCount({ reportedPages: 79 }), 79);
  assert.equal(plan.expectedPages, 79);
  assert.equal(plan.pageLimited, false);
  assert.equal(plan.timeoutMs, 320_000);
});

test('caps unusually large events at 10,000 teams and flags the partial scan', () => {
  const plan = planStandingsScan({ reportedPages: 125, totalPlayers: 12_500, pageSize: 100 });

  assert.equal(plan.expectedPages, 100);
  assert.equal(plan.pageLimited, true);
  assert.equal(plan.timeoutMs, 390_000);
});

test('stops at a known terminal page and scans conservatively when total pages are unknown', () => {
  assert.equal(planStandingsScan({ scanComplete: true, entriesOnPage: 40 }).expectedPages, 1);
  assert.equal(planStandingsScan({ entriesOnPage: 100 }).expectedPages, 100);
});
