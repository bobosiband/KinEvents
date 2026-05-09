import React from 'react'
import { Link } from 'react-router-dom'
import styles from './Breadcrumbs.module.css'

export interface BreadcrumbItem {
  label: string
  path?: string
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  separator?: string
  className?: string
}

/**
 * Breadcrumbs Component
 * 
 * Shows navigation path with clickable links and separators.
 * Last item is the current page (not a link).
 * 
 * @example
 * <Breadcrumbs items={[
 *   { label: 'Home', path: '/' },
 *   { label: 'Events', path: '/events' },
 *   { label: 'Summer Party' },
 * ]} />
 */
export const Breadcrumbs = React.forwardRef<HTMLElement, BreadcrumbsProps>(
  function Breadcrumbs({ items, separator = '/', className }, ref) {
    return (
      <nav ref={ref} className={`${styles.breadcrumbs} ${className || ''}`} aria-label="Breadcrumbs">
        <ol className={styles.list}>
          {items.map((item, index) => {
            const isLast = index === items.length - 1

            return (
              <li key={index} className={styles.item}>
                {isLast ? (
                  <span className={styles.current} aria-current="page">
                    {item.label}
                  </span>
                ) : (
                  <>
                    <Link to={item.path || '#'} className={styles.link}>
                      {item.label}
                    </Link>
                    <span className={styles.separator} aria-hidden="true">
                      {separator}
                    </span>
                  </>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    )
  }
)

Breadcrumbs.displayName = 'Breadcrumbs'

export default Breadcrumbs
