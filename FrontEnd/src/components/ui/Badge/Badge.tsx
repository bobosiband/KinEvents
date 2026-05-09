import React from 'react'
import styles from './Badge.module.css'

type Tone = 'primary' | 'accent' | 'gold' | 'success' | 'danger' | 'neutral'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
  pill?: boolean
  icon?: React.ReactNode
}

export const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', pill = false, icon, children, className, ...rest }) => {
  const classes = [styles.badge, styles[tone] || '', pill ? styles.pill : '', className || ''].filter(Boolean).join(' ')
  return (
    <span className={classes} {...rest}>
      {icon ? <span className={styles.icon}>{icon}</span> : null}
      <span>{children}</span>
    </span>
  )
}

export default Badge

