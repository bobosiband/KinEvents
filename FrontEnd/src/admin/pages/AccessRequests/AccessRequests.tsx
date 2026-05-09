import { useState } from 'react'
import toast from 'react-hot-toast'
import { DataTable, type Column } from '@/admin/components/DataTable/DataTable'
import { useAccessRequests, useApproveAccess, useRevokeAccess } from '@/features/auth/hooks/useRequestAccess'
import { Input } from '@/components/ui/Input'
import type { AccessRequest } from '@/features/auth/types/auth.types'

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
  const [query, setQuery] = useState('')
  const pendingAll = (accessRequests.data || []).filter(request => request.status === 'pending')
  const pending = pendingAll.filter(r => {
    if (!query) return true
    const q = query.toLowerCase()
    return r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || (r.message || '').toLowerCase().includes(q)
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Access Requests</h1>
      <div className="max-w-md">
        <Input label="Search" value={query} onChange={e => setQuery(e.target.value)} fullWidth />
      </div>

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
