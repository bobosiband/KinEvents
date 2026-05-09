import React from 'react'
import styles from './Badge.module.css'

export type BadgeTone =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'danger'
  | 'warning'
  | 'neutral'
  | 'gold'

export type BadgeVariant = BadgeTone
export type BadgeSize = 'sm' | 'md' | 'lg'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * New API
   */
  variant?: BadgeVariant

  /**
   * Legacy API used in pages
   */
  tone?: BadgeTone

  /**
   * Rounded pill style
   */
  pill?: boolean

  size?: BadgeSize

  dismissible?: boolean
  onDismiss?: () => void
  className?: string
}

/**
 * Badge Component
 * 
 * Small component for displaying status, role, or count information.
 * 
 * @example
 * <Badge variant="primary">New</Badge>
 * <Badge variant="success" size="lg">Active</Badge>
 * <Badge variant="danger" dismissible onDismiss={() => {}}>Close</Badge>
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  {
    variant,
    tone,
    pill = false,
    size = 'md',
    dismissible = false,
    onDismiss,
    className,
    children,
    ...rest
  },

  ref
) {
  const resolvedTone = tone ?? variant ?? 'primary'

  const classes = [
    styles.badge,
    styles[resolvedTone],
    styles[size],
    pill ? styles.pill : null,
    dismissible ? styles.dismissible : null,
    className || '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span ref={ref} className={classes} {...rest}>
      <span className={styles.content}>{children}</span>
      {dismissible && (
        <button
          type="button"
          className={styles.dismissButton}
          onClick={onDismiss}
          aria-label="Dismiss badge"
        >
          ×
        </button>
      )}
    </span>
  )
})

Badge.displayName = 'Badge'

export default Badge

