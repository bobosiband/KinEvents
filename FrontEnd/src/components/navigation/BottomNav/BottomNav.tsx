import { NavLink } from 'react-router-dom'
import styles from './BottomNav.module.css'

const items = [
  { to: '/', label: 'Home', icon: '⌂' },
  { to: '/events', label: 'Events', icon: '□' },
  { to: '/users', label: 'Family', icon: '👥' },
  { to: '/birthdays', label: 'Birthdays', icon: '☆' },
  { to: '/profile', label: 'Profile', icon: '○' },
] as const

export function BottomNav() {
  return (
    <nav className={styles.bottomNav} aria-label="Primary navigation">
      {items.map(item => (
        <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}>
          <span aria-hidden="true">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
