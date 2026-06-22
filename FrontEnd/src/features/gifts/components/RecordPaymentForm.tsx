import { useState } from 'react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useRecordContribution } from '../hooks/useGifts'
import type { GiftPool } from '../types/gift.types'
import type { User } from '@/features/auth/types/auth.types'

const GIFT_CURRENCY = 'AUD'

interface RecordPaymentFormProps {
  pool: GiftPool
  allUsers: User[]
  birthdayUserId: string
  eventId: string
  onSuccess: () => void
}

export function RecordPaymentForm({ pool, allUsers, birthdayUserId, eventId, onSuccess }: RecordPaymentFormProps) {
  const recordContribution = useRecordContribution(pool.id, eventId)
  const [paidBy, setPaidBy] = useState('')
  const [amount, setAmount] = useState('')
  const [selectedOnBehalf, setSelectedOnBehalf] = useState<string[]>([])
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const eligiblePayers = allUsers.filter(user => user.id !== birthdayUserId)
  const othersForOnBehalf = eligiblePayers.filter(user => user.id !== paidBy)

  const toggleOnBehalf = (userId: string) => {
    setSelectedOnBehalf(current =>
      current.includes(userId) ? current.filter(id => id !== userId) : [...current, userId],
    )
  }

  const amountNumber = Number(amount)

  const submit = () => {
    if (!paidBy) {
      setError('Please select who made the payment')
      return
    }
    if (!amount || Number.isNaN(amountNumber) || amountNumber <= 0) {
      setError('Please enter a valid amount greater than zero')
      return
    }

    setError('')
    recordContribution.mutate(
      {
        paidBy,
        onBehalfOf: selectedOnBehalf,
        amount: amountNumber,
        paymentMethod: paymentMethod as 'bank_transfer' | 'cash' | 'paypal' | 'other',
        reference: reference.trim() || undefined,
        note: note.trim() || undefined,
      },
      {
        onSuccess,
        onError: err => toast.error(err instanceof Error ? err.message : 'Failed to record payment'),
      },
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Use this when a family member sent you proof of payment. It is confirmed straight away and counts toward the total.
      </p>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Who paid? *</label>
        <select
          value={paidBy}
          onChange={event => {
            setPaidBy(event.target.value)
            setSelectedOnBehalf(current => current.filter(id => id !== event.target.value))
          }}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Select a family member…</option>
          {eligiblePayers.map(user => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      <Input
        label={`Amount (${GIFT_CURRENCY}) *`}
        type="number"
        min="0.01"
        step="0.01"
        value={amount}
        onChange={event => setAmount(event.target.value)}
        fullWidth
      />

      {othersForOnBehalf.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Also covering (optional)</p>
          <p className="text-xs text-muted-foreground">Select family members whose share this payment covers.</p>
          <div className="grid gap-2 max-h-48 overflow-y-auto pr-1">
            {othersForOnBehalf.map(user => (
              <label
                key={user.id}
                className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 cursor-pointer hover:bg-muted transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedOnBehalf.includes(user.id)}
                  onChange={() => toggleOnBehalf(user.id)}
                  className="h-4 w-4 rounded"
                />
                <span className="text-sm">{user.name}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-medium">Payment method</p>
        <div className="grid grid-cols-2 gap-2">
          {(['bank_transfer', 'cash', 'paypal', 'other'] as const).map(method => (
            <button
              key={method}
              type="button"
              onClick={() => setPaymentMethod(method)}
              className={`rounded-xl border px-3 py-2.5 text-sm font-medium capitalize transition ${
                paymentMethod === method
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {method.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <Input
        label="Proof reference (optional)"
        value={reference}
        onChange={event => setReference(event.target.value)}
        hint="Screenshot filename, bank ref, or transaction ID"
        fullWidth
      />

      <Textarea
        label="Note (optional)"
        value={note}
        onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setNote(event.target.value)}
        hint="Any additional context for this payment"
        fullWidth
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="button" loading={recordContribution.isPending} onClick={submit} fullWidth>
        Record Payment
      </Button>
    </div>
  )
}
