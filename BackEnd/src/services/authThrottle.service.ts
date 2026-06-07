import { createHmac, randomUUID } from 'crypto'

import type { VercelRequest } from '@vercel/node'

import { env } from '../config/env'
import { readData, persistData } from '../config/db'
import type { AuthAuditAction, AuthFailureReason, IAuthAuditEntry } from '../interfaces/auth.interface'

export type AuthAttemptPrefix = 'login' | 'request_access'

/**
 * Normalizes an email the same way across masking, key derivation, and
 * lookups so all three agree on what counts as "the same address".
 */
function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase()
}

/**
 * Masks an email for safe logging, e.g. "john@example.com" -> "j•••@example.com".
 * Display-only — collisions across different addresses (e.g. same first
 * letter + domain) are expected and fine for a human-readable hint, but make
 * this unsuitable as a throttle-matching key (see `emailKey`).
 */
export function maskEmail(email: string): string {
  const normalized = normalizeEmail(email)
  const atIndex = normalized.indexOf('@')
  if (atIndex <= 0 || atIndex === normalized.length - 1) return '•••'

  const local = normalized.slice(0, atIndex)
  const domain = normalized.slice(atIndex + 1)
  return `${local[0]}•••@${domain}`
}

/**
 * Deterministic, one-way throttle-matching key for an email address:
 * HMAC-SHA256(normalizedEmail, secret), hex-encoded. Unlike `maskEmail`
 * (display-only, lossy by design), this never collides across distinct
 * addresses and cannot be reversed back to the address. The secret falls
 * back to JWT_SECRET so no new required env var is introduced.
 */
function emailKeyFor(email: string): string {
  const secret = env.AUTH_THROTTLE_SECRET || env.JWT_SECRET
  return createHmac('sha256', secret).update(normalizeEmail(email)).digest('hex')
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

/**
 * Every action the throttle/audit log can record for the public auth
 * endpoints. Used to scope retention pruning to auth-attempt entries only —
 * gift-pool audits and admin-action entries (different `action` values) are
 * never touched by it.
 */
const AUTH_AUDIT_ACTIONS: ReadonlySet<AuthAuditAction> = new Set<AuthAuditAction>([
  'login.success',
  'login.failure',
  'login.blocked',
  'request_access.success',
  'request_access.blocked',
])

function isAuthAuditAction(action: string): action is AuthAuditAction {
  return AUTH_AUDIT_ACTIONS.has(action as AuthAuditAction)
}

/**
 * How long auth-attempt entries are kept before being pruned. Clamped up to
 * at least the rate-limit window so a misconfigured (too-short) retention
 * value can never cause `isRateLimited` to undercount recent attempts.
 */
function retentionWindowMs(): number {
  const configuredMs = env.AUTH_AUDIT_RETENTION_HOURS * 60 * 60 * 1000
  const minimumMs = env.LOGIN_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000
  return Math.max(configuredMs, minimumMs)
}

/**
 * Drops stale auth-attempt entries in a single pass, leaving every other
 * entry (gift-pool audits, admin-action entries, ...) untouched regardless
 * of age — `auditLogs` is a shared array and this sweep only owns its own
 * action types.
 */
function pruneStaleAuthEntries(auditLogs: IAuthAuditEntry[]): IAuthAuditEntry[] {
  const cutoffMs = Date.now() - retentionWindowMs()

  return auditLogs.filter((entry) => {
    if (!isAuthAuditAction(entry.action)) return true
    const time = Date.parse(entry.timestamp)
    return Number.isFinite(time) && time >= cutoffMs
  })
}

interface RecordAuthAttemptInput {
  action: AuthAuditAction
  actorId: string | null
  email: string
  ip?: string
  reason?: AuthFailureReason
}

/**
 * Appends a typed entry to the shared `auditLogs` array, prunes stale
 * auth-attempt entries (bounding growth — folded into this same write so
 * there's no extra DB round-trip), and persists the result. Stores both the
 * masked `emailHint` (for human-readable logs) and the one-way `emailKey`
 * (for throttle matching) — never the full address or a token.
 */
export async function recordAuthAttempt(input: RecordAuthAttemptInput): Promise<void> {
  const db = await readData()
  db.auditLogs = db.auditLogs ?? []

  const entry: IAuthAuditEntry = {
    id: randomUUID(),
    action: input.action,
    actorId: input.actorId,
    emailHint: maskEmail(input.email),
    emailKey: emailKeyFor(input.email),
    ip: input.ip,
    reason: input.reason,
    timestamp: new Date().toISOString(),
  }

  db.auditLogs = pruneStaleAuthEntries(db.auditLogs as IAuthAuditEntry[])
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
  email: string
  ip?: string
}

/**
 * Counts recent throttle-relevant audit entries for the same address or IP
 * within the configured window. Matches on the one-way `emailKey` — never
 * the display-only `emailHint`, which intentionally collapses distinct
 * addresses (e.g. "john@gmail.com" and "jane@gmail.com" both mask to
 * "j•••@gmail.com") and would otherwise let one user throttle another.
 * Entries persisted before `emailKey` existed simply won't match on it and
 * age out of the window normally. No separate counter store is needed — the
 * audit log itself is the source of truth.
 */
export async function isRateLimited(input: RateLimitCheckInput): Promise<boolean> {
  const db = await readData()
  const auditLogs = db.auditLogs ?? []

  const countableActions = COUNTABLE_ACTIONS[input.prefix]
  const sinceMs = Date.now() - env.LOGIN_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000
  const emailKey = emailKeyFor(input.email)

  const matches = auditLogs.filter((entry) => {
    if (!countableActions.includes(entry.action as AuthAuditAction)) return false
    if (!isWithinWindow(entry.timestamp, sinceMs)) return false

    const authEntry = entry as Partial<IAuthAuditEntry>
    const matchesKey = Boolean(authEntry.emailKey) && authEntry.emailKey === emailKey
    const matchesIp = Boolean(input.ip) && authEntry.ip === input.ip
    return matchesKey || matchesIp
  })

  return matches.length >= env.LOGIN_RATE_LIMIT_MAX
}
