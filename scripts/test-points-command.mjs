import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { calculatePointsForecast, calculatePrizeRace, formatPointsDiscord, formatPointsEmbed } from '../tickets-worker/points-calculator.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const read = file => fs.readFileSync(path.join(here, '..', file), 'utf8')

const chase = calculatePointsForecast({ current: 0, target: 300, games: 11 })
assert.equal(chase.ok, true)
assert.equal(chase.toQualify, 300)
assert.equal(chase.toSafeLine, 300)
assert.equal(chase.requiredPerGame, 300 / 11)
assert.equal(chase.progressPercent, 0)
assert.equal(chase.status, 'chase')
assert.equal(chase.statusLabel, 'CHASE THE RACE LINE')
assert.equal(chase.projectedAtPace, 300)

const above = calculatePointsForecast({ current: 325, target: 300, games: 4 })
assert.equal(above.status, 'qualified')
assert.equal(above.toQualify, 0)
assert.equal(above.requiredPerGame, 0)
assert.equal(above.progressPercent, 100)
assert.equal(above.statusLabel, 'ABOVE THE RACE LINE')

const cushion = calculatePointsForecast({ current: 300, target: 300, games: 10, buffer: 20 })
assert.equal(cushion.status, 'buffer')
assert.equal(cushion.toQualify, 0)
assert.equal(cushion.toSafeLine, 20)
assert.equal(cushion.requiredPerGame, 2)
assert.equal(cushion.statusLabel, 'AT THE LINE · BUILD BUFFER')

const noGames = calculatePointsForecast({ current: 280, target: 300, games: 0 })
assert.equal(noGames.status, 'noGames')
assert.equal(noGames.requiredPerGame, null)
assert.equal(noGames.projectedAtPace, null)
assert.equal(noGames.statusLabel, 'NO GAMES LEFT')

const exactZero = calculatePointsForecast({ current: 0, target: 0, games: 0 })
assert.equal(exactZero.status, 'qualified')
assert.equal(exactZero.progressPercent, 100)

assert.equal(calculatePointsForecast({ current: -1, target: 300, games: 11 }).ok, false)
assert.equal(calculatePointsForecast({ current: 0, target: 300, games: 1.5 }).ok, false)
assert.equal(calculatePointsForecast({ current: 0, target: 300 }).ok, false)
assert.equal(calculatePointsForecast({ current: 0, target: 300, games: 11, buffer: -1 }).ok, false)

assert(formatPointsDiscord(chase).includes('Need 300 more points'))
assert(formatPointsDiscord(chase).includes('27.27 points/game'))
assert(formatPointsDiscord(chase).includes('older-region estimates are not a live qualifying line'))

const manualEmbed = formatPointsEmbed(chase)
assert.equal(manualEmbed.author.name, 'MAXX BOT  ·  FORTNITE TOOLS')
assert.equal(manualEmbed.title, '🏆 POINTS READ // QUALIFICATION RACE')
assert.equal(manualEmbed.color, 0xffc857)
assert(manualEmbed.description.includes('CHASE THE RACE LINE'))
assert(manualEmbed.description.includes('░░░░░░░░░░░░'))
assert(manualEmbed.fields.some(field => field.name === 'GAMES LEFT' && field.value.includes('27.3 PPG')))
assert(manualEmbed.fields.some(field => field.name === 'TARGET SOURCE' && field.value.includes('Manual cutoff')))
assert(manualEmbed.footer.text.includes('private to you'))

const live = {
  ...chase,
  source: 'live',
  tournamentName: 'CrashBandicootCup ZB',
  roundType: 'Qualifiers',
  region: 'EU',
  ign: 'Exact Epic Name',
  rank: 700,
  gamesPlayed: 4,
  eventId: 'epicgames_S42_CrashBandicootCup_ZB_EU',
  windowId: 'S42_CrashBandicootCup_ZB_EU',
  targetLabel: 'Top 500 advance',
  targetType: 'rank',
  currentPoints: 120,
  targetPoints: 160,
  targetWithBuffer: 170,
  bufferPoints: 10,
  toQualify: 40,
  toSafeLine: 50,
  gamesLeft: 3,
  requiredPerGame: 50 / 3,
  progressPercent: 71,
}
const liveEmbed = formatPointsEmbed(live)
assert.equal(liveEmbed.title, '🏆 POINTS READ // LIVE QUALIFICATION')
assert(liveEmbed.fields.some(field => field.name === 'TOURNAMENT SNAPSHOT' && field.value.includes('CrashBandicootCup ZB')))
assert(liveEmbed.fields.some(field => field.name === 'TOURNAMENT SNAPSHOT' && field.value.includes('Exact Epic Name')))
assert(liveEmbed.fields.some(field => field.name === 'PLAYER READ' && field.value.includes('#700')))
assert(liveEmbed.fields.some(field => field.name === 'TARGET SOURCE' && field.value.includes('Top 500 advance')))
assert(liveEmbed.fields.some(field => field.name === 'FIELD NOTE' && field.value.includes('Exact live lookup')))
assert(formatPointsDiscord(live).includes('Refresh after each game'))

const finals = calculatePrizeRace({
  current: 220,
  rank: 10,
  games: 3,
  prizeLadder: [
    { minRank: 1, maxRank: 1, rewardLabel: 'USD 1,000', verified: true, livePointsAtBoundary: 300 },
    { minRank: 2, maxRank: 5, rewardLabel: '$500', verified: true, livePointsAtBoundary: 260 },
    { minRank: 6, maxRank: 25, rewardLabel: '$250', verified: true, livePointsAtBoundary: 180 },
  ],
  prizeLadderVerified: true,
  boundaryFetchedAt: '2026-08-29T18:00:03.000Z',
})
assert.equal(finals.ok, true)
assert.equal(finals.raceType, 'final')
assert.equal(finals.currentTier.maxRank, 25)
assert.equal(finals.targetTier.maxRank, 5)
assert.equal(finals.targetPoints, 260)
assert.equal(finals.pointsToTarget, 40)
assert.equal(finals.requiredPerGame, 40 / 3)
assert.equal(finals.status, 'inPrize')

const finalLive = {
  ...finals,
  source: 'live',
  region: 'EU',
  tournamentName: 'CrashBandicootCup Finals',
  roundType: 'Finals',
  ign: 'Exact Epic Name',
  gamesPlayed: 4,
  eventId: 'epicgames_S42_CrashBandicootCup_Finals_EU',
  windowId: 'S42_CrashBandicootCup_Finals_EU',
  targetLabel: 'Finals - place for prizes (no qualification)',
  targetType: 'final',
}
assert(formatPointsDiscord(finalLive).includes('Live Finals:'))
assert(formatPointsDiscord(finalLive).includes('boundary 260 pts'))
const finalsEmbed = formatPointsEmbed(finalLive)
assert.equal(finalsEmbed.title, '🏆 POINTS READ // FINALS PRIZE RACE')
assert(finalsEmbed.fields.some(field => field.name === 'CURRENT PRIZE BAND' && field.value.includes('Top 25')))
assert(finalsEmbed.fields.some(field => field.name === 'NEXT BETTER TIER' && field.value.includes('Top 5')))
assert(finalsEmbed.fields.some(field => field.name === 'PRIZE RACE' && field.value.includes('13.3 PPG')))
assert(finalsEmbed.fields.some(field => field.name === 'SOURCE & FRESHNESS' && field.value.includes('No other region or prior tournament')))

const opaqueFinals = calculatePrizeRace({
  current: 220,
  rank: 10,
  games: 3,
  prizeLadder: [
    { minRank: 1, maxRank: 1, verified: false, livePointsAtBoundary: 300 },
    { minRank: 2, maxRank: 5, verified: false, livePointsAtBoundary: 260 },
    { minRank: 6, maxRank: 25, verified: false, livePointsAtBoundary: 180 },
  ],
})
assert.equal(opaqueFinals.prizeLadderVerified, false)
assert(formatPointsDiscord({
  ...opaqueFinals,
  source: 'live',
  region: 'EU',
  tournamentName: 'CrashBandicootCup Finals',
  roundType: 'Finals',
  ign: 'Exact Epic Name',
  gamesPlayed: 4,
}).includes('No dollar amount is being guessed'))

const missingFinalBoundary = calculatePrizeRace({
  current: 220,
  rank: 10,
  games: 3,
  prizeLadder: [
    { minRank: 1, maxRank: 1, verified: true, livePointsAtBoundary: 300 },
    { minRank: 2, maxRank: 5, verified: true, livePointsAtBoundary: null },
    { minRank: 6, maxRank: 25, verified: true, livePointsAtBoundary: 180 },
  ],
})
assert.equal(missingFinalBoundary.targetTier.maxRank, 5)
assert.equal(missingFinalBoundary.targetPoints, null)
assert.equal(missingFinalBoundary.requiredPerGame, null)

const missingFinalRank = calculatePrizeRace({
  current: 220,
  rank: null,
  games: 3,
  prizeLadder: [{ minRank: 1, maxRank: 5, verified: true, livePointsAtBoundary: 260 }],
})
assert.equal(missingFinalRank.currentTier, null)
assert.equal(missingFinalRank.targetTier, null)
assert.equal(missingFinalRank.targetPoints, null)

const worker = read('tickets-worker/worker.js')
const register = read('scripts/register-slash-commands.mjs')
const readme = read('tickets-worker/README.md')
assert(worker.includes("if (name === 'points')"))
assert(worker.includes('ctx.waitUntil(handleLivePoints(interaction))'))
assert(worker.includes('formatPointsDiscord(result)'))
assert(worker.includes('formatPointsEmbed(result)'))
assert(register.includes("name: 'points'"))
assert(register.includes("name: 'current'"))
assert(register.includes("name: 'target'"))
assert(register.includes("name: 'games'"))
assert(register.includes("name: 'ign'"))
assert(register.includes("name: 'account_id'"))
assert(register.includes("name: 'region'"))
assert(register.includes("value: 'ALL'"))
assert(readme.includes('exact `eventId` and `windowId`'))
assert(readme.includes('across regions'))
assert(readme.includes('substitute a prior similar'))
assert(readme.includes('Finals'))
assert(readme.includes('account ID'))

console.log('points command fixture: focused checks passed')
