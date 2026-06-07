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
 * masked hint (for display) and a one-way HMAC key (for matching) — so it is
 * safe to persist and inspect.
 */
export interface IAuthAuditEntry {
  id: string
  action: AuthAuditAction
  actorId: string | null
  emailHint: string
  /** HMAC-SHA256 of the normalized email — used to match throttle candidates without storing a reversible identifier. Optional so older persisted entries (pre-dating this field) remain valid; they simply age out of the rate-limit window without matching on it. */
  emailKey?: string
  ip?: string
  reason?: AuthFailureReason
  timestamp: string
}

export type AdminAuditAction = 'user.access_revoked' | 'user.access_reinstated'

/**
 * Narrow shape for admin-action entries appended to the shared `auditLogs`
 * array when an admin revokes or reinstates an approved user's access.
 * Deliberately distinct from `AuthAuditAction` so these are never counted
 * toward the login/request-access throttle nor pruned by its retention sweep.
 */
export interface IAdminAuditEntry {
  id: string
  action: AdminAuditAction
  actorId: string
  targetUserId: string
  timestamp: string
}