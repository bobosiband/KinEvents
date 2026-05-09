import { useState, type FormEvent } from 'react'
import { format } from 'date-fns'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Divider } from '@/components/ui/Divider'
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
    <article className="space-y-4">
      <Card className="space-y-4" variant="elevated">
        <Badge tone={event.data.type === 'birthday' ? 'accent' : 'primary'} pill>{event.data.type}</Badge>
        <h1 className="text-3xl font-bold">{event.data.title}</h1>
        <div className="flex flex-wrap gap-2">
          {canEdit ? (
            <>
              <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
                Edit
              </Button>
              <Button size="sm" variant="danger" onClick={handleDelete} loading={deleteEvent.isPending}>
                Delete
              </Button>
            </>
          ) : null}
        </div>
      </Card>

      <Card className="space-y-4">
        <section className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span className="rounded-full bg-muted px-3 py-1">{format(new Date(event.data.date), 'PPP')}</span>
          <span className="rounded-full bg-muted px-3 py-1">{format(new Date(event.data.date), 'p')}</span>
          {event.data.location ? <span className="rounded-full bg-muted px-3 py-1">{event.data.location}</span> : null}
          {event.data.onlineLink ? <span className="rounded-full bg-muted px-3 py-1">{event.data.onlineLink}</span> : null}
        </section>
        <Divider />
        <p className="text-sm leading-7 text-muted-foreground">{event.data.description}</p>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-xl font-semibold">RSVP</h2>
        <div className="flex flex-wrap gap-3">
          {(['yes', 'maybe', 'no'] as RSVPStatus[]).map(status => (
            <RsvpButton key={status} value={status} active={current === status} loading={rsvp.isPending} onSelect={rsvp.mutate} />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{attendees} family members going</p>
      </Card>

      <Modal title="Edit Event" open={editing} onClose={() => setEditing(false)}>
        {event.data ? <EventForm event={event.data} loading={updateEvent.isPending} onSubmit={handleUpdate} /> : null}
      </Modal>
    </article>
  )
}
