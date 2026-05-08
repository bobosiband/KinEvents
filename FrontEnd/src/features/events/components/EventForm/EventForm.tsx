import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Event, EventPayload, EventType } from '../../types/event.types'
import styles from './EventForm.module.css'

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
  const [type, setType] = useState<EventType>(event?.type || 'custom')
  const [error, setError] = useState('')

  const submit = (submitEvent: FormEvent) => {
    submitEvent.preventDefault()
    if (!title.trim() || !description.trim() || !date) {
      setError('Title, description, and date are required.')
      return
    }
    setError('')
    onSubmit({ title, description, date: new Date(date).toISOString(), location, type })
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <Input label="Title" value={title} onChange={eventChange => setTitle(eventChange.target.value)} fullWidth />
      <label className={styles.label}>
        <span>Description</span>
        <textarea value={description} onChange={eventChange => setDescription(eventChange.target.value)} />
      </label>
      <Input label="Date and time" type="datetime-local" value={date} onChange={eventChange => setDate(eventChange.target.value)} fullWidth />
      <Input label="Location" value={location} onChange={eventChange => setLocation(eventChange.target.value)} fullWidth />
      <label className={styles.label}>
        <span>Type</span>
        <select value={type} onChange={eventChange => setType(eventChange.target.value as EventType)}>
          <option value="custom">Custom</option>
          <option value="birthday">Birthday</option>
        </select>
      </label>
      {error ? <p className={styles.error}>{error}</p> : null}
      <Button type="submit" loading={loading} fullWidth>{event ? 'Save Event' : 'Create Event'}</Button>
    </form>
  )
}
