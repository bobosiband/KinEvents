import toast from 'react-hot-toast'
import { DataTable, type Column } from '@/admin/components/DataTable/DataTable'
import { useAccessRequests, useApproveAccess, useRevokeAccess } from '@/features/auth/hooks/useRequestAccess'
import type { AccessRequest } from '@/features/auth/types/auth.types'
import styles from './AccessRequests.module.css'

const columns: Column<AccessRequest>[] = [
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
  { key: 'message', header: 'Message', render: row => row.message || '' },
  { key: 'requestedAt', header: 'Requested At', render: row => new Date(row.requestedAt).toLocaleDateString() },
]

export function AccessRequests() {
  const accessRequests = useAccessRequests()
  const approve = useApproveAccess()
  const reject = useRevokeAccess()
  const pending = (accessRequests.data || []).filter(request => request.status === 'pending')

  return (
    <div className={styles.page}>
      <h1>Access Requests</h1>
      <DataTable
        columns={columns}
        data={pending}
        loading={accessRequests.isLoading}
        emptyMessage="No pending requests."
        actions={[
          {
            label: 'Approve',
            onClick: request =>
              approve.mutate(request.id, {
                onSuccess: () => toast.success('Access approved'),
                onError: err => toast.error(err instanceof Error ? err.message : 'Failed to approve'),
              }),
          },
          {
            label: 'Reject',
            tone: 'danger',
            onClick: request =>
              reject.mutate(request.id, {
                onSuccess: () => toast.success('Access rejected'),
                onError: err => toast.error(err instanceof Error ? err.message : 'Failed to reject'),
              }),
          },
        ]}
      />
    </div>
  )
}
