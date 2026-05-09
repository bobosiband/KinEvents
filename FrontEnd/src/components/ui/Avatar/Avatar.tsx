import React from 'react'
import styles from './Avatar.module.css'

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface AvatarProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  name?: string
  src?: string
  size?: Size
  showOnline?: boolean
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
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function pickPalette(name?: string) {
  if (!name) return PALETTES[0]
  let sum = 0
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i)
  return PALETTES[sum % PALETTES.length]
}

export const Avatar: React.FC<AvatarProps> = ({ name, src, size = 'md', showOnline = false, alt, ...rest }) => {
  const cls = [styles.avatar, styles[size], showOnline ? styles.online : ''].filter(Boolean).join(' ')
  const initials = nameToInitials(name)
  const bg = pickPalette(name)

  return (
    <div className={cls} style={{ background: src ? undefined : bg }} aria-label={name || 'Avatar'}>
      {src ? <img src={src} alt={alt ?? name ?? 'avatar'} className={styles.img} {...rest} /> : <div className={styles.initials}>{initials}</div>}
    </div>
  )
}

export default Avatar

