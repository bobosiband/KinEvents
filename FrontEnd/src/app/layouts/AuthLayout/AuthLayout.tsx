import { Outlet } from 'react-router-dom'
import styles from './AuthLayout.module.css'

export function AuthLayout() {
  return (
    <main className={styles.authLayout}>
      <Outlet />
    </main>
  )
}
