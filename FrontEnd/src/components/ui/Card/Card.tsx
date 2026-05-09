import React from 'react'
import styles from './Card.module.css'

export type CardVariant = 'default' | 'elevated' | 'ghost' | 'bordered'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  onClick?: React.MouseEventHandler<HTMLElement>
  disabled?: boolean
}

export const Card: React.FC<CardProps> = ({ variant = 'default', onClick, disabled = false, children, className, ...rest }) => {
  const clickable = typeof onClick === 'function'
  const base = [styles.card, className || '']
  if (variant === 'elevated') base.push(styles.elevated)
  if (variant === 'ghost') base.push(styles.ghost)
  if (variant === 'bordered') base.push(styles.bordered)
  if (clickable) base.push(styles.clickable)
  if (disabled) base.push(styles.disabled)

  const classNames = base.filter(Boolean).join(' ')

  if (clickable) {
    return (
      <button type="button" className={classNames} onClick={onClick as React.MouseEventHandler<HTMLButtonElement>} disabled={disabled} {...(rest as any)}>
        <span className={styles.content}>{children}</span>
      </button>
    )
  }

  return (
    <div className={classNames} {...rest}>
      <div className={styles.content}>{children}</div>
    </div>
  )
}

export default Card

