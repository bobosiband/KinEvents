import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import { EventForm } from '@/features/events/components/EventForm/EventForm'
import { useCreateEvent } from '@/features/events/hooks/useCreateEvent'
import type { EventPayload } from '@/features/events/types/event.types'
import { useAuth } from '@/hooks/useAuth'
import styles from './CreateEvent.module.css'

export function CreateEvent() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const mutation = useCreateEvent()

  const submit = (payload: EventPayload) => {
    if (!user) return
    mutation.mutate({ ...payload, createdBy: user.id }, {
      onSuccess: event => {
        toast.success('Event created')
        navigate(`/events/${event.id}`)
      },
      onError: err => {
        toast.error(err instanceof Error ? err.message : 'Failed to create event')
      },
    })
  }

  return (
    <div className={styles.page}>
      <h1>Create Event</h1>
      <Card>
        <EventForm loading={mutation.isPending} onSubmit={submit} />
      </Card>
    </div>
  )
}
