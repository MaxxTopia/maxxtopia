import assert from 'node:assert/strict'
import {
  REVIEW_CHANNEL_SIGNATURE,
  REVIEW_MODAL_ID,
  buildReviewEmbed,
  buildReviewInstruction,
  buildReviewModal,
  parseReviewInput,
  starsForRating,
} from '../tickets-worker/reviews.js'

const modal = buildReviewModal()
assert.equal(modal.custom_id, REVIEW_MODAL_ID)
assert.equal(modal.components.length, 3)
assert.equal(modal.components[0].components[0].custom_id, 'rating')
assert.equal(modal.components[0].components[0].max_length, 1)
assert.equal(modal.components[2].components[0].style, 2)
assert.equal(modal.components[2].components[0].max_length, 1200)

const valid = parseReviewInput({
  rating: '5',
  product: 'Discordmaxxer',
  comment: 'Fast, clean, and easy to use.',
})
assert.deepEqual(valid, {
  ok: true,
  rating: 5,
  product: 'Discordmaxxer',
  comment: 'Fast, clean, and easy to use.',
})
assert.equal(parseReviewInput({ rating: '0', comment: 'Nope' }).ok, false)
assert.equal(parseReviewInput({ rating: '6', comment: 'Nope' }).ok, false)
assert.equal(parseReviewInput({ rating: '5', comment: 'x' }).ok, false)
assert.equal(parseReviewInput({ rating: '5', comment: '@everyone please look' }).comment, '@\u200beveryone please look')
assert.equal(parseReviewInput({ rating: '5', comment: 'a'.repeat(1201) }).ok, true)

assert.equal(starsForRating(5), '⭐⭐⭐⭐⭐')
assert.equal(starsForRating(3), '⭐⭐⭐☆☆')

const embed = buildReviewEmbed({
  user: { id: '123456789012345678', avatar: 'avatar-hash' },
  displayName: 'Example Maxxer',
  rating: valid.rating,
  product: valid.product,
  comment: valid.comment,
  createdAt: '2026-08-29T12:00:00.000Z',
})
assert.match(embed.author.name, /DISCORDMAXXER/)
assert.match(embed.description, /^⭐⭐⭐⭐⭐\n\n/)
assert.match(embed.description, /Fast, clean/)
assert.equal(embed.fields[0].name, 'Review by:')
assert.equal(embed.fields[0].value, '<@123456789012345678>')
assert.equal(embed.thumbnail.url, 'https://cdn.discordapp.com/avatars/123456789012345678/avatar-hash.png?size=128')
assert.match(embed.footer.text, /Maxxtopia 2026/)
assert.equal(embed.timestamp, '2026-08-29T12:00:00.000Z')

const instruction = buildReviewInstruction()
assert.ok(instruction.startsWith(REVIEW_CHANNEL_SIGNATURE))
assert.match(instruction, /Share Your Feedback/)
assert.match(instruction, /`\/review`/)

console.log('review command tests passed')
