import { Link, useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import styles from './Navbar.module.css'

export function Navbar() {
  const navigate = useNavigate()
  const { user, clearAuth } = useAuth()

  const logout = () => {
    clearAuth()
    navigate('/login')
  }
  const { theme, toggleTheme } = useTheme()

  return (
    <header className={styles.navbar}>
      <Link to="/" className={styles.brand}>KinEvents</Link>
      {user ? (
        <div className={styles.userActions}>
          <Button type="button" variant="ghost" size="sm" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark' ? '☀' : '🌙'}
          </Button>
          <Link to="/profile" aria-label="Profile"><Avatar name={user.name} size="sm" /></Link>
          <Button type="button" variant="ghost" size="sm" onClick={logout}>Logout</Button>
        </div>
      ) : null}
    </header>
  )
}
