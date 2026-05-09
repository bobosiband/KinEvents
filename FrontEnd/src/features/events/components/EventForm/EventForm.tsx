import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import type { Event, EventPayload, EventType } from '../../types/event.types'

interface EventFormProps {
  event?: Event
  loading?: boolean
  onSubmit: (payload: EventPayload) => void
}

export function EventForm({ event, loading = false, onSubmit }: EventFormProps) {
  const [title, setTitle] = useState(event?.title || '')
  const [description, setDescription] = useState(event?.description || '')
  const [date, setDate] = useState(event?.date.slice(0, 16) || '')
  const [location, setLocation] = useState(event?.location || '')
  const [onlineLink, setOnlineLink] = useState(event?.onlineLink || '')
  const [imageUrl, setImageUrl] = useState(event?.imageUrl || '')
  const [type, setType] = useState<EventType>(event?.type || 'custom')
  const [error, setError] = useState('')

  const submit = (submitEvent: FormEvent) => {
    submitEvent.preventDefault()
    if (!title.trim() || !description.trim() || !date) {
      setError('Title, description, and date are required.')
      return
    }
    setError('')
    onSubmit({
      title,
      description,
      date: new Date(date).toISOString(),
      location,
      onlineLink,
      imageUrl,
      type,
    })
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <Input label="Title" value={title} onChange={eventChange => setTitle(eventChange.target.value)} fullWidth />
      <Textarea label="Description" value={description} onChange={eventChange => setDescription(eventChange.target.value)} rows={5} fullWidth />
      <Input label="Date and time" type="datetime-local" value={date} onChange={eventChange => setDate(eventChange.target.value)} fullWidth />
      <Input label="Location" value={location} onChange={eventChange => setLocation(eventChange.target.value)} fullWidth />
      <Input label="Online link" value={onlineLink} onChange={eventChange => setOnlineLink(eventChange.target.value)} hint="Optional video or event link" fullWidth />
      <Input label="Cover image URL" value={imageUrl} onChange={eventChange => setImageUrl(eventChange.target.value)} hint="Optional image URL for the event" fullWidth />
      <Select
        label="Type"
        value={type}
        onChange={eventChange => setType(eventChange.target.value as EventType)}
        options={[
          { label: 'Custom', value: 'custom' },
          { label: 'Birthday', value: 'birthday' },
        ]}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" loading={loading} fullWidth>{event ? 'Save Event' : 'Create Event'}</Button>
    </form>
  )
}
