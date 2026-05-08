export type UserRole = 'admin' | 'manager' | 'member'
export type AccessStatus = 'pending' | 'approved' | 'rejected' | 'revoked'
export type NotificationLevel = 'all' | 'important' | 'none'
export type NotificationChannel = 'email' | 'push'

export interface NotificationPrefs {
  level: NotificationLevel
  channels: NotificationChannel[]
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  accessStatus: AccessStatus
  birthday?: string
  capabilities: string[]
  notificationPrefs: NotificationPrefs
  createdAt: string
  updatedAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

export interface LoginPayload {
  email: string
}

export interface LoginResponse {
  user: User
  token: string
}

export interface RequestAccessPayload {
  name: string
  email: string
  message?: string
}

export interface AccessRequest {
  id: string
  name: string
  email: string
  message?: string
  status: 'pending' | 'approved' | 'rejected'
  requestedAt: string
  resolvedAt?: string
  resolvedBy?: string
}
