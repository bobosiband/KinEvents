import React from 'react'
import { getInitials, nameToColor } from '@/utils/avatarUtils'

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
  const initials = getInitials(name || '')
  const bg = nameToColor(name || '')

  const resolvedStatus = showOnline ? 'online' : status

  const sizeClass = size === 'sm'
    ? 'w-8 h-8 text-xs'
    : size === 'lg'
      ? 'w-12 h-12 text-base'
      : size === 'xl'
        ? 'w-16 h-16 text-lg'
        : 'w-10 h-10 text-sm'

  const classes = [
    'relative inline-flex items-center justify-center rounded-full text-white font-semibold overflow-hidden',
    sizeClass,
    className || '',
  ].filter(Boolean).join(' ')

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
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none'
          }}
        />
      ) : (
        <span>{initials}</span>
      )}

      {resolvedStatus && (

        <span
          className={`absolute right-0 bottom-0 w-2.5 h-2.5 rounded-full border border-card ${resolvedStatus === 'online' ? 'bg-green-500' : resolvedStatus === 'away' ? 'bg-yellow-500' : 'bg-gray-400'}`}
          aria-label={`Status: ${resolvedStatus}`}

        />
      )}
    </div>
  )
}

Avatar.displayName = 'Avatar'

export default Avatar

