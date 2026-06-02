import { useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronUp, Gift, Lock, Plus, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import type { User } from '@/features/auth/types/auth.types'
import { useClosePool, useConfirmReceived, useCreatePool, useGiftPool, useApproveContribution, useRejectContribution } from '../hooks/useGifts'
import { ContributeForm } from './ContributeForm'

const GIFT_CURRENCY = 'AUD'

interface GiftPoolWidgetProps {
  eventId: string
  birthdayUserId: string
  currentUser: User
  allUsers: User[]
  isAdmin: boolean
}

export function GiftPoolWidget({
  eventId,
  birthdayUserId,
  currentUser,
  allUsers,
  isAdmin,
}: GiftPoolWidgetProps) {
  const { data: poolStatus, isLoading } = useGiftPool(eventId)
  const createPool = useCreatePool()
  const closePool = useClosePool(eventId)
  const confirmReceived = useConfirmReceived(eventId)
  const approve = useApproveContribution(eventId)
  const reject = useRejectContribution(eventId)
  const [contributing, setContributing] = useState(false)
  const [showNonContributors, setShowNonContributors] = useState(false)
  const [confirmingReceipt, setConfirmingReceipt] = useState(false)
  const [giftDescription, setGiftDescription] = useState('')

  if (isLoading) return null

  if (!poolStatus?.pool) {
    if (!isAdmin) return null

    return (
      <Card className="space-y-3">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Gift Pool</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          No gift pool yet. Create one so family members can record their contributions.
        </p>
        <Button
          type="button"
          loading={createPool.isPending}
          onClick={() =>
            createPool.mutate(
              { eventId, birthdayUserId, currency: 'AUD' },
              {
                onSuccess: () => toast.success('Gift pool created'),
                onError: err => toast.error(err instanceof Error ? err.message : 'Failed to create pool'),
              },
            )
          }
          icon={<Plus className="h-4 w-4" />}
        >
          Create Gift Pool
        </Button>
      </Card>
    )
  }

  const { pool, contributions, totalRaised, contributorIds, nonContributors } = poolStatus
  const hasContributed = contributorIds.includes(currentUser.id)
  const isBirthdayPerson = currentUser.id === birthdayUserId
  const isConfirmed = Boolean(pool.receivedAt)
  const progressPct = pool.targetAmount ? Math.min(100, Math.round((totalRaised / pool.targetAmount) * 100)) : null
  const usersById = new Map(allUsers.map(user => [user.id, user]))
  const usersForContribute = allUsers.filter(
    user => birthdayUserId ? user.id !== birthdayUserId : true
  )

  const handleConfirmReceipt = () => {
    confirmReceived.mutate(
      {
        poolId: pool.id,
        payload: { giftDescription: giftDescription.trim() || undefined },
      },
      {
        onSuccess: () => {
          toast.success('Gift receipt confirmed!')
          setConfirmingReceipt(false)
          setGiftDescription('')
        },
        onError: err => toast.error(err instanceof Error ? err.message : 'Failed to confirm receipt'),
      },
    )
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Gift className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Gift Pool</h2>
          <Badge tone={isConfirmed ? 'success' : pool.status === 'open' ? 'primary' : 'neutral'} pill>
            {isConfirmed ? '✓ Received' : pool.status}
          </Badge>
        </div>

        {isAdmin && !isConfirmed ? (
          <div className="flex gap-2 flex-wrap">
            {pool.status === 'open' ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={closePool.isPending}
                onClick={() =>
                  closePool.mutate(pool.id, {
                    onSuccess: () => toast.success('Pool closed'),
                    onError: err => toast.error(err instanceof Error ? err.message : 'Failed to close pool'),
                  })
                }
                icon={<Lock className="h-3.5 w-3.5" />}
              >
                Close Pool
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setConfirmingReceipt(true)}
              icon={<CheckCircle2 className="h-3.5 w-3.5" />}
            >
              Confirm Received
            </Button>
          </div>
        ) : null}
      </div>

      {isConfirmed ? (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 space-y-1">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-semibold">Gift received!</span>
          </div>
          {pool.giftDescription ? <p className="text-sm text-muted-foreground pl-6">{pool.giftDescription}</p> : null}
          <p className="text-xs text-muted-foreground pl-6">
            Confirmed{' '}
            {new Date(pool.receivedAt!).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-muted p-3 text-center">
          <p className="text-lg font-bold">
            {GIFT_CURRENCY} {totalRaised.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">Raised</p>
        </div>
        <div className="rounded-xl bg-muted p-3 text-center">
          <p className="text-lg font-bold">{contributorIds.length}</p>
          <p className="text-xs text-muted-foreground">Contributed</p>
        </div>
        <div className="rounded-xl bg-muted p-3 text-center">
          <p className={`text-lg font-bold ${nonContributors.length > 0 && !isConfirmed ? 'text-amber-600' : ''}`}>
            {nonContributors.length}
          </p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
      </div>

      {progressPct !== null ? (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Fundraising goal</span>
            <span>
              {GIFT_CURRENCY} {pool.targetAmount?.toFixed(2)}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="text-xs text-right text-muted-foreground">{progressPct}% of goal</p>
        </div>
      ) : null}

      {contributions.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Contributions</h3>
          {contributions.map(contribution => {
            const payer = usersById.get(contribution.paidBy)
            const coveredOthers = contribution.onBehalfOf
              .filter(userId => userId !== contribution.paidBy)
              .map(userId => usersById.get(userId)?.name ?? 'Unknown')
            return (
              <div key={contribution.id} className="rounded-xl bg-muted p-3 text-sm space-y-1">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{payer?.name ?? 'Unknown'}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-primary">{GIFT_CURRENCY} {contribution.amount.toFixed(2)}</span>
                    {contribution.status === 'PENDING_VERIFICATION' ? (
                      <Badge tone="secondary" pill>Pending Verification</Badge>
                    ) : contribution.status === 'CONFIRMED' ? (
                      <Badge tone="success" pill>Confirmed</Badge>
                    ) : contribution.status === 'REJECTED' ? (
                      <Badge tone="danger" pill>Rejected</Badge>
                    ) : null}
                  </div>
                </div>
                {coveredOthers.length > 0 ? (
                  <p className="text-xs text-muted-foreground">Also covering: {coveredOthers.join(', ')}</p>
                ) : null}
                {contribution.reference ? <p className="text-xs text-muted-foreground">Ref: {contribution.reference}</p> : null}
                {contribution.note ? <p className="text-xs text-muted-foreground italic">{contribution.note}</p> : null}
                {isAdmin && contribution.status === 'PENDING_VERIFICATION' ? (
                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={() => approve.mutate({ poolId: pool.id, contributionId: contribution.id })}>
                      Approve
                    </Button>
                    <Button type="button" size="sm" variant="secondary" onClick={() => {
                      const reason = prompt('Rejection reason (optional)') || undefined
                      reject.mutate({ poolId: pool.id, contributionId: contribution.id, reason })
                    }}>
                      Reject
                    </Button>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : null}

      {isAdmin && nonContributors.length > 0 && !isConfirmed ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowNonContributors(value => !value)}
            className="flex w-full items-center justify-between rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2.5 text-sm font-medium text-amber-700"
          >
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {nonContributors.length} haven't contributed yet
            </span>
            {showNonContributors ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showNonContributors ? (
            <ul className="space-y-1 px-2">
              {nonContributors.map(user => (
                <li key={user.id} className="flex items-center justify-between py-1 text-sm text-muted-foreground">
                  <span>• {user.name}</span>
                  {user.phone ? <span className="text-xs font-mono">{user.phone}</span> : <span className="text-xs text-muted-foreground/60">no phone</span>}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {pool.status === 'open' && !isBirthdayPerson && !isConfirmed ? (
        <div className="space-y-2">
          <Button
            type="button"
            variant={hasContributed ? 'secondary' : 'primary'}
            onClick={() => setContributing(true)}
            icon={<Gift className="h-4 w-4" />}
            fullWidth
          >
            {hasContributed ? 'Add Another Contribution' : 'Record My Contribution'}
          </Button>
          {hasContributed ? (
            <p className="text-xs text-center text-emerald-600">✓ You are marked as contributed</p>
          ) : null}
        </div>
      ) : null}

      {isBirthdayPerson && pool.status === 'open' && !isConfirmed ? (
        <p className="text-xs text-center text-muted-foreground">
          This is your gift pool 🎂 — family members are contributing for you!
        </p>
      ) : null}

      <Modal title="Record Gift Contribution" open={contributing} onClose={() => setContributing(false)}>
        <ContributeForm
          pool={pool}
          currentUser={currentUser}
          allUsers={usersForContribute}
          eventId={eventId}
          onSuccess={() => {
            setContributing(false)
            toast.success('Contribution recorded!')
          }}
        />
      </Modal>

      <Modal
        title="Confirm Gift Received"
        open={confirmingReceipt}
        onClose={() => {
          setConfirmingReceipt(false)
          setGiftDescription('')
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Confirm that the birthday person has received their gift. This will also close the pool. Total raised:{' '}
            <strong>
              {pool.currency} {totalRaised.toFixed(2)}
            </strong>
          </p>
          <Input
            label="Gift description (optional)"
            value={giftDescription}
            onChange={event => setGiftDescription(event.target.value)}
            hint='e.g. "Amazon voucher + birthday card"'
            fullWidth
          />
          <div className="flex gap-3">
            <Button
              type="button"
              loading={confirmReceived.isPending}
              onClick={handleConfirmReceipt}
              icon={<CheckCircle2 className="h-4 w-4" />}
            >
              Confirm Received
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setConfirmingReceipt(false)
                setGiftDescription('')
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  )
}
