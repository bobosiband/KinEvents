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
  /**
   * Incremented to invalidate all previously issued tokens for this user
   * (e.g. on role change, email change, or revocation). Absent on legacy
   * users/tokens, which are treated as version 0.
   */
  tokenVersion?: number
  createdAt: string
  updatedAt: string
}