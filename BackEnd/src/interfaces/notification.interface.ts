export type NotificationType =
  | 'event_created'
  | 'event_updated'
  | 'event_reminder'
  | 'birthday_reminder'
  | 'birthday_today'
  | 'access_approved'
  | 'access_rejected'

export type NotificationStatus = 'pending' | 'sent' | 'failed'

export interface INotification {
  id: string
  type: NotificationType
  recipientId: string
  payload: Record<string, string>
  status: NotificationStatus
  createdAt: string
  sentAt?: string
  readBy?: string[]
  readAt?: string
}