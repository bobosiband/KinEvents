import toast from 'react-hot-toast'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Loader } from '@/components/feedback/Loader/Loader'
import { Button } from '@/components/ui/Button'
import { useNotifications, useMarkNotificationRead } from '@/features/notifications/hooks/useNotifications'
import { fromNow } from '@/utils/formatters'

export function Notifications() {
  const { data = [], isLoading } = useNotifications()
  const { mutate: markRead } = useMarkNotificationRead()

  const handleMarkRead = (id: string) => {
    markRead(id, {
      onSuccess: () => {
        toast.success('Marked as read')
      },
      onError: () => {
        toast.error('Failed to mark as read')
      },
    })
  }

  const handleMarkAll = () => {
    const unreadNotifications = data.filter(n => !n.isRead)
    if (unreadNotifications.length === 0) {
      toast.success('All already read')
      return
    }
    unreadNotifications.forEach(n => {
      markRead(n.id)
    })
    toast.success('All marked as read')
  }

  if (isLoading) return <Loader />

  const unreadCount = data.filter(n => !n.isRead).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <div>
          <Button type="button" variant="ghost" size="sm" onClick={handleMarkAll} disabled={unreadCount === 0}>Mark all read</Button>
        </div>
      </div>

      {data.length === 0 ? <EmptyState title="No notifications" message="Family updates will appear here." /> : null}
      {data.map(notification => (
        <article key={notification.id} className={`rounded-2xl border border-border ${notification.isRead ? 'bg-muted' : 'bg-card'} p-4 shadow-sm space-y-3`}>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-semibold capitalize">{notification.type.split('_').join(' ')}</h2>
            <div>
              {!notification.isRead && (
                <Button type="button" size="sm" variant="ghost" onClick={() => handleMarkRead(notification.id)}>Mark read</Button>
              )}
              {notification.isRead && (
                <span className="text-xs text-muted-foreground">Read</span>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{notification.payload.message || notification.payload.title || notification.status}</p>
          <span className="text-xs text-muted-foreground">{fromNow(notification.createdAt)}</span>
        </article>
      ))}
    </div>
  )
}
