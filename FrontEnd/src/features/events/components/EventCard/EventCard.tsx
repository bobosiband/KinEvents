import { format } from 'date-fns'
import { Badge } from '@/components/ui/Badge'
import type { Event } from '../../types/event.types'
import styles from './EventCard.module.css'

interface EventCardProps {
  event: Event
  onClick?: () => void
  compact?: boolean
}

export function EventCard({ event, onClick, compact = false }: EventCardProps) {
  const going = Object.values(event.rsvps ?? {}).filter(status => status === 'yes').length
  return (
    <button type="button" className={`${styles.card} ${styles[event.type]} ${compact ? styles.compact : ''}`} onClick={onClick}>
      <div>
        <Badge tone={event.type === 'birthday' ? 'accent' : 'primary'}>{event.type}</Badge>
        <h3>{event.title}</h3>
        <p>{format(new Date(event.date), 'EEE, MMM d • p')}</p>
        {event.location ? <span>{event.location}</span> : null}
      </div>
      <strong>{going} going</strong>
    </button>
  )
}
