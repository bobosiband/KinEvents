import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { listPendingContributions, approveContribution, rejectContribution } from '@/features/gifts/api/gifts.api'
import { useApproveContribution, useRejectContribution } from '@/features/gifts/hooks/useGifts'
import { Button } from '@/components/ui/Button'

export function PendingContributions() {
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'pending-contributions'], queryFn: () => listPendingContributions('') })
  const approve = useApproveContribution('')
  const reject = useRejectContribution('')

  if (isLoading) return <div>Loading...</div>

  const items = data ?? []

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Pending Contributions</h2>
      {items.length === 0 ? (
        <div>No pending contributions</div>
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <div key={c.id} className="p-3 border rounded">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{c.paidBy}</div>
                  <div className="text-sm text-muted">Amount: {c.amount}</div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => approve.mutate({ poolId: c.poolId, contributionId: c.id })}>Approve</Button>
                  <Button variant="secondary" onClick={() => {
                    const reason = prompt('Rejection reason (optional)') || undefined
                    reject.mutate({ poolId: c.poolId, contributionId: c.id, reason })
                  }}>Reject</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
