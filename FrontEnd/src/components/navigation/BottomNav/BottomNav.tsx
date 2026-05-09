import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import styles from './BottomNav.module.css'

export interface NavItem {
  icon: React.ReactNode
  label: string
  path: string
  badge?: number | string
}

export interface BottomNavProps {
  items: NavItem[]
  className?: string
}

/**
 * BottomNav Component
 * 
 * Mobile-first bottom navigation bar for easy thumb access.
 * Shows icon + label for each nav item with active state indication.
 * 
 * @example
 * <BottomNav items={[
 *   { icon: <HomeIcon />, label: 'Home', path: '/' },
 *   { icon: <EventIcon />, label: 'Events', path: '/events', badge: 3 },
 * ]} />
 */
export const BottomNav = React.forwardRef<HTMLElement, BottomNavProps>(
  function BottomNav({ items, className }, ref) {
    const location = useLocation()

    const isActive = (path: string) => {
      return location.pathname === path || location.pathname.startsWith(path + '/')
    }

    return (
      <nav ref={ref} className={`${styles.bottomNav} ${className || ''}`} aria-label="Main navigation">
        <div className={styles.container}>
          {items.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navItem} ${isActive(item.path) ? styles.active : ''}`}
              aria-label={item.label}
              aria-current={isActive(item.path) ? 'page' : undefined}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.label}>{item.label}</span>
              {item.badge && <span className={styles.badge}>{item.badge}</span>}
            </Link>
          ))}
        </div>
      </nav>
    )
  }
)

BottomNav.displayName = 'BottomNav'

export default BottomNav
