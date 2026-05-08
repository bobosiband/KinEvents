import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import styles from './AdminHeader.module.css'

interface AdminHeaderProps {
  onMenu: () => void
}

export function AdminHeader({ onMenu }: AdminHeaderProps) {
  const navigate = useNavigate()
  const { user, clearAuth } = useAuth()

  const logout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <header className={styles.header}>
      <Button type="button" variant="ghost" size="sm" onClick={onMenu} aria-label="Toggle admin menu">☰</Button>
      <div>
        <strong>Admin</strong>
        <span>{user?.name}</span>
      </div>
      <div className={styles.actions}>
        <Button type="button" variant="ghost" size="sm" onClick={logout}>Logout</Button>
      </div>
    </header>
  )
}
