import React from 'react'
import styles from './Button.module.css'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
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
  const classes = [
    styles.btn,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : null,
    disabled || loading ? styles.disabled : null,
    className || null,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button ref={ref} className={classes} disabled={disabled || loading} {...rest}>
      {loading ? (
        <span className={styles.icon} aria-hidden>
          <span className={styles.spinner} />
        </span>
      ) : null}

      {!loading && icon && iconPosition === 'left' ? <span className={styles.icon}>{icon}</span> : null}

      {children}

      {!loading && icon && iconPosition === 'right' ? <span className={styles.icon}>{icon}</span> : null}
    </button>
  )
})

export default Button

