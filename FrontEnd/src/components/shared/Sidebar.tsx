import { motion, AnimatePresence } from 'motion/react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Avatar } from '@/components/ui/Avatar'
import { Heart } from 'lucide-react'

export interface NavItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  path: string
  badge?: number
  adminOnly?: boolean
}

interface SidebarProps {
  items: NavItem[]
  open: boolean
  onClose: () => void
}

export function Sidebar({ items, open, onClose }: SidebarProps) {
  const location = useLocation()
  const { user } = useAuth()

  return (
    <>
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border z-40">
        <SidebarContent items={items} location={location} user={user} />
      </aside>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border z-50 lg:hidden flex flex-col"
            >
              <SidebarContent items={items} location={location} user={user} onClose={onClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function SidebarContent({ items, location, user, onClose }: {
  items: NavItem[]
  location: ReturnType<typeof useLocation>
  user: any
  onClose?: () => void
}) {
  return (
    <>
      <div className="p-6 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-primary fill-primary" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-[var(--warm-coral)] to-[var(--warm-rose)] bg-clip-text text-transparent">
            KinEvents
          </h1>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Family moments together</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path))
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 group ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <motion.div whileHover={{ x: isActive ? 0 : 2 }} transition={{ duration: 0.15 }}>
                <Icon className="w-5 h-5 flex-shrink-0" />
              </motion.div>
              <span className="font-medium text-sm">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="ml-auto min-w-[20px] h-5 px-1.5 bg-destructive text-white text-xs rounded-full flex items-center justify-center font-semibold">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {user && (
        <div className="p-4 border-t border-border flex-shrink-0">
          <div className="flex items-center gap-3 px-2">
            <Avatar name={user.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
