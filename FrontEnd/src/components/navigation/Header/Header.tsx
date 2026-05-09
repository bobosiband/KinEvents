import React from 'react'
import styles from './Header.module.css'

export interface HeaderProps {
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

/**
 * Header Component
 * 
 * Top page header with title, subtitle, and optional action buttons.
 * Responsive - adapts for mobile and desktop layouts.
 * 
 * @example
 * <Header 
 *   title="Events"
 *   subtitle="Manage family events"
 *   actions={<Button>Create Event</Button>}
 * />
 */
export const Header = React.forwardRef<HTMLElement, HeaderProps>(
  function Header({ title, subtitle, icon, actions, className, children }, ref) {
    return (
      <header ref={ref} className={`${styles.header} ${className || ''}`}>
        <div className={styles.container}>
          <div className={styles.content}>
            <div className={styles.headingGroup}>
              {icon && <div className={styles.icon}>{icon}</div>}
              <div className={styles.textGroup}>
                {title && <h1 className={styles.title}>{title}</h1>}
                {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
              </div>
            </div>
            {children && <div className={styles.children}>{children}</div>}
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      </header>
    )
  }
)

Header.displayName = 'Header'

export default Header
