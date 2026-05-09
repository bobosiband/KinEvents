import React, { useState } from 'react'
import styles from './Tabs.module.css'

export interface TabItem {
  id: string
  label: string
  icon?: React.ReactNode
  badge?: number | string
  content: React.ReactNode
  disabled?: boolean
}

export interface TabsProps {
  items: TabItem[]
  defaultTab?: string
  onChange?: (tabId: string) => void
  variant?: 'default' | 'cards'
  className?: string
}

/**
 * Tabs Component
 * 
 * Organize content into tabbed sections.
 * Supports icons, badges, and different variants.
 * 
 * @example
 * <Tabs items={[
 *   { id: 'upcoming', label: 'Upcoming', content: <UpcomingEvents /> },
 *   { id: 'past', label: 'Past', content: <PastEvents /> },
 * ]} />
 */
export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  function Tabs({ items, defaultTab, onChange, variant = 'default', className }, ref) {
    const [activeTab, setActiveTab] = useState(defaultTab || items[0]?.id)

    const handleTabChange = (tabId: string) => {
      setActiveTab(tabId)
      onChange?.(tabId)
    }

    const activeItem = items.find((item) => item.id === activeTab)

    return (
      <div ref={ref} className={`${styles.tabs} ${styles[variant]} ${className || ''}`}>
        <div className={styles.tabList} role="tablist">
          {items.map((item) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={activeTab === item.id}
              aria-controls={`tab-${item.id}`}
              className={`${styles.tab} ${activeTab === item.id ? styles.active : ''} ${
                item.disabled ? styles.disabled : ''
              }`}
              onClick={() => !item.disabled && handleTabChange(item.id)}
              disabled={item.disabled}
            >
              {item.icon && <span className={styles.icon}>{item.icon}</span>}
              <span className={styles.label}>{item.label}</span>
              {item.badge && <span className={styles.badge}>{item.badge}</span>}
            </button>
          ))}
        </div>

        <div className={styles.tabPanel} id={`tab-${activeTab}`} role="tabpanel">
          {activeItem?.content}
        </div>
      </div>
    )
  }
)

Tabs.displayName = 'Tabs'

export default Tabs
