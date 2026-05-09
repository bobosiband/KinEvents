import { Button } from '@/components/ui/Button'
import type { RSVPStatus } from '../../types/event.types'

interface RsvpButtonProps {
  value: RSVPStatus
  active?: boolean
  loading?: boolean
  onSelect: (value: RSVPStatus) => void
}

const labels: Record<RSVPStatus, string> = {
  yes: 'Going ✓',
  maybe: 'Maybe ?',
  no: 'Not Going ✗',
}

export function RsvpButton({ value, active = false, loading = false, onSelect }: RsvpButtonProps) {
  return (
    <Button type="button" variant={active ? 'primary' : 'secondary'} loading={loading} className="min-w-[110px]" onClick={() => onSelect(value)}>
      {labels[value]}
    </Button>
  )
}
