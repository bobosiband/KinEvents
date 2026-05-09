import React from 'react'

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

  const variantClass = variant === 'flat'
    ? 'bg-card border border-border'
    : variant === 'interactive'
      ? 'bg-card shadow-md hover:shadow-xl'
      : variant === 'ghost'
        ? 'bg-transparent border border-border/40'
        : variant === 'bordered'
          ? 'bg-card border border-border'
          : 'bg-card shadow-md'

  const paddingClass = padding === 'small'
    ? 'p-3'
    : padding === 'large'
      ? 'p-6'
      : 'p-4'

  const classNames = [
    'rounded-2xl transition-all',
    variantClass,
    paddingClass,
    isClickable ? 'cursor-pointer hover:-translate-y-0.5' : '',
    disabled ? 'opacity-60 pointer-events-none' : '',
    className || '',
  ].filter(Boolean).join(' ')

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

