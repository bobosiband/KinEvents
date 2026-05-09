import React from 'react'
import styles from './Button.module.css'
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
  // Build className string
  const classes = [
    styles.button,
    styles[variant as keyof typeof styles],
    styles[size as keyof typeof styles],
    fullWidth ? styles.fullWidth : null,
    isLoading ? styles.loading : null,
    className || null,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button 
      ref={ref} 
      className={classes} 
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...rest}
    >
      {isLoading ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : null}

      {!isLoading && icon && iconPosition === 'left' ? (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      ) : null}

      {children}

      {!isLoading && icon && iconPosition === 'right' ? (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      ) : null}
    </button>
  )
})

Button.displayName = 'Button'

export default Button

