import { motion } from 'motion/react'
import { Calendar, MapPin, Users } from 'lucide-react'
import type { Event, RSVPStatus } from '@/features/events/types/event.types'

interface EventCardProps {
  event: Event
  currentUserId?: string
  onClick?: () => void
  compact?: boolean
}

export function EventCard({ event, currentUserId, onClick }: EventCardProps) {
  const going = Object.values(event.rsvps ?? {}).filter(s => s === 'yes').length
  const myRsvp: RSVPStatus | undefined = currentUserId ? event.rsvps[currentUserId] : undefined
  const coverColors: Record<string, string> = {
    birthday: 'var(--warm-rose)',
    custom: 'var(--warm-mint)',
  }
  const color = coverColors[event.type] ?? 'var(--warm-sky)'

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-card rounded-2xl shadow-md overflow-hidden cursor-pointer"
    >
      <div className="h-2 w-full" style={{ background: `linear-gradient(to right, ${color}, ${color}88)` }} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-semibold text-base leading-tight">{event.title}</h3>
          {myRsvp && (
            <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
              myRsvp === 'yes' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : myRsvp === 'maybe' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              : 'bg-muted text-muted-foreground'
            }`}>
              {myRsvp === 'yes' ? '✓ Going' : myRsvp === 'maybe' ? '? Maybe' : "✗ Can't go"}
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4 flex-shrink-0" />
            <span>{going} {going === 1 ? 'person' : 'people'} going</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
