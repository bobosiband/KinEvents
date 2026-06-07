import type { VercelRequest } from '@vercel/node'

import type { IUser } from './user.interface'

export type AccessRequestStatus = 'pending' | 'approved' | 'rejected'

export interface IAccessRequest {
  id: string
  name: string
  email: string
  message?: string
  status: AccessRequestStatus
  requestedAt: string
  resolvedAt?: string
  resolvedBy?: string
}

export interface IAuthenticatedRequest extends VercelRequest {
  user: IUser
}

export type AuthAuditAction =
  | 'login.success'
  | 'login.failure'
  | 'login.blocked'
  | 'request_access.success'
  | 'request_access.blocked'

export type AuthFailureReason = 'unknown_user' | 'not_approved' | 'rate_limited'

/**
 * Narrow shape for entries appended to the shared `auditLogs` array by the
 * auth throttle/audit helpers. Never carries a token or full email — only a
 * masked hint — so it is safe to persist and inspect.
 */
export interface IAuthAuditEntry {
  id: string
  action: AuthAuditAction
  actorId: string | null
  emailHint: string
  ip?: string
  reason?: AuthFailureReason
  timestamp: string
}