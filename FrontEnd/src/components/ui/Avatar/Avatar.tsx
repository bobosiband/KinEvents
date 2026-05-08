import styles from './Avatar.module.css'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps {
  name: string
  src?: string
  size?: AvatarSize
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('')
}

function palette(name: string): string {
  const hash = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return styles[`palette${hash % 6}`]
}

export function Avatar({ name, src, size = 'md' }: AvatarProps) {
  return (
    <span className={`${styles.avatar} ${styles[size]} ${palette(name)}`} aria-label={name}>
      {src ? <img src={src} alt="" /> : initials(name)}
    </span>
  )
}
