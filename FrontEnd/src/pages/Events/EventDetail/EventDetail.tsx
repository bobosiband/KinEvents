import { useState, type FormEvent } from 'react'
import { format } from 'date-fns'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/feedback/ErrorMessage/ErrorMessage'
import { Loader } from '@/components/feedback/Loader/Loader'
import { Modal } from '@/components/ui/Modal'
import { EventForm } from '@/features/events/components/EventForm/EventForm'
import { RsvpButton } from '@/features/events/components/RsvpButton/RsvpButton'
import { useEvent } from '@/features/events/hooks/useEvents'
import { useRsvp } from '@/features/events/hooks/useRsvp'
import { useDeleteEvent, useUpdateEvent } from '@/features/events/hooks/useCreateEvent'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import type { EventPayload, RSVPStatus } from '@/features/events/types/event.types'
import styles from './EventDetail.module.css'

export function EventDetail() {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const { user } = useAuth()
  const permissions = usePermissions()
  const event = useEvent(id)
  const rsvp = useRsvp(id, user?.id || '')
  const deleteEvent = useDeleteEvent()
  const updateEvent = useUpdateEvent(id)
  const [editing, setEditing] = useState(false)

  if (event.isLoading) return <Loader />
  if (!event.data) return <ErrorMessage message="Event not found." />

  const current = user ? event.data.rsvps[user.id] : undefined
  const attendees = Object.values(event.data.rsvps ?? {}).filter(status => status === 'yes').length
  const canEdit = permissions.canEditAnyEvent || permissions.canEditOwnEvent(event.data.createdBy)

  const handleDelete = () => {
    if (!window.confirm('Are you sure you want to delete this event?')) return
    deleteEvent.mutate(id, {
      onSuccess: () => {
        toast.success('Event deleted')
        navigate('/events')
      },
      onError: err => toast.error(err instanceof Error ? err.message : 'Failed to delete event'),
    })
  }

  const handleUpdate = (payload: EventPayload) => {
    updateEvent.mutate(payload, {
      onSuccess: () => {
        toast.success('Event updated')
        setEditing(false)
      },
      onError: err => toast.error(err instanceof Error ? err.message : 'Failed to update event'),
    })
  }

  return (
    <article className={styles.page}>
      <header className={styles.hero}>
        <Badge tone={event.data.type === 'birthday' ? 'accent' : 'primary'}>{event.data.type}</Badge>
        <h1>{event.data.title}</h1>
        {canEdit ? (
          <div>
            <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button size="sm" variant="danger" onClick={handleDelete} loading={deleteEvent.isPending}>
              Delete
            </Button>
          </div>
        ) : null}
      </header>
      <section className={styles.chips}>
        <span>{format(new Date(event.data.date), 'PPP')}</span>
        <span>{format(new Date(event.data.date), 'p')}</span>
        {event.data.location ? <span>{event.data.location}</span> : null}
      </section>
      <p className={styles.description}>{event.data.description}</p>
      <section className={styles.rsvp}>
        <h2>RSVP</h2>
        <div>
          {(['yes', 'maybe', 'no'] as RSVPStatus[]).map(status => (
            <RsvpButton key={status} value={status} active={current === status} loading={rsvp.isPending} onSelect={rsvp.mutate} />
          ))}
        </div>
        <p>{attendees} family members going</p>
      </section>

      <Modal title="Edit Event" open={editing} onClose={() => setEditing(false)}>
        {event.data ? <EventForm event={event.data} loading={updateEvent.isPending} onSubmit={handleUpdate} /> : null}
      </Modal>
    </article>
  )
}
