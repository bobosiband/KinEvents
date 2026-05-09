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

type Filter = 'all' | EventType

export function Events() {
  const navigate = useNavigate()
  const permissions = usePermissions()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const { data = [], isLoading } = useEvents({ search, type: filter === 'all' ? undefined : filter })

  return (
    <div className="space-y-4">
      <Card className="space-y-4" variant="elevated">
        <Badge tone="accent" pill>Events</Badge>
        <h1 className="text-3xl font-bold">Browse family plans</h1>
        <p className="text-sm text-muted-foreground">Search, filter, and jump into any event detail without losing context.</p>
        <Input label="Search events" value={search} onChange={event => setSearch(event.target.value)} fullWidth />
        <div className="flex flex-wrap gap-2">
          {(['all', 'birthday', 'custom'] as Filter[]).map(item => (
            <button
              key={item}
              type="button"
              className={[
                'rounded-full px-4 py-2 text-sm font-medium transition',
                filter === item ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
              ].join(' ')}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </Card>

      {isLoading ? <Loader /> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.map(event => <EventCard key={event.id} event={event} onClick={() => navigate(`/events/${event.id}`)} />)}
      </div>
      {!isLoading && data.length === 0 ? <EmptyState title="No matching events" message="Try another search or filter." /> : null}
      {permissions.canCreateEvent ? (
        <div className="flex justify-end">
          <Button onClick={() => navigate('/events/create')}>+ New</Button>
        </div>
      ) : null}
    </div>
  )
}
