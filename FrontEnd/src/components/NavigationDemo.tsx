import React, { useState } from 'react'
import {
  BottomNav,
  Sidebar,
  Header,
  Breadcrumbs,
  Tabs,
  Pagination,
  Dropdown,
} from '@/components/navigation'
import { Button, Card } from '@/components/ui'
import styles from './NavigationDemo.module.css'

export const NavigationDemo: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const navigationItems = [
    { icon: '🏠', label: 'Home', path: '/' },
    { icon: '📅', label: 'Events', path: '/events', badge: 3 },
    { icon: '👥', label: 'Family', path: '/users' },
    { icon: '🎂', label: 'Birthdays', path: '/birthdays' },
    { icon: '⚙️', label: 'Settings', path: '/settings' },
  ]

  const sidebarItems = [
    { icon: '🏠', label: 'Dashboard', path: '/' },
    {
      icon: '📅',
      label: 'Events',
      path: '/events',
      badge: 3,
      submenu: [
        { icon: '📝', label: 'All Events', path: '/events' },
        { icon: '➕', label: 'Create Event', path: '/events/new' },
        { icon: '📊', label: 'Statistics', path: '/events/stats' },
      ],
    },
    {
      icon: '👥',
      label: 'Family',
      path: '/users',
      submenu: [
        { icon: '👤', label: 'Members', path: '/users' },
        { icon: '➕', label: 'Add Member', path: '/users/new' },
        { icon: '🔐', label: 'Permissions', path: '/users/permissions' },
      ],
    },
    { icon: '🎂', label: 'Birthdays', path: '/birthdays' },
    { icon: '⚙️', label: 'Settings', path: '/settings' },
  ]

  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    { label: 'Events', path: '/events' },
    { label: 'Summer Party 2024' },
  ]

  const tabItems = [
    {
      id: 'upcoming',
      label: 'Upcoming',
      icon: '⏰',
      badge: 3,
      content: (
        <div className={styles.tabContent}>
          <p>Upcoming events...</p>
          <Card padding="medium">Family Reunion - June 15</Card>
          <Card padding="medium">Birthday Party - June 20</Card>
        </div>
      ),
    },
    {
      id: 'past',
      label: 'Past',
      icon: '✓',
      content: (
        <div className={styles.tabContent}>
          <p>Past events...</p>
          <Card padding="medium">Wedding Anniversary - May 10</Card>
          <Card padding="medium">Easter Gathering - April 9</Card>
        </div>
      ),
    },
    {
      id: 'cancelled',
      label: 'Cancelled',
      icon: '✗',
      disabled: true,
      content: <p>No cancelled events</p>,
    },
  ]

  const dropdownItems = [
    {
      id: 'edit',
      label: 'Edit Event',
      icon: '✏️',
      onSelect: () => window.alert('Edit clicked'),
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: '📄',
      onSelect: () => window.alert('Duplicate clicked'),
    },
    {
      id: 'share',
      label: 'Share Link',
      icon: '🔗',
      onSelect: () => window.alert('Share clicked'),
    },
    {
      id: 'delete',
      label: 'Delete Event',
      icon: '🗑️',
      danger: true,
      onSelect: () => window.alert('Delete clicked'),
    },
  ]

  return (
    <div className={styles.demoContainer}>
      <h1>Navigation Components Demo</h1>

      {/* Header Demo */}
      <section className={styles.section}>
        <h2>Header Component</h2>
        <Card padding="large">
          <Header
            title="Events"
            subtitle="Manage family events and celebrations"
            icon="📅"
            actions={
              <div className={styles.actions}>
                <Button variant="secondary">Filter</Button>
                <Button variant="primary">Create Event</Button>
              </div>
            }
          />
        </Card>
      </section>

      {/* Breadcrumbs Demo */}
      <section className={styles.section}>
        <h2>Breadcrumbs Component</h2>
        <Card padding="large">
          <Breadcrumbs items={breadcrumbItems} />
        </Card>
      </section>

      {/* Tabs Demo */}
      <section className={styles.section}>
        <h2>Tabs Component</h2>
        <Card padding="large">
          <Tabs items={tabItems} defaultTab="upcoming" />
        </Card>
      </section>

      {/* Pagination Demo */}
      <section className={styles.section}>
        <h2>Pagination Component</h2>
        <Card padding="large">
          <div className={styles.paginationContent}>
            <div className={styles.itemsGrid}>
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className={styles.item}>
                  Event {item + (currentPage - 1) * 6}
                </div>
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={5}
              onPageChange={setCurrentPage}
            />
          </div>
        </Card>
      </section>

      {/* Dropdown Demo */}
      <section className={styles.section}>
        <h2>Dropdown Component</h2>
        <Card padding="large">
          <div className={styles.dropdownRow}>
            <Dropdown
              align="left"
              items={dropdownItems}
              trigger={<Button variant="secondary">Open Actions</Button>}
            />
            <p className={styles.dropdownHint}>
              Keyboard: Open with Enter/Space, move with arrow keys, close with Escape.
            </p>
          </div>
        </Card>
      </section>

      {/* Mobile Navigation Demo */}
      <section className={styles.section}>
        <h2>Bottom Navigation (Mobile)</h2>
        <div className={styles.mobilePreview}>
          <div className={styles.deviceFrame}>
            <div className={styles.phoneScreen}>
              <div className={styles.screenContent}>
                <p>Mobile Navigation Example</p>
                <p>(Visible on mobile screens)</p>
              </div>
              <BottomNav items={navigationItems} />
            </div>
          </div>
        </div>
      </section>

      {/* Desktop Navigation Demo */}
      <section className={styles.section}>
        <h2>Sidebar Navigation (Desktop)</h2>
        <div className={styles.desktopPreview}>
          <div className={styles.layoutFrame}>
            <div className={styles.layoutContent}>
              <Sidebar
                items={sidebarItems}
                title="KinEvents"
                collapsed={sidebarCollapsed}
                onCollapsedChange={setSidebarCollapsed}
              />
              <div className={styles.mainContent}>
                <p>Main content area</p>
                <p>Sidebar is {sidebarCollapsed ? 'collapsed' : 'expanded'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features List */}
      <section className={styles.section}>
        <h2>Navigation Features Implemented</h2>
        <Card padding="large">
          <div className={styles.featuresList}>
            <div className={styles.feature}>
              <h3>✅ BottomNav</h3>
              <p>Mobile-first bottom navigation with icons, labels, and badges</p>
            </div>
            <div className={styles.feature}>
              <h3>✅ Sidebar</h3>
              <p>Collapsible desktop sidebar with submenu support</p>
            </div>
            <div className={styles.feature}>
              <h3>✅ Header</h3>
              <p>Sticky page header with title, subtitle, and action buttons</p>
            </div>
            <div className={styles.feature}>
              <h3>✅ Breadcrumbs</h3>
              <p>Navigation path indicator with active page marking</p>
            </div>
            <div className={styles.feature}>
              <h3>✅ Tabs</h3>
              <p>Tabbed content switcher with icons and badges</p>
            </div>
            <div className={styles.feature}>
              <h3>✅ Pagination</h3>
              <p>Page navigation with smart ellipsis and disabled states</p>
            </div>
            <div className={styles.feature}>
              <h3>✅ Dropdown</h3>
              <p>Context menu with portal rendering and keyboard support</p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}

export default NavigationDemo
