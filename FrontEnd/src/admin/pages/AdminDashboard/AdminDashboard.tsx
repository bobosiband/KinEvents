import { StatCard } from '@/admin/components/StatCard/StatCard'
import { Loader } from '@/components/feedback/Loader/Loader'
import { useAdminDashboard } from '@/admin/hooks/useAdmin'
import { useBirthdays } from '@/features/birthdays/hooks/useBirthdays'
import styles from './AdminDashboard.module.css'

export function AdminDashboard() {
  const { data, isLoading } = useAdminDashboard()
  const birthdays = useBirthdays(10)

  if (isLoading) return <Loader />

  const totalUsers = data?.users.total ?? 0
  const pendingRequests = data?.accessRequests.pending ?? 0
  const totalEvents = data?.events.total ?? 0
  const upcomingBirthdays = birthdays.data?.length ?? 0

  return (
    <div className={styles.page}>
      <h1>Dashboard</h1>
      <section className={styles.stats}>
        <StatCard label="Total Users" value={totalUsers} />
        <StatCard label="Pending Requests" value={pendingRequests} />
        <StatCard label="Total Events" value={totalEvents} />
        <StatCard label="Upcoming Birthdays" value={upcomingBirthdays} />
      </section>
      <section className={styles.activity}>
        <h2>Database Summary</h2>
        <div className={styles.summaryGrid}>
          <p><strong>{data?.users.approved ?? 0}</strong> approved users</p>
          <p><strong>{data?.users.admins ?? 0}</strong> admins</p>
          <p><strong>{data?.events.birthdays ?? 0}</strong> birthday events</p>
          <p><strong>{data?.events.custom ?? 0}</strong> custom events</p>
          <p><strong>{data?.accessRequests.approved ?? 0}</strong> approved requests</p>
          <p><strong>{data?.accessRequests.rejected ?? 0}</strong> rejected requests</p>
        </div>
      </section>
    </div>
  )
}
