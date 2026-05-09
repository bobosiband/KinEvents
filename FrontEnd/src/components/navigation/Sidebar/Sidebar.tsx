import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import styles from './Sidebar.module.css'

export interface SidebarNavItem {
  icon: React.ReactNode
  label: string
  path: string
  badge?: number | string
  submenu?: SidebarNavItem[]
}

export interface SidebarProps {
  items: SidebarNavItem[]
  logo?: React.ReactNode
  title?: string
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  className?: string
}

/**
 * Sidebar Component
 * 
 * Desktop navigation sidebar with collapsible menu.
 * Supports nested submenu items and active state indication.
 * 
 * @example
 * <Sidebar 
 *   title="KinEvents"
 *   items={[
 *     { icon: <HomeIcon />, label: 'Home', path: '/' },
 *     { icon: <EventIcon />, label: 'Events', path: '/events', 
 *       submenu: [
 *         { icon: <ListIcon />, label: 'All Events', path: '/events' },
 *       ]
 *     },
 *   ]}
 *   collapsed={false}
 *   onCollapsedChange={(collapsed) => {}}
 * />
 */
export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  function Sidebar(
    {
      items,
      logo,
      title,
      collapsed = false,
      onCollapsedChange,
      className,
    },
    ref
  ) {
    const location = useLocation()
    const [expandedMenu, setExpandedMenu] = useState<string | null>(null)

    const isActive = (path: string) => {
      return location.pathname === path || location.pathname.startsWith(path + '/')
    }

    const handleMenuToggle = (path: string) => {
      setExpandedMenu(expandedMenu === path ? null : path)
    }

    const renderNavItem = (item: SidebarNavItem, depth = 0) => {
      const hasSubmenu = item.submenu && item.submenu.length > 0
      const isItemActive = isActive(item.path)
      const isExpanded = expandedMenu === item.path

      return (
        <div key={item.path} className={styles.navItemWrapper}>
          {hasSubmenu ? (
            <>
              <button
                className={`${styles.navItem} ${isItemActive ? styles.active : ''} ${styles.hasSubmenu}`}
                onClick={() => handleMenuToggle(item.path)}
                aria-expanded={isExpanded}
                aria-label={item.label}
              >
                <span className={styles.icon}>{item.icon}</span>
                {!collapsed && (
                  <>
                    <span className={styles.label}>{item.label}</span>
                    <span className={styles.chevron} />
                  </>
                )}
                {item.badge && !collapsed && <span className={styles.badge}>{item.badge}</span>}
              </button>
              {isExpanded && !collapsed && (
                <div className={styles.submenu}>
                  {item.submenu?.map((subitem) => renderNavItem(subitem, depth + 1))}
                </div>
              )}
            </>
          ) : (
            <Link
              to={item.path}
              className={`${styles.navItem} ${isItemActive ? styles.active : ''}`}
              aria-current={isItemActive ? 'page' : undefined}
            >
              <span className={styles.icon}>{item.icon}</span>
              {!collapsed && (
                <>
                  <span className={styles.label}>{item.label}</span>
                  {item.badge && <span className={styles.badge}>{item.badge}</span>}
                </>
              )}
            </Link>
          )}
        </div>
      )
    }

    return (
      <aside
        ref={ref}
        className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${className || ''}`}
      >
        {/* Header */}
        {!collapsed && (
          <div className={styles.header}>
            {logo && <div className={styles.logo}>{logo}</div>}
            {title && <h1 className={styles.title}>{title}</h1>}
          </div>
        )}

        {/* Navigation */}
        <nav className={styles.nav} aria-label="Main navigation">
          {items.map((item) => renderNavItem(item))}
        </nav>

        {/* Collapse Button */}
        <button
          className={styles.collapseButton}
          onClick={() => onCollapsedChange?.(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <span className={styles.collapseIcon}>{'<'}</span>
        </button>
      </aside>
    )
  }
)

Sidebar.displayName = 'Sidebar'

export default Sidebar
