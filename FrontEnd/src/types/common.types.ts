export interface SelectOption<T extends string = string> {
  label: string
  value: T
}

export interface NotificationItem {
  id: string
  type: string
  recipientId: string
  payload: Record<string, string>
  status: 'pending' | 'sent' | 'failed'
  createdAt: string
  sentAt?: string
  readBy?: string[]
  isRead?: boolean
}
