import { useState } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { Home, Calendar, Cake, Users, MessageCircle, Bell as BellIcon, Shield, User } from 'lucide-react'
import { Sidebar } from '@/components/shared/Sidebar'
import { BottomNav } from '@/components/shared/BottomNav'
import { TopBar } from '@/components/shared/TopBar'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'

const USER_NAV_ITEMS = [
  { icon: Home, label: 'Home', path: '/home' },
  { icon: Calendar, label: 'Events', path: '/events' },
  { icon: Cake, label: 'Birthdays', path: '/birthdays' },
  { icon: Users, label: 'Family', path: '/family' },
  { icon: MessageCircle, label: 'Messages', path: '/messages' },
  { icon: BellIcon, label: 'Notifications', path: '/notifications' },
  { icon: User, label: 'Profile', path: '/profile' },
]

const USER_BOTTOM_NAV = [
  { icon: Home, label: 'Home', path: '/home' },
  { icon: Calendar, label: 'Events', path: '/events' },
  { icon: Cake, label: 'Birthdays', path: '/birthdays' },
  { icon: BellIcon, label: 'Alerts', path: '/notifications' },
  { icon: User, label: 'Profile', path: '/profile' },
]

export function UserLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()
  const permissions = usePermissions()
  const { data: notifications = [] } = useNotifications()
  const unreadCount = notifications.filter(n => !n.isRead).length

  const adminNavItem = permissions.canAccessAdmin
    ? [{ icon: Shield, label: 'Admin', path: '/admin', adminOnly: true }]
    : []

  const navItemsWithBadge = [
    ...USER_NAV_ITEMS.map(item =>
      item.path === '/notifications' ? { ...item, badge: unreadCount } : item,
    ),
    ...adminNavItem,
  ]
  const bottomNavWithBadge = USER_BOTTOM_NAV.map(item =>
    item.path === '/notifications' ? { ...item, badge: unreadCount } : item
  )

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        items={navItemsWithBadge}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-64 min-h-screen flex flex-col">
        <TopBar
          onOpenMenu={() => setSidebarOpen(true)}
          userName={user?.name}
          isAdmin={user?.role === 'admin'}
        />

        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 max-w-4xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      <BottomNav items={bottomNavWithBadge} />
      <Link to="/notifications" className="srOnly">Notifications</Link>
    </div>
  )
}
