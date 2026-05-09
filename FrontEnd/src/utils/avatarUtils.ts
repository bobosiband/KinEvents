const WARM_COLORS = [
  '#ff6b6b', '#ff9a9e', '#a8e6cf', '#6eb5ff',
  '#d4a5ff', '#ffd93d', '#ffa07a', '#88d8c0',
]

export function getInitials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function nameToColor(name: string): string {
  if (!name) return WARM_COLORS[0]
  let sum = 0
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i)
  return WARM_COLORS[sum % WARM_COLORS.length]
}
