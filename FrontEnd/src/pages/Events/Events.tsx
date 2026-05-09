import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Loader } from '@/components/feedback/Loader/Loader'
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
      <Card className={styles.hero} variant="elevated">
        <Badge tone="accent" pill>Events</Badge>
        <h1>Browse family plans</h1>
        <p>Search, filter, and jump into any event detail without losing context.</p>
        <Input label="Search events" value={search} onChange={event => setSearch(event.target.value)} fullWidth />
        <div className={styles.tabs}>
          {(['all', 'birthday', 'custom'] as Filter[]).map(item => (
            <button key={item} type="button" className={filter === item ? styles.active : ''} onClick={() => setFilter(item)}>{item}</button>
          ))}
        </div>
      </Card>

      {isLoading ? <Loader /> : null}
      <div className={styles.list}>
        {data.map(event => <EventCard key={event.id} event={event} onClick={() => navigate(`/events/${event.id}`)} />)}
      </div>
      {!isLoading && data.length === 0 ? <EmptyState title="No matching events" message="Try another search or filter." /> : null}
      {permissions.canCreateEvent ? <Button className={styles.fab} onClick={() => navigate('/events/create')}>+ New</Button> : null}
    </div>
  )
}
