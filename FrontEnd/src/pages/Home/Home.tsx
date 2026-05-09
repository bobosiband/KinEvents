import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Divider } from '@/components/ui/Divider'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Loader } from '@/components/feedback/Loader/Loader'
import { BirthdayCard } from '@/features/birthdays/components/BirthdayCard/BirthdayCard'
import { useBirthdays } from '@/features/birthdays/hooks/useBirthdays'
import { EventCard } from '@/features/events/components/EventCard/EventCard'
import { useEvents } from '@/features/events/hooks/useEvents'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { fromNow } from '@/utils/formatters'
import styles from './Home.module.css'

export function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const permissions = usePermissions()
  const events = useEvents()
  const birthdays = useBirthdays(5)
  const notifications = useNotifications()
  const upcoming = (events.data || []).slice(0, 5)
  const recentNotifications = (notifications.data || []).slice(0, 3)

  const summaryCards = [
    { label: 'Upcoming events', value: String(upcoming.length), note: 'Plans on the calendar' },
    { label: 'Birthdays', value: String(birthdays.data?.length || 0), note: 'Coming up soon' },
    { label: 'Notifications', value: String(notifications.data?.length || 0), note: 'Recent updates' },
  ]

  return (
    <div className={styles.page}>
      <Card className={styles.hero} variant="elevated">
        <div className={styles.heroTop}>
          <div>
            <Badge tone="accent" pill>{user?.role || 'member'}</Badge>
            <h1>Good morning, {user?.name || 'family'} 👋</h1>
            <p>Here is everything worth knowing today, without digging through the app.</p>
          </div>
          <Avatar name={user?.name} size="xl" showOnline />
        </div>
        <div className={styles.actions}>
          {permissions.canCreateEvent ? <Button type="button" onClick={() => navigate('/events/create')}>Create event</Button> : null}
          <Button type="button" variant="secondary" onClick={() => navigate('/events')}>Browse events</Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/notifications')}>View updates</Button>
        </div>
      </Card>

      <section className={styles.stats} aria-label="Summary">
        {summaryCards.map(card => (
          <Card key={card.label} className={styles.statCard}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.note}</p>
          </Card>
        ))}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Upcoming Events</h2>
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/events')}>See all</Button>
        </div>
        {events.isLoading ? <Loader /> : null}
        {!events.isLoading && upcoming.length === 0 ? <EmptyState title="No events yet" message="Create the first family plan." /> : null}
        <div className={styles.strip}>
          {upcoming.map(event => <EventCard key={event.id} event={event} compact onClick={() => navigate(`/events/${event.id}`)} />)}
        </div>
      </section>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Upcoming Birthdays</h2>
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/birthdays')}>See all</Button>
        </div>
        {birthdays.isLoading ? <Loader /> : null}
        {!birthdays.isLoading && (birthdays.data?.length || 0) === 0 ? <EmptyState title="No birthdays yet" message="Profile dates will appear here when they are added." /> : null}
        <div className={styles.grid}>
          {birthdays.data?.map(birthday => <BirthdayCard key={birthday.user.id} birthday={birthday} />)}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Recent updates</h2>
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/notifications')}>See all</Button>
        </div>
        {notifications.isLoading ? <Loader /> : null}
        {!notifications.isLoading && recentNotifications.length === 0 ? <EmptyState title="No notifications" message="Family updates will show up here." /> : null}
        <div className={styles.notifications}>
          {recentNotifications.map(notification => (
            <Card key={notification.id} className={styles.notification} variant="bordered">
              <div className={styles.notificationHeader}>
                <Badge tone="neutral" pill>{notification.type.split('_').join(' ')}</Badge>
                <span>{fromNow(notification.createdAt)}</span>
              </div>
              <p>{notification.payload.message || notification.payload.title || notification.status}</p>
            </Card>
          ))}
        </div>
      </section>

      {permissions.canCreateEvent ? (
        <Button className={styles.quick} onClick={() => navigate('/events/create')}>+ Create Event</Button>
      ) : null}
    </div>
  )
}
