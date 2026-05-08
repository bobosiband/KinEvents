import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Loader } from '@/components/feedback/Loader/Loader'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import { fromNow } from '@/utils/formatters'
import styles from './Notifications.module.css'

export function Notifications() {
  const { data = [], isLoading } = useNotifications()

  if (isLoading) return <Loader />

  return (
    <div className={styles.page}>
      <h1>Notifications</h1>
      {data.length === 0 ? <EmptyState title="No notifications" message="Family updates will appear here." /> : null}
      {data.map(notification => (
        <article key={notification.id} className={styles.item}>
          <h2>{notification.type.split('_').join(' ')}</h2>
          <p>{notification.payload.message || notification.payload.title || notification.status}</p>
          <span>{fromNow(notification.createdAt)}</span>
        </article>
      ))}
    </div>
  )
}
