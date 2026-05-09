import React from 'react'
import styles from './Card.module.css'

export type CardVariant = 'elevated' | 'flat' | 'interactive' | 'ghost' | 'bordered'


export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  padding?: 'small' | 'medium' | 'large'
  clickable?: boolean
  href?: string
  onClick?: React.MouseEventHandler<HTMLElement>
  disabled?: boolean
  className?: string
}

/**
 * Card Component
 * 
 * Flexible card component for displaying content with optional elevation and hover effects.
 * 
 * @example
 * <Card variant="elevated" padding="medium">
 *   <h3>Card Title</h3>
 *   <p>Card content</p>
 * </Card>
 */
export const Card: React.FC<CardProps> = ({ 
  variant = 'elevated',
  padding = 'medium',
  clickable,
  onClick, 
  disabled = false, 
  children, 
  className,
  href,
  ...rest 
}) => {
  const isClickable = clickable || typeof onClick === 'function' || !!href
  
  const classNames = [
    styles.card,
    styles[variant as keyof typeof styles],
    styles[`padding-${padding}` as keyof typeof styles],
    isClickable ? styles.clickable : null,
    disabled ? styles.disabled : null,
    className || '',
  ]
    .filter(Boolean)
    .join(' ')

  if (href) {
    return (
      <a href={href} className={classNames} {...(rest as any)}>
        {children}
      </a>
    )
  }

  if (isClickable) {
    return (
      <button 
        type="button" 
        className={classNames} 
        onClick={onClick as React.MouseEventHandler<HTMLButtonElement>} 
        disabled={disabled} 
        {...(rest as any)}
      >
        {children}
      </button>
    )
  }

  return (
    <div className={classNames} {...rest}>
      {children}
    </div>
  )
}

export default Card

