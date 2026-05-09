import React from 'react'
import styles from './Avatar.module.css'

type Size = 'sm' | 'md' | 'lg' | 'xl'

type Status = 'online' | 'offline' | 'away'

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string
  src?: string
  size?: Size
  status?: Status

  /**
   * Legacy prop alias used by some pages.
   * When true, maps to status="online".
   */
  showOnline?: boolean

  alt?: string

  className?: string
}

const PALETTES = [
  'var(--gradient-primary)',
  'var(--gradient-accent)',
  'var(--gradient-gold)',
  'linear-gradient(135deg, var(--color-success) 0%, rgba(6,214,160,0.6) 100%)',
  'linear-gradient(135deg, var(--color-neutral) 0%, rgba(139,143,168,0.8) 100%)',
  'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)',
]

function nameToInitials(name?: string) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase()
}

function pickPalette(name?: string) {
  if (!name) return PALETTES[0]
  let sum = 0
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i)
  return PALETTES[sum % PALETTES.length]
}

/**
 * Avatar Component
 * 
 * Displays user avatar with image, initials fallback, and optional status indicator.
 * 
 * @example
 * <Avatar name="John Doe" src="/avatar.jpg" />
 * <Avatar name="Jane Doe" size="lg" status="online" />
 */
export const Avatar: React.FC<AvatarProps> = ({ 
  name, 
  src, 
  size = 'md', 
  status,
  showOnline,
  alt, 
  className,
  ...rest 
}) => {
  const initials = nameToInitials(name)
  const bg = pickPalette(name)

  const resolvedStatus = showOnline ? 'online' : status

  const classes = [
    styles.avatar,
    styles[size],
    resolvedStatus ? styles.withStatus : null,

    className || '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div 
      className={classes} 
      style={{ background: src ? undefined : bg }}
      {...rest}
    >
      {src ? (
        <img 
          src={src} 
          alt={alt ?? name ?? 'User avatar'} 
          className={styles.image}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none'
          }}
        />
      ) : (
        <span className={styles.initials}>{initials}</span>
      )}

      {resolvedStatus && (

        <span
          className={`${styles.statusIndicator} ${styles[resolvedStatus]}`}
          aria-label={`Status: ${resolvedStatus}`}

        />
      )}
    </div>
  )
}

Avatar.displayName = 'Avatar'

export default Avatar

