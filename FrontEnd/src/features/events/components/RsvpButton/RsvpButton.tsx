import { Button } from '@/components/ui/Button'
import type { RSVPStatus } from '../../types/event.types'
import styles from './RsvpButton.module.css'

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
    <Button type="button" variant={active ? 'primary' : 'secondary'} loading={loading} className={styles.button} onClick={() => onSelect(value)}>
      {labels[value]}
    </Button>
  )
}
