import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  RULESETS,
  THRESHOLDS,
  calculateStormForecast,
  advanceDamage,
  formatStormDiscord,
  formatStormEmbed,
} from '../tickets-worker/storm-calculator.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const read = file => fs.readFileSync(path.join(here, '..', file), 'utf8')

assert.equal(RULESETS.battleRoyale.zones.length, 12)
assert.equal(RULESETS.reload.zones.length, 12)
assert.equal(RULESETS.battleRoyale.referenceLabel, 'Chapter 7 Season 1 · Comp')
assert.equal(RULESETS.battleRoyale.openingWaitSeconds, 60)
assert.deepEqual(RULESETS.battleRoyale.zones[5], { zone: 6, wait: 40, close: 70, total: 930, dps: 5 })
assert.deepEqual(RULESETS.reload.zones[11], { zone: 12, wait: 0, close: 90, total: 1080, dps: 10 })
assert.deepEqual(RULESETS.reload.thresholds, THRESHOLDS)
assert(RULESETS.reload.timingWarning.includes('Mini-Venture'))

const early = calculateStormForecast({
  mode: 'battleRoyale',
  zone: 1,
  phase: 'waiting',
  timeLeftSeconds: 110,
  damageTaken: 0,
})
assert.equal(early.ok, true)
assert.equal(early.referencePhaseEndSeconds, 255)
assert.equal(early.referenceDps, 0)
assert.equal(early.timeToWarningSeconds, null)
assert.equal(early.timeToSicknessSeconds, null)
assert.equal(early.forecastAtPhaseEnd, 0)
assert.equal(early.statusLabel, 'SAFE · UNDER 500')
assert.equal(early.leaveTimerSeconds, null)
assert(early.referenceTimeToSicknessSeconds != null)

const crossing = calculateStormForecast({
  mode: 'battleRoyale',
  zone: 6,
  phase: 'closing',
  timeLeftSeconds: 30,
  damageTaken: 550,
})
assert.equal(crossing.ok, true)
assert.equal(crossing.timeToSicknessSeconds, 10)
assert.equal(crossing.referenceTimeToSicknessSeconds, 10)
assert.equal(crossing.leaveTimerSeconds, 20)
assert.equal(crossing.statusLabel, 'WARNING · 500–599')
assert.equal(crossing.forecastAtPhaseEnd, 900)

const active = calculateStormForecast({
  mode: 'reload',
  zone: 9,
  phase: 'closing',
  timeLeftSeconds: 20,
  damageTaken: 600,
})
assert.equal(active.activeDps, 30)
assert.equal(active.statusLabel, 'MAX THREAT · 600+')
assert.equal(active.threatLabel, 'MAX THREAT')
assert.equal(active.leaveTimerSeconds, 0)

const override = calculateStormForecast({
  mode: 'reload',
  zone: 1,
  phase: 'waiting',
  timeLeftSeconds: 20,
  damageTaken: 0,
  dpsOverride: 4,
})
assert.equal(override.baseDps, 4)
assert.equal(override.dpsOverridden, true)
assert.equal(advanceDamage(599, 1, 1), 600)
assert.equal(advanceDamage(600, 10, 1), 630)

assert(formatStormDiscord(crossing).includes('Storm Sickness Calculator · Battle Royale'))
assert(formatStormDiscord(crossing).includes('Reference: Chapter 7 Season 1 · Comp'))
assert(formatStormDiscord(crossing).includes('after 600: 3x storm damage'))
assert(!formatStormDiscord(crossing).includes('1000'))
assert.equal(advanceDamage(600, 10, 2000), 60600)

const embed = formatStormEmbed(crossing)
assert.equal(embed.author.name, 'MAXX BOT  ·  FORTNITE TOOLS')
assert.equal(embed.title, '⚡ STORM SICKNESS CALCULATOR')
assert.equal(embed.color, 0xffc857)
assert(embed.description.includes('WARNING · 500–599'))
assert(embed.description.includes('0:20'))
assert(embed.description.includes('█████████░'))
assert(embed.fields.some(field => field.name === 'CURRENT READ' && field.value.includes('Zone 6')))
assert(embed.fields.some(field => field.name === 'THREAT TIERS' && field.value.includes('MAX THREAT')))
assert(embed.fields.some(field => field.name === 'LEAVE CALL' && field.value.includes('0:20')))
assert(embed.fields.some(field => field.name === 'TIMERS FROM NOW' && field.value.includes('0:10')))
assert(embed.footer.text.includes('Private quick read'))
assert(!embed.fields.some(field => field.value.includes('DPS override')))

const worker = read('tickets-worker/worker.js')
const register = read('scripts/register-slash-commands.mjs')
const readme = read('tickets-worker/README.md')
assert(worker.includes("if (name === 'storm')"))
assert(worker.includes('formatStormDiscord(result)'))
assert(worker.includes('formatStormEmbed(result)'))
assert(worker.includes('allowed_mentions: { parse: [] }'))
assert(register.includes("name: 'storm'"))
assert(register.includes("name: 'dps'"))
assert(readme.includes('do not require a special channel'))
assert(readme.includes('instead of presenting a hard-stop damage'))
assert(readme.includes('Mini-Venture'))

console.log('storm command fixture: focused checks passed')
