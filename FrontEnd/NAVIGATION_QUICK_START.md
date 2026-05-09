# Navigation Components - Quick Start Guide

This guide provides quick copy-paste examples for using all Week 2 navigation components.

## BottomNav - Mobile Navigation

**Use for**: Mobile-first apps, touch-friendly navigation

```tsx
import { BottomNav } from '@/components/navigation'

function App() {
  const items = [
    { icon: '🏠', label: 'Home', path: '/' },
    { icon: '📅', label: 'Events', path: '/events', badge: 3 },
    { icon: '👥', label: 'Family', path: '/users' },
    { icon: '⚙️', label: 'Settings', path: '/settings' },
  ]

  return <BottomNav items={items} />
}
```

**Props**:
- `items: NavItem[]` - Array of navigation items
- `className?: string` - Optional custom CSS class

**Features**:
- Auto-detects active link via URL
- Shows badges on items
- Hidden on desktop screens
- Touch-optimized sizes

---

## Sidebar - Desktop Navigation

**Use for**: Desktop layouts, collapsible navigation

```tsx
import { Sidebar } from '@/components/navigation'
import { useState } from 'react'

function Layout() {
  const [collapsed, setCollapsed] = useState(false)

  const items = [
    { icon: '🏠', label: 'Dashboard', path: '/' },
    {
      icon: '📅',
      label: 'Events',
      path: '/events',
      badge: 3,
      submenu: [
        { icon: '📝', label: 'All Events', path: '/events' },
        { icon: '➕', label: 'Create Event', path: '/events/new' },
      ],
    },
    { icon: '⚙️', label: 'Settings', path: '/settings' },
  ]

  return (
    <Sidebar
      items={items}
      title="KinEvents"
      collapsed={collapsed}
      onCollapsedChange={setCollapsed}
    />
  )
}
```

**Props**:
- `items: SidebarNavItem[]` - Navigation items with optional submenu
- `title?: string` - App title in header
- `logo?: React.ReactNode` - Logo element
- `collapsed?: boolean` - Collapsed state
- `onCollapsedChange?: (collapsed: boolean) => void` - Collapse callback
- `className?: string` - Custom CSS class

**Features**:
- Nested submenu support
- Collapsible with smooth animation
- Auto-detects active items
- Fixed positioning on desktop
- Hidden on mobile screens

---

## Header - Page Header

**Use for**: Page titles, subtitle, and action buttons

```tsx
import { Header } from '@/components/navigation'
import { Button } from '@/components/ui'

function EventsPage() {
  return (
    <Header
      title="Events"
      subtitle="Manage family events and celebrations"
      icon="📅"
      actions={
        <>
          <Button variant="secondary">Filter</Button>
          <Button variant="primary">Create Event</Button>
        </>
      }
    />
  )
}
```

**Props**:
- `title?: string` - Main page title
- `subtitle?: string` - Descriptive subtitle
- `icon?: React.ReactNode` - Icon or emoji
- `actions?: React.ReactNode` - Action buttons/controls
- `children?: React.ReactNode` - Custom content
- `className?: string` - Custom CSS class

**Features**:
- Sticky positioning
- Responsive layout (row on desktop, column on mobile)
- Flexible action area
- Icon support (emoji or React component)

---

## Breadcrumbs - Navigation Path

**Use for**: Show current page context in hierarchy

```tsx
import { Breadcrumbs } from '@/components/navigation'

function EventDetailPage() {
  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Events', path: '/events' },
    { label: 'Summer Party 2024' }, // Current page - no path
  ]

  return <Breadcrumbs items={breadcrumbs} separator="/" />
}
```

**Props**:
- `items: BreadcrumbItem[]` - Breadcrumb items
- `separator?: string` - Separator between items (default: `/`)
- `className?: string` - Custom CSS class

**Features**:
- Clickable links for ancestors
- Last item is non-clickable (current page)
- `aria-current="page"` for accessibility
- Customizable separator

**Example Output**:
```
Home / Events / Summer Party 2024
```

---

## Tabs - Content Switcher

**Use for**: Switch between different content views

```tsx
import { Tabs } from '@/components/navigation'

function EventsPage() {
  const tabs = [
    {
      id: 'upcoming',
      label: 'Upcoming',
      icon: '⏰',
      badge: 3,
      content: <UpcomingEventsList />,
    },
    {
      id: 'past',
      label: 'Past',
      icon: '✓',
      content: <PastEventsList />,
    },
    {
      id: 'archived',
      label: 'Archived',
      disabled: true,
      content: <div />,
    },
  ]

  return (
    <Tabs
      items={tabs}
      defaultTab="upcoming"
      variant="default"
      onChange={(tabId) => console.log('Selected:', tabId)}
    />
  )
}
```

**Props**:
- `items: TabItem[]` - Tab items with content
- `defaultTab?: string` - Initial active tab
- `onChange?: (tabId: string) => void` - Change callback
- `variant?: 'default' | 'cards'` - Style variant
- `className?: string` - Custom CSS class

**Features**:
- Icon and badge support per tab
- Disabled tabs
- Two visual variants
- Change callbacks
- Smooth fade animations

**TabItem Interface**:
```typescript
interface TabItem {
  id: string              // Unique identifier
  label: string           // Display label
  icon?: React.ReactNode  // Optional icon/emoji
  badge?: number | string // Badge count/text
  content: React.ReactNode // Tab content
  disabled?: boolean       // Disable tab
}
```

---

## Pagination - Page Navigation

**Use for**: Navigate between pages of content

```tsx
import { Pagination } from '@/components/navigation'
import { useState } from 'react'

function EventsListPage() {
  const [page, setPage] = useState(1)
  const totalPages = 10

  return (
    <>
      <div>
        {/* Show items for current page */}
        Page {page} of {totalPages}
      </div>
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        maxVisible={5}
      />
    </>
  )
}
```

**Props**:
- `currentPage: number` - Currently active page (1-based)
- `totalPages: number` - Total number of pages
- `onPageChange: (page: number) => void` - Page change callback
- `maxVisible?: number` - Max page numbers to show (default: 5)
- `className?: string` - Custom CSS class

**Features**:
- Smart page numbering with ellipsis
- Previous/Next buttons
- Disabled states
- `aria-current="page"` for accessibility

**Example for 50 items, 10 items per page, max 5 visible**:
```
← 1 2 3 4 5 ... 10 →
```

---

## Complete Layout Example

```tsx
import React, { useState } from 'react'
import {
  Sidebar,
  Header,
  Breadcrumbs,
  Tabs,
  BottomNav,
} from '@/components/navigation'
import { Card, Button } from '@/components/ui'
import styles from './Layout.module.css'

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const sidebarItems = [
    { icon: '🏠', label: 'Dashboard', path: '/' },
    { icon: '📅', label: 'Events', path: '/events' },
    { icon: '👥', label: 'Family', path: '/users' },
  ]

  const bottomNavItems = [
    { icon: '🏠', label: 'Home', path: '/' },
    { icon: '📅', label: 'Events', path: '/events' },
    { icon: '👥', label: 'Family', path: '/users' },
  ]

  return (
    <div className={styles.layout}>
      {/* Desktop Navigation */}
      <Sidebar
        items={sidebarItems}
        title="KinEvents"
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        className={styles.desktopOnly}
      />

      {/* Main Content */}
      <div className={styles.main}>
        {/* Page Header */}
        <Header
          title="Events"
          subtitle="Manage your family events"
          icon="📅"
          actions={<Button>Create Event</Button>}
        />

        {/* Breadcrumbs */}
        <div className={styles.container}>
          <Breadcrumbs
            items={[
              { label: 'Home', path: '/' },
              { label: 'Events' },
            ]}
          />

          {/* Page Content */}
          <Card padding="large">
            {/* Your content here */}
          </Card>
        </div>
      </div>

      {/* Mobile Navigation */}
      <BottomNav items={bottomNavItems} className={styles.mobileOnly} />
    </div>
  )
}
```

**Layout CSS**:
```css
.layout {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg);
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.container {
  flex: 1;
  padding: var(--space-6);
  max-width: 1200px;
  margin: 0 auto;
}

.desktopOnly {
  @media (max-width: 768px) {
    display: none;
  }
}

.mobileOnly {
  @media (min-width: 769px) {
    display: none;
  }
}
```

---

## Theming & Customization

### Dark Mode
All components support dark mode via `[data-theme="dark"]`:

```tsx
function App() {
  return (
    <div data-theme="dark">
      {/* All components automatically use dark colors */}
    </div>
  )
}
```

### Custom Colors
Override CSS variables:

```css
:root {
  --color-primary: #3b82f6;
  --color-primary-dark: #1d4ed8;
  --color-primary-light: #dbeafe;
}

[data-theme="dark"] {
  --color-primary: #60a5fa;
  --color-primary-dark: #1e40af;
}
```

### Custom Styling
Pass `className` prop to override styles:

```tsx
<Header
  title="Events"
  className="custom-header"
/>
```

---

## Accessibility Features

All components include built-in accessibility:

✅ Semantic HTML (`<nav>`, `<button>`, `<ol>`, etc.)
✅ ARIA labels and attributes
✅ Keyboard navigation (Tab, Enter, Escape)
✅ Focus indicators
✅ Disabled state communication
✅ Current page indicators
✅ Screen reader support

---

## Common Patterns

### Mobile + Desktop Navigation

```tsx
<>
  <Sidebar items={sidebarItems} className="hidden-mobile" />
  <BottomNav items={navItems} className="hidden-desktop" />
</>
```

### Multi-step Tabs with Pagination

```tsx
<Tabs
  items={[
    { id: 'tab1', label: 'Step 1', content: <Page1 /> },
    { id: 'tab2', label: 'Step 2', content: <Page2 /> },
  ]}
/>
<Pagination currentPage={1} totalPages={10} />
```

### Breadcrumb + Header

```tsx
<Header title="Create Event" icon="➕" />
<Breadcrumbs
  items={[
    { label: 'Home', path: '/' },
    { label: 'Events', path: '/events' },
    { label: 'New Event' },
  ]}
/>
```

---

## Migration from Old Components

If upgrading from previous patterns:

**Old**:
```tsx
<Navigation items={items} />
```

**New**:
```tsx
// Mobile
<BottomNav items={items} />

// Desktop
<Sidebar items={items} />
```

---

## Performance Tips

✅ Memoize navigation items:
```tsx
const navItems = useMemo(() => [...], [])
<Sidebar items={navItems} />
```

✅ Lazy load deep submenu items:
```tsx
const items = [
  {
    label: 'Events',
    submenu: /* fetch on hover */,
  },
]
```

✅ Use useCallback for handlers:
```tsx
const handlePageChange = useCallback((page) => setPage(page), [])
<Pagination onPageChange={handlePageChange} />
```

---

## Troubleshooting

**Issue**: Active nav item not highlighting
- Check: URL in `path` matches route
- Use: `useLocation()` to verify location

**Issue**: Mobile nav visible on desktop
- Add: `className="mobile-only"` with `@media` query
- Or use: Sidebar for desktop, BottomNav for mobile

**Issue**: Submenu not expanding
- Check: `submenu` array is defined
- Verify: Items have `path` or are groups

**Issue**: Tabs not switching
- Pass: `defaultTab` matching one of the item `id`s
- Check: TabItem `id` values are unique

---

## Export Reference

```tsx
import {
  BottomNav,
  Sidebar,
  Header,
  Breadcrumbs,
  Tabs,
  Pagination,
} from '@/components/navigation'

import type {
  BottomNavProps,
  NavItem,
  SidebarProps,
  SidebarNavItem,
  HeaderProps,
  BreadcrumbsProps,
  BreadcrumbItem,
  TabsProps,
  TabItem,
  PaginationProps,
} from '@/components/navigation'
```

---

## Next Steps

1. **Week 3**: Integrate into page layouts
2. **Week 4**: Add advanced animations
3. **Week 5**: Implement search/filter in navigation
4. **Week 6**: Add navigation analytics

---

## Support

Questions? Check:
- `NavigationDemo.tsx` for working examples
- `WEEK2_IMPLEMENTATION_SUMMARY.md` for detailed specs
- Component source files for implementation details
