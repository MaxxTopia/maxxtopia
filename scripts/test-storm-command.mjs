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
assert.deepEqual(RULESETS.battleRoyale.zones[5], { zone: 6, wait: 50, close: 70, dps: 2 })
assert.deepEqual(RULESETS.reload.thresholds, THRESHOLDS)
assert(RULESETS.reload.timingWarning.includes('Mini-Venture'))

const early = calculateStormForecast({
  mode: 'battleRoyale',
  zone: 1,
  phase: 'waiting',
  timeLeftSeconds: 120,
  damageTaken: 0,
})
assert.equal(early.ok, true)
assert.equal(early.timeToWarningSeconds, 500)
assert.equal(early.timeToSicknessSeconds, 600)
assert.equal(early.forecastAtPhaseEnd, 120)
assert.equal(early.statusLabel, 'BELOW WARNING')

const crossing = calculateStormForecast({
  mode: 'battleRoyale',
  zone: 7,
  phase: 'closing',
  timeLeftSeconds: 30,
  damageTaken: 550,
})
assert.equal(crossing.ok, true)
assert.equal(crossing.timeToSicknessSeconds, 10)
assert.equal(crossing.forecastAtPhaseEnd, 900)

const active = calculateStormForecast({
  mode: 'reload',
  zone: 9,
  phase: 'closing',
  timeLeftSeconds: 20,
  damageTaken: 600,
})
assert.equal(active.activeDps, 30)
assert.equal(active.statusLabel, 'LEAVE NOW')

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

assert(formatStormDiscord(crossing).includes('Storm Sickness Calculator - Battle Royale'))
assert(formatStormDiscord(crossing).includes('After sickness: 3x damage'))
assert(!formatStormDiscord(crossing).includes('1000'))
assert.equal(advanceDamage(600, 10, 2000), 60600)

const embed = formatStormEmbed(crossing)
assert.equal(embed.author.name, 'MAXX BOT  ·  FORTNITE TOOLS')
assert.equal(embed.title, '⚡ STORM READ // ROTATE WINDOW')
assert.equal(embed.color, 0xffc857)
assert(embed.description.includes('ROTATE SOON'))
assert(embed.description.includes('█████████░'))
assert(embed.fields.some(field => field.name === 'MATCH SNAPSHOT' && field.value.includes('Zone 7')))
assert(embed.fields.some(field => field.name === 'DAMAGE TRACKER' && field.value.includes('550')))
assert(embed.fields.some(field => field.name === 'ROTATE WINDOW' && field.value.includes('0:10')))
assert(embed.footer.text.includes('private to you'))

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
