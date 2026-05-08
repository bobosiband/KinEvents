import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Input } from '@/components/ui/Input'
import { EventCard } from '@/features/events/components/EventCard/EventCard'
import { useEvents } from '@/features/events/hooks/useEvents'
import { usePermissions } from '@/hooks/usePermissions'
import type { EventType } from '@/features/events/types/event.types'
import styles from './Events.module.css'

type Filter = 'all' | EventType

export function Events() {
  const navigate = useNavigate()
  const permissions = usePermissions()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const { data = [], isLoading } = useEvents({ search, type: filter === 'all' ? undefined : filter })

  return (
    <div className={styles.page}>
      <Input label="Search events" value={search} onChange={event => setSearch(event.target.value)} fullWidth />
      <div className={styles.tabs}>
        {(['all', 'birthday', 'custom'] as Filter[]).map(item => (
          <button key={item} type="button" className={filter === item ? styles.active : ''} onClick={() => setFilter(item)}>{item}</button>
        ))}
      </div>
      <div className={styles.list}>
        {data.map(event => <EventCard key={event.id} event={event} onClick={() => navigate(`/events/${event.id}`)} />)}
      </div>
      {!isLoading && data.length === 0 ? <EmptyState title="No matching events" message="Try another search or filter." /> : null}
      {permissions.canCreateEvent ? <Button className={styles.fab} onClick={() => navigate('/events/create')}>+ New</Button> : null}
    </div>
  )
}
