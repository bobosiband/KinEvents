import type { HTMLAttributes, ReactNode } from 'react'
import styles from './Badge.module.css'

type BadgeTone = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  children: ReactNode
}

export function Badge({ tone = 'neutral', children, className = '', ...props }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[tone]} ${className}`} {...props}>
      {children}
    </span>
  )
}
