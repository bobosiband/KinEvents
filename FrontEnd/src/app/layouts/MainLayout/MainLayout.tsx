import { Outlet } from 'react-router-dom'
import { Navbar } from '@/components/navigation/Navbar/Navbar'
import { BottomNav } from '@/components/navigation/BottomNav/BottomNav'
import styles from './MainLayout.module.css'

export function MainLayout() {
  return (
    <div className={styles.shell}>
      <Navbar />
      <main className={styles.content}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
