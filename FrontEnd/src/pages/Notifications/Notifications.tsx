import { useState } from 'react'
import toast from 'react-hot-toast'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Loader } from '@/components/feedback/Loader/Loader'
import { Button } from '@/components/ui/Button'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import { fromNow } from '@/utils/formatters'

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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <div>
          <Button type="button" variant="ghost" size="sm" onClick={markAll} disabled={data.length === 0}>Mark all read</Button>
        </div>
      </div>

      {data.length === 0 ? <EmptyState title="No notifications" message="Family updates will appear here." /> : null}
      {data.filter(n => !readIds.includes(n.id)).map(notification => (
        <article key={notification.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-semibold capitalize">{notification.type.split('_').join(' ')}</h2>
            <div>
              <Button type="button" size="sm" variant="ghost" onClick={() => markRead(notification.id)}>Mark read</Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{notification.payload.message || notification.payload.title || notification.status}</p>
          <span className="text-xs text-muted-foreground">{fromNow(notification.createdAt)}</span>
        </article>
      ))}
    </div>
  )
}
