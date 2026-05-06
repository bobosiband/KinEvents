export type UserRole = 'admin' | 'manager' | 'member'

export type AccessStatus = 'pending' | 'approved' | 'rejected' | 'revoked'

export type NotificationLevel = 'all' | 'important' | 'none'

export type NotificationChannel = 'email' | 'push'

export interface INotificationPrefs {
  level: NotificationLevel
  channels: NotificationChannel[]
}

export interface IUser {
  id: string
  name: string
  email: string
  role: UserRole
  accessStatus: AccessStatus
  birthday?: string
  capabilities: string[]
  notificationPrefs: INotificationPrefs
  createdAt: string
  updatedAt: string
}