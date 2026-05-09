import { useState } from 'react'
import toast from 'react-hot-toast'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Loader } from '@/components/feedback/Loader/Loader'
import { Button } from '@/components/ui/Button'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import { fromNow } from '@/utils/formatters'
import styles from './Notifications.module.css'

export function Notifications() {
  const { data = [], isLoading } = useNotifications()
  const [readIds, setReadIds] = useState<string[]>([])

  const markRead = (id: string) => {
    setReadIds(prev => (prev.includes(id) ? prev : [...prev, id]))
    toast.success('Marked read')
  }

  const markAll = () => {
    const ids = (data || []).map(n => n.id)
    setReadIds(ids)
    toast.success('All marked read')
  }

  if (isLoading) return <Loader />

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Notifications</h1>
        <div>
          <Button type="button" variant="ghost" size="sm" onClick={markAll} disabled={data.length === 0}>Mark all read</Button>
        </div>
      </div>

      {data.length === 0 ? <EmptyState title="No notifications" message="Family updates will appear here." /> : null}
      {data.filter(n => !readIds.includes(n.id)).map(notification => (
        <article key={notification.id} className={styles.item}>
          <div className={styles.itemHeader}>
            <h2>{notification.type.split('_').join(' ')}</h2>
            <div>
              <Button type="button" size="sm" variant="ghost" onClick={() => markRead(notification.id)}>Mark read</Button>
            </div>
          </div>
          <p>{notification.payload.message || notification.payload.title || notification.status}</p>
          <span>{fromNow(notification.createdAt)}</span>
        </article>
      ))}
    </div>
  )
}
