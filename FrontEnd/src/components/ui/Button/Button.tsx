import React from 'react'
import type { ButtonProps } from './Button.types'

/**
 * Button Component
 * 
 * Flexible button with multiple variants, sizes, and states.
 * 
 * @example
 * <Button variant="primary" size="medium">Click me</Button>
 * <Button variant="secondary" isLoading>Loading...</Button>
 * <Button variant="ghost" icon={<Icon />} size="small" />
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    // Legacy prop alias (some pages use `loading`)
    loading,

    fullWidth = false,
    icon,
    iconPosition = 'left',
    children,
    className,
    disabled,
    ...rest
  },
  ref
) {
  const resolvedLoading = isLoading || loading

  const sizeClass = size === 'small' || size === 'sm'
    ? 'px-3 py-2 text-sm'
    : size === 'large' || size === 'lg'
      ? 'px-5 py-3.5 text-base'
      : 'px-4 py-3 text-sm'

  const variantClass = variant === 'secondary'
    ? 'bg-card text-foreground border border-border shadow-md hover:shadow-lg'
    : variant === 'ghost'
      ? 'bg-transparent text-foreground hover:bg-muted shadow-none'
      : variant === 'danger'
        ? 'bg-destructive text-destructive-foreground shadow-lg hover:shadow-xl'
        : 'bg-primary text-primary-foreground shadow-lg hover:shadow-xl'

  const classes = [
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-shadow disabled:opacity-60 disabled:cursor-not-allowed',
    sizeClass,
    variantClass,
    fullWidth ? 'w-full' : '',
    className || '',
  ].filter(Boolean).join(' ')

  return (
    <button 
      ref={ref} 
      className={classes} 
      disabled={disabled || resolvedLoading}
      aria-busy={resolvedLoading}
      {...rest}
    >
      {resolvedLoading ? (
        <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden="true" />
      ) : null}

      {!resolvedLoading && icon && iconPosition === 'left' ? (
        <span aria-hidden="true">
          {icon}
        </span>
      ) : null}

      {children}

      {!resolvedLoading && icon && iconPosition === 'right' ? (
        <span aria-hidden="true">
          {icon}
        </span>
      ) : null}
    </button>
  )
})

Button.displayName = 'Button'

export default Button

