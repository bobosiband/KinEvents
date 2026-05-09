import { StatCard } from '@/admin/components/StatCard/StatCard'
import { Loader } from '@/components/feedback/Loader/Loader'
import { useAdminDashboard } from '@/admin/hooks/useAdmin'
import { useBirthdays } from '@/features/birthdays/hooks/useBirthdays'

export function AdminDashboard() {
  const { data, isLoading } = useAdminDashboard()
  const birthdays = useBirthdays(10)

  if (isLoading) return <Loader />

  const totalUsers = data?.users.total ?? 0
  const pendingRequests = data?.accessRequests.pending ?? 0
  const totalEvents = data?.events.total ?? 0
  const upcomingBirthdays = birthdays.data?.length ?? 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={totalUsers} />
        <StatCard label="Pending Requests" value={pendingRequests} />
        <StatCard label="Total Events" value={totalEvents} />
        <StatCard label="Upcoming Birthdays" value={upcomingBirthdays} />
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Database Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
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
