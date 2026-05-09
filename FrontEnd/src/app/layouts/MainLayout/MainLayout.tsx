import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AdminHeader } from '@/admin/components/AdminHeader/AdminHeader'
import { AdminSidebar } from '@/admin/components/AdminSidebar/AdminSidebar'
import { useAdminDashboard } from '@/admin/hooks/useAdmin'
import styles from './MainLayout.module.css'

export function MainLayout() {
  const [open, setOpen] = useState(false)
  const { data } = useAdminDashboard()

  return (
    <div className={styles.adminShell}>
      <AdminSidebar open={open} onClose={() => setOpen(false)} pendingCount={data?.accessRequests.pending ?? 0} />
      <div className={styles.panel}>
        <AdminHeader onMenu={() => setOpen(current => !current)} />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
