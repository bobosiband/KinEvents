import { NavLink, useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import styles from './AdminSidebar.module.css'

const links = [
  { to: '/admin', label: 'Dashboard', icon: '⌂' },
  { to: '/admin/users', label: 'Users', icon: '◇' },
  { to: '/admin/events', label: 'Events', icon: '□' },
  { to: '/admin/access-requests', label: 'Access Requests', icon: '!' },
  { to: '/admin/settings', label: 'Settings', icon: '⚙' },
] as const

interface AdminSidebarProps {
  open: boolean
  onClose: () => void
  pendingCount?: number
}

export function AdminSidebar({ open, onClose, pendingCount = 0 }: AdminSidebarProps) {
  const navigate = useNavigate()
  const { user, clearAuth } = useAuth()

  const logout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <>
      <aside className={`${styles.sidebar} ${open ? styles.open : ''}`}>
        <div className={styles.brand}>KinEvents</div>
        <nav className={styles.nav} aria-label="Admin navigation">
          {links.map(link => (
            <NavLink key={link.to} to={link.to} end={link.to === '/admin'} onClick={onClose} className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
              <span>{link.icon}</span>
              <span>{link.label}</span>
              {link.to.endsWith('access-requests') && pendingCount > 0 ? <b>{pendingCount}</b> : null}
            </NavLink>
          ))}
        </nav>
        {user ? (
          <div className={styles.user}>
            <Avatar name={user.name} size="sm" />
            <span>{user.name}</span>
            <Button type="button" variant="ghost" size="sm" onClick={logout}>Logout</Button>
          </div>
        ) : null}
      </aside>
      {open ? <button className={styles.overlay} type="button" aria-label="Close menu" onClick={onClose} /> : null}
    </>
  )
}
