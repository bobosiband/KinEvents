import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EventForm } from '@/features/events/components/EventForm/EventForm'
import { useCreateEvent } from '@/features/events/hooks/useCreateEvent'
import type { EventPayload } from '@/features/events/types/event.types'
import { useAuth } from '@/hooks/useAuth'

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
    <div className="space-y-4">
      <Card className="space-y-4" variant="elevated">
        <Badge tone="gold" pill>Create event</Badge>
        <h1 className="text-3xl font-bold">Create a new family moment</h1>
        <p className="text-sm text-muted-foreground">Use the shared form to add dates, links, and images without leaving the flow.</p>
      </Card>
      <Card>
        <EventForm loading={mutation.isPending} onSubmit={submit} />
      </Card>
    </div>
  )
}
