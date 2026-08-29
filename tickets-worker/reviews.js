/**
 * Review-wall presentation and input validation for the existing Maxxtopia
 * feedback Forum post.
 *
 * The post is intentionally a read-only surface. Users open this modal with
 * /review, and the worker publishes only the finished card into the post.
 */

const REVIEW_CHANNEL_SIGNATURE = '\u200b\u200d\ufeff\u2060'
const REVIEW_MODAL_ID = 'maxx:review:submit'
const REVIEW_COOLDOWN_SECONDS = 10 * 60
const REVIEW_MAX_COMMENT_LENGTH = 1200
const REVIEW_MAX_PRODUCT_LENGTH = 40

const REVIEW_COLOR = 0x16c7b7

function textInput(customId, label, style = 1, options = {}) {
  return {
    type: 4,
    custom_id: customId,
    style,
    label,
    required: options.required !== false,
    ...(options.placeholder ? { placeholder: options.placeholder } : {}),
    ...(options.maxLength ? { max_length: options.maxLength } : {}),
    ...(options.minLength ? { min_length: options.minLength } : {}),
  }
}

function row(component) {
  return { type: 1, components: [component] }
}

function buildReviewModal() {
  return {
    custom_id: REVIEW_MODAL_ID,
    title: 'Share your feedback',
    components: [
      row(textInput('rating', 'Rating (1–5)', 1, {
        placeholder: '5',
        maxLength: 1,
      })),
      row(textInput('product', 'Product (optional)', 1, {
        required: false,
        placeholder: 'Example: Discordmaxxer',
        maxLength: REVIEW_MAX_PRODUCT_LENGTH,
      })),
      row(textInput('comment', 'What should we know?', 2, {
        placeholder: 'What worked? What should we improve?',
        minLength: 2,
        maxLength: REVIEW_MAX_COMMENT_LENGTH,
      })),
    ],
  }
}

function parseReviewInput({ rating, product, comment } = {}) {
  const parsedRating = Number.parseInt(String(rating ?? '').trim(), 10)
  if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return { ok: false, error: 'Choose a rating from 1 to 5.' }
  }

  const cleanComment = cleanReviewText(comment, REVIEW_MAX_COMMENT_LENGTH)
  if (cleanComment.length < 2) {
    return { ok: false, error: 'Add a little more detail so the review is useful.' }
  }

  const cleanProduct = cleanReviewText(product, REVIEW_MAX_PRODUCT_LENGTH)
  return {
    ok: true,
    rating: parsedRating,
    product: cleanProduct,
    comment: cleanComment,
  }
}

function cleanReviewText(value, maxLength) {
  return String(value ?? '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/@/g, '@\u200b')
    .trim()
    .slice(0, maxLength)
}

function starsForRating(rating) {
  const safeRating = Math.max(1, Math.min(5, Number(rating) || 1))
  return '⭐'.repeat(safeRating) + '☆'.repeat(5 - safeRating)
}

function buildReviewEmbed({ user, displayName, rating, product, comment, createdAt } = {}) {
  const userId = String(user?.id ?? '').trim()
  const username = cleanReviewText(displayName || user?.global_name || user?.username || 'Maxxer', 80)
  const embed = {
    author: {
      name: product
        ? `MAXX BOT  ·  ${cleanReviewText(product, REVIEW_MAX_PRODUCT_LENGTH).toUpperCase()}`
        : 'MAXX BOT  ·  VERIFIED FEEDBACK',
    },
    description: `${starsForRating(rating)}\n\n${cleanReviewText(comment, REVIEW_MAX_COMMENT_LENGTH)}`,
    color: REVIEW_COLOR,
    fields: [
      {
        name: 'Review by:',
        value: userId ? `<@${userId}>` : username,
        inline: false,
      },
    ],
    footer: { text: '© Maxxtopia 2026 | All rights reserved.' },
    timestamp: createdAt || new Date().toISOString(),
  }

  const avatar = avatarUrl(user)
  if (avatar) embed.thumbnail = { url: avatar }
  return embed
}

function avatarUrl(user) {
  const userId = String(user?.id ?? '').trim()
  const avatar = String(user?.avatar ?? '').trim()
  if (!/^\d+$/.test(userId) || !avatar) return null
  return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png?size=128`
}

function buildReviewInstruction() {
  return [
    REVIEW_CHANNEL_SIGNATURE,
    '🌟 **Share Your Feedback!**',
    '',
    'Use the `/review` command to let us know what you think and help us improve!',
  ].join('\n')
}

export {
  REVIEW_CHANNEL_SIGNATURE,
  REVIEW_MODAL_ID,
  REVIEW_COOLDOWN_SECONDS,
  REVIEW_MAX_COMMENT_LENGTH,
  REVIEW_MAX_PRODUCT_LENGTH,
  buildReviewEmbed,
  buildReviewInstruction,
  buildReviewModal,
  parseReviewInput,
  starsForRating,
}
