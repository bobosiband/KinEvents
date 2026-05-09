/**
 * Deterministic color palette for birthday cards and other UI elements
 * Uses the same approach as Avatar for consistent color assignment based on name
 */

const CARD_COLORS = [
  'var(--color-primary)',
  'var(--color-accent)',
  'var(--color-gold)',
  'var(--color-success)',
  'var(--color-danger)',
  'var(--color-neutral)',
]

const CARD_GRADIENTS = [
  'linear-gradient(135deg, #EF6C6C 0%, #F49090 100%)', // primary
  'linear-gradient(135deg, #4ECDC4 0%, #7EDDD7 100%)', // accent
  'linear-gradient(135deg, #FFD166 0%, #FFBE33 100%)', // gold
  'linear-gradient(135deg, #06D6A0 0%, #20C997 100%)', // success
  'linear-gradient(135deg, #EF476F 0%, #FF6B9D 100%)', // danger/pink
  'linear-gradient(135deg, #8B8FA8 0%, #A8AABD 100%)', // neutral
]

/**
 * Picks a color from the palette deterministically based on a name or string
 * Uses the same algorithm as Avatar.pickPalette for consistency
 */
export function pickCardColor(name?: string, useGradient = false): string {
  if (!name) return useGradient ? CARD_GRADIENTS[0] : CARD_COLORS[0]

  let sum = 0
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i)
  }

  const palette = useGradient ? CARD_GRADIENTS : CARD_COLORS
  return palette[sum % palette.length]
}

export { CARD_COLORS, CARD_GRADIENTS }
