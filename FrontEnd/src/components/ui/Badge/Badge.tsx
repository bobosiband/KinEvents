import React from 'react'

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

  const toneClasses: Record<BadgeTone, string> = {
    primary: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    accent: 'bg-accent text-accent-foreground',
    success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    danger: 'bg-destructive/15 text-destructive',
    warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    neutral: 'bg-muted text-muted-foreground',
    gold: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  }

  const sizeClasses: Record<BadgeSize, string> = {
    sm: 'text-[0.65rem] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }

  const classes = [
    'inline-flex items-center gap-1 rounded-full font-medium border border-transparent',
    toneClasses[resolvedTone],
    sizeClasses[size],
    pill ? 'rounded-full' : 'rounded-lg',
    dismissible ? 'pr-1.5' : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span ref={ref} className={classes} {...rest}>
      <span>{children}</span>
      {dismissible && (
        <button
          type="button"
          className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-current/80 hover:bg-black/10 dark:hover:bg-white/10"
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

