import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Loader } from '@/components/feedback/Loader/Loader'
import { BirthdayCard } from '@/features/birthdays/components/BirthdayCard/BirthdayCard'
import { useBirthdays } from '@/features/birthdays/hooks/useBirthdays'
import { EventCard } from '@/features/events/components/EventCard/EventCard'
import { useEvents } from '@/features/events/hooks/useEvents'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import styles from './Home.module.css'

export function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const permissions = usePermissions()
  const events = useEvents()
  const birthdays = useBirthdays(5)
  const upcoming = (events.data || []).slice(0, 5)

  return (
    <div className={styles.page}>
      <Card className={styles.greeting}>
        <span>Good morning,</span>
        <h1>{user?.name || 'family'} 👋</h1>
      </Card>
      <section className={styles.section}>
        <h2>Upcoming Events</h2>
        {events.isLoading ? <Loader /> : null}
        {!events.isLoading && upcoming.length === 0 ? <EmptyState title="No events yet" message="Create the first family plan." /> : null}
        <div className={styles.strip}>
          {upcoming.map(event => <EventCard key={event.id} event={event} compact onClick={() => navigate(`/events/${event.id}`)} />)}
        </div>
      </section>
      <section className={styles.section}>
        <h2>Upcoming Birthdays</h2>
          {birthdays.data?.map(birthday => <BirthdayCard key={birthday.user.id} birthday={birthday} />)}
      </section>
      {permissions.canCreateEvent ? (
        <Button className={styles.quick} onClick={() => navigate('/events/create')}>+ Create Event</Button>
      ) : null}
    </div>
  )
}
