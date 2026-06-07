import { randomUUID } from 'crypto'

import type { VercelRequest } from '@vercel/node'

import { env } from '../config/env'
import { readData, persistData } from '../config/db'
import type { AuthAuditAction, AuthFailureReason, IAuthAuditEntry } from '../interfaces/auth.interface'

export type AuthAttemptPrefix = 'login' | 'request_access'

/**
 * Masks an email for safe logging, e.g. "john@example.com" -> "j•••@example.com".
 * Never log the full address — only this hint is persisted to `auditLogs`.
 */
export function maskEmail(email: string): string {
  const normalized = String(email || '').trim().toLowerCase()
  const atIndex = normalized.indexOf('@')
  if (atIndex <= 0 || atIndex === normalized.length - 1) return '•••'

  const local = normalized.slice(0, atIndex)
  const domain = normalized.slice(atIndex + 1)
  return `${local[0]}•••@${domain}`
}

/**
 * Extracts the originating client IP from the `x-forwarded-for` header
 * (first hop), falling back to the raw socket address. The app runs behind
 * Vercel/API Gateway, so the header is expected to be present in production.
 */
export function getClientIp(req: VercelRequest): string | undefined {
  const forwarded = req.headers['x-forwarded-for']
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded

  if (value) {
    const firstHop = value.split(',')[0]?.trim()
    if (firstHop) return firstHop
  }

  return req.socket?.remoteAddress ?? undefined
}

interface RecordAuthAttemptInput {
  action: AuthAuditAction
  actorId: string | null
  emailHint: string
  ip?: string
  reason?: AuthFailureReason
}

/**
 * Appends a typed entry to the shared `auditLogs` array and persists it.
 * Never pass a token or full email — only masked hints are stored.
 */
export async function recordAuthAttempt(input: RecordAuthAttemptInput): Promise<void> {
  const db = await readData()
  db.auditLogs = db.auditLogs ?? []

  const entry: IAuthAuditEntry = {
    id: randomUUID(),
    action: input.action,
    actorId: input.actorId,
    emailHint: input.emailHint,
    ip: input.ip,
    reason: input.reason,
    timestamp: new Date().toISOString(),
  }

  db.auditLogs.push(entry)
  await persistData()
}

function isWithinWindow(timestamp: string, sinceMs: number): boolean {
  const time = Date.parse(timestamp)
  return Number.isFinite(time) && time >= sinceMs
}

/**
 * Which audit actions count toward the rate-limit threshold, per endpoint.
 *
 * - `login`: only failed/blocked attempts count. A member who signs in
 *   repeatedly and successfully should never be throttled — only the
 *   brute-force / credential-stuffing signal (wrong or unapproved emails)
 *   should accumulate.
 * - `request_access`: there is no "wrong credentials" concept here — every
 *   submission creates persistent state and triggers admin notifications,
 *   so all outcomes (including successes) count toward the throttle.
 */
const COUNTABLE_ACTIONS: Record<AuthAttemptPrefix, readonly AuthAuditAction[]> = {
  login: ['login.failure', 'login.blocked'],
  request_access: ['request_access.success', 'request_access.blocked'],
}

interface RateLimitCheckInput {
  prefix: AuthAttemptPrefix
  emailHint: string
  ip?: string
}

/**
 * Counts recent throttle-relevant audit entries for the same masked email or
 * IP within the configured window. No separate counter store is needed — the
 * audit log itself is the source of truth.
 */
export async function isRateLimited(input: RateLimitCheckInput): Promise<boolean> {
  const db = await readData()
  const auditLogs = db.auditLogs ?? []

  const countableActions = COUNTABLE_ACTIONS[input.prefix]
  const sinceMs = Date.now() - env.LOGIN_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000

  const matches = auditLogs.filter((entry) => {
    if (!countableActions.includes(entry.action as AuthAuditAction)) return false
    if (!isWithinWindow(entry.timestamp, sinceMs)) return false

    const authEntry = entry as Partial<IAuthAuditEntry>
    const matchesEmail = authEntry.emailHint === input.emailHint
    const matchesIp = Boolean(input.ip) && authEntry.ip === input.ip
    return matchesEmail || matchesIp
  })

  return matches.length >= env.LOGIN_RATE_LIMIT_MAX
}
