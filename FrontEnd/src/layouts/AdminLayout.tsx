import { useState } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { LayoutDashboard, Users, Calendar, UserCheck, Settings, Bell, Shield, Menu, Cake } from 'lucide-react'
import { Sidebar } from '@/components/shared/Sidebar'
import { useAdminDashboard } from '@/admin/hooks/useAdmin'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/hooks/useAuth'

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data } = useAdminDashboard()
  const { user } = useAuth()
  const pendingCount = data?.accessRequests.pending ?? 0

  const ADMIN_NAV_ITEMS = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Calendar, label: 'Events', path: '/admin/events' },
    { icon: Cake, label: 'Birthdays', path: '/birthdays' },
    { icon: Users, label: 'Family Members', path: '/family' },
    { icon: UserCheck, label: 'Access Requests', path: '/admin/access-requests', badge: pendingCount },
    { icon: Users, label: 'User Management', path: '/admin/users' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        items={ADMIN_NAV_ITEMS}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-64 min-h-screen flex flex-col">
        <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border px-4 lg:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-sm font-semibold">Admin Panel</span>
                {pendingCount > 0 && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 bg-destructive/10 text-destructive rounded-full font-medium">
                    {pendingCount} pending
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/home" className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors">
              ← User view
            </Link>
            <Link to="/profile">
              <Avatar name={user?.name} size="sm" />
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
