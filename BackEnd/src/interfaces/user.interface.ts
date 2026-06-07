export type UserRole = 'admin' | 'manager' | 'member'

export type AccessStatus = 'pending' | 'approved' | 'rejected' | 'revoked'

export type NotificationLevel = 'all' | 'important' | 'none'

export type NotificationChannel = 'email' | 'whatsapp' | 'push'

export interface INotificationPrefs {
  level: NotificationLevel
  channels: NotificationChannel[]
}

export interface INotificationPreferences {
  email?: boolean
  whatsapp?: boolean
  push?: boolean
}

export interface IUser {
  id: string
  name: string
  email: string
  role: UserRole
  accessStatus: AccessStatus
  birthday?: string
  phone?: string
  phoneNumber?: string
  phoneVerified?: boolean
  capabilities: string[]
  notificationPrefs: INotificationPrefs
  notificationPreferences?: INotificationPreferences
  createdAt: string
  updatedAt: string
}