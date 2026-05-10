import toast from 'react-hot-toast'
import { DataTable, type Column } from '@/admin/components/DataTable/DataTable'
import { useDeleteUser, usePromoteUser, useUsers } from '@/features/users/hooks/useUsers'
import type { User, UserRole } from '@/features/users/types/user.types'

const columns: Column<User>[] = [
  { key: 'name', header: 'Name' },
  {
    key: 'email',
    header: 'Email',
    render: (row: User) => {
      const [local, domain] = row.email.split('@')
      return `${local[0]}***@${domain}`
    },
  },
  { key: 'role', header: 'Role' },
  { key: 'accessStatus', header: 'Status' },
]

export function ManageUsers() {
  const users = useUsers()
  const promote = usePromoteUser()
  const remove = useDeleteUser()

  const nextRole = (role: UserRole): UserRole => role === 'member' ? 'manager' : 'admin'

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Manage Users</h1>
      <DataTable
        columns={columns}
        data={users.data || []}
        loading={users.isLoading}
        emptyMessage="No users found."
        actions={[
          {
            label: 'Promote',
            onClick: user =>
              promote.mutate(
                { userId: user.id, role: nextRole(user.role) },
                {
                  onSuccess: () => toast.success('User promoted'),
                  onError: err => toast.error(err instanceof Error ? err.message : 'Failed to promote'),
                }
              ),
          },
          {
            label: 'Delete',
            tone: 'danger',
            onClick: user =>
              remove.mutate(user.id, {
                onSuccess: () => toast.success('User deleted'),
                onError: err => toast.error(err instanceof Error ? err.message : 'Failed to delete'),
              }),
          },
        ]}
      />
    </div>
  )
}
