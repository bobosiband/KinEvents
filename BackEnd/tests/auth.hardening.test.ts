import { randomUUID } from 'crypto'
import jwt from 'jsonwebtoken'
import type { VercelRequest, VercelResponse } from '@vercel/node'

import { env } from '../src/config/env'
import { getData, type AuditLogEntry } from '../src/config/db'
import { withAuth } from '../src/middleware/withAuth'
import { authService, bumpTokenVersion } from '../src/services/auth.service'
import { maskEmail, recordAuthAttempt } from '../src/services/authThrottle.service'
import type { IUser } from '../src/interfaces/user.interface'
import type { IAdminAuditEntry, IAuthAuditEntry } from '../src/interfaces/auth.interface'
import { resetDb, seedDb } from './helpers/db.helper'

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-testing-purposes-only'

const makeUser = (overrides: Partial<IUser> = {}): IUser => ({
  id: randomUUID(),
  name: 'Approved User',
  email: `member-${randomUUID()}@example.com`,
  role: 'member',
  accessStatus: 'approved',
  capabilities: [],
  notificationPrefs: { level: 'all', channels: ['email'] },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
})

const createMockRequest = (overrides: Partial<VercelRequest> = {}): VercelRequest =>
  ({
    method: 'POST',
    headers: {},
    query: {},
    socket: { remoteAddress: '127.0.0.1' },
    ...overrides,
  }) as unknown as VercelRequest

const createMockResponse = (): VercelResponse => {
  const response: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    end: jest.fn(),
    statusCode: 200,
    setHeader: jest.fn(),
  }
  return response
}

function authAuditEntries(action?: string): IAuthAuditEntry[] {
  const entries = getData().auditLogs as unknown as IAuthAuditEntry[]
  return action ? entries.filter((entry) => entry.action === action) : entries
}

beforeEach(() => {
  resetDb()
})

describe('Login rate limiting', () => {
  it('blocks login after the failure threshold is reached and logs login.blocked', async () => {
    const loginHandler = require('../api/auth/login').default
    const max = env.LOGIN_RATE_LIMIT_MAX

    for (let i = 0; i < max; i++) {
      const req = createMockRequest({ body: { email: 'nobody@example.com' }, headers: { 'x-forwarded-for': '10.0.0.1' } })
      const res = createMockResponse()
      await loginHandler(req, res)
      expect(res.status).toHaveBeenCalledWith(404)
    }

    expect(authAuditEntries('login.failure')).toHaveLength(max)

    const blockedReq = createMockRequest({ body: { email: 'nobody@example.com' }, headers: { 'x-forwarded-for': '10.0.0.1' } })
    const blockedRes = createMockResponse()
    await loginHandler(blockedReq, blockedRes)

    expect(blockedRes.status).toHaveBeenCalledWith(429)
    const blocked = authAuditEntries('login.blocked')
    expect(blocked).toHaveLength(1)
    expect(blocked[0].reason).toBe('rate_limited')
    expect(blocked[0].emailHint).toBe('n•••@example.com')
  })

  it('does not count attempts that fall outside the rate-limit window', async () => {
    const loginHandler = require('../api/auth/login').default
    const max = env.LOGIN_RATE_LIMIT_MAX
    const windowMs = env.LOGIN_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000
    const staleTimestamp = new Date(Date.now() - windowMs - 60_000).toISOString()

    for (let i = 0; i < max; i++) {
      await recordAuthAttempt({
        action: 'login.failure',
        actorId: null,
        email: 'nobody@example.com',
        ip: '10.0.0.9',
        reason: 'unknown_user',
      })
    }
    // Push the seeded entries outside the window.
    getData().auditLogs.forEach((entry) => {
      entry.timestamp = staleTimestamp
    })

    const req = createMockRequest({ body: { email: 'nobody@example.com' }, headers: { 'x-forwarded-for': '10.0.0.9' } })
    const res = createMockResponse()
    await loginHandler(req, res)

    // Stale entries don't count — falls through to the normal 404, not 429.
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.status).not.toHaveBeenCalledWith(429)
  })

  it('does not block the success path when under the threshold', async () => {
    const loginHandler = require('../api/auth/login').default
    const user = makeUser()
    seedDb({ users: [user] })

    const req = createMockRequest({ body: { email: user.email }, headers: { 'x-forwarded-for': '10.0.0.5' } })
    const res = createMockResponse()
    await loginHandler(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.status).not.toHaveBeenCalledWith(429)
  })

  it('does not let two different addresses that mask to the same emailHint share a throttle bucket', async () => {
    const loginHandler = require('../api/auth/login').default
    const max = env.LOGIN_RATE_LIMIT_MAX

    // "john@gmail.com" and "jane@gmail.com" both mask to "j•••@gmail.com" —
    // the display hint collides, but the throttle must key on the full
    // (hashed) address, not the mask, or one user could lock out the other.
    expect(maskEmail('john@gmail.com')).toBe(maskEmail('jane@gmail.com'))

    for (let i = 0; i < max; i++) {
      const req = createMockRequest({ body: { email: 'john@gmail.com' }, headers: { 'x-forwarded-for': '10.1.0.1' } })
      const res = createMockResponse()
      await loginHandler(req, res)
      expect(res.status).toHaveBeenCalledWith(404)
    }

    // John is now blocked...
    const johnBlocked = createMockRequest({ body: { email: 'john@gmail.com' }, headers: { 'x-forwarded-for': '10.1.0.1' } })
    const johnRes = createMockResponse()
    await loginHandler(johnBlocked, johnRes)
    expect(johnRes.status).toHaveBeenCalledWith(429)

    // ...but Jane, a different address on the same domain (and a different
    // IP), must not be — her bucket is keyed on her own address, not the
    // shared display mask.
    const janeReq = createMockRequest({ body: { email: 'jane@gmail.com' }, headers: { 'x-forwarded-for': '10.2.0.1' } })
    const janeRes = createMockResponse()
    await loginHandler(janeReq, janeRes)
    expect(janeRes.status).toHaveBeenCalledWith(404)
    expect(janeRes.status).not.toHaveBeenCalledWith(429)
  })
})

describe('Login audit logging', () => {
  it('logs login.failure with reason unknown_user and preserves the 404 response', async () => {
    const loginHandler = require('../api/auth/login').default

    const req = createMockRequest({ body: { email: 'ghost@example.com' } })
    const res = createMockResponse()
    await loginHandler(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User not found' })

    const entries = authAuditEntries('login.failure')
    expect(entries).toHaveLength(1)
    expect(entries[0].reason).toBe('unknown_user')
    expect(entries[0].actorId).toBeNull()
    expect(entries[0].emailHint).toBe('g•••@example.com')
  })

  it('logs login.failure with reason not_approved and preserves the 403 response', async () => {
    const loginHandler = require('../api/auth/login').default
    const pendingUser = makeUser({ accessStatus: 'pending' })
    seedDb({ users: [pendingUser] })

    const req = createMockRequest({ body: { email: pendingUser.email } })
    const res = createMockResponse()
    await loginHandler(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User account is not approved' })

    const entries = authAuditEntries('login.failure')
    expect(entries).toHaveLength(1)
    expect(entries[0].reason).toBe('not_approved')
    expect(entries[0].actorId).toBe(pendingUser.id)
  })

  it('logs login.success with the user id as actor on a successful login', async () => {
    const loginHandler = require('../api/auth/login').default
    const user = makeUser()
    seedDb({ users: [user] })

    const req = createMockRequest({ body: { email: user.email } })
    const res = createMockResponse()
    await loginHandler(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    const entries = authAuditEntries('login.success')
    expect(entries).toHaveLength(1)
    expect(entries[0].actorId).toBe(user.id)
    expect(entries[0].emailHint).toMatch(/^.•••@example\.com$/)
  })

  it('never persists the issued token or the full email address in the audit log', async () => {
    const loginHandler = require('../api/auth/login').default
    const user = makeUser({ email: 'fulladdress@example.com' })
    seedDb({ users: [user] })

    const req = createMockRequest({ body: { email: user.email } })
    const res = createMockResponse()
    await loginHandler(req, res)

    const issuedToken = (res.json as jest.Mock).mock.calls[0][0]?.data?.token
    expect(typeof issuedToken).toBe('string')

    const serializedLogs = JSON.stringify(getData().auditLogs)
    expect(serializedLogs).not.toContain(issuedToken)
    expect(serializedLogs).not.toContain('fulladdress@example.com')
    expect(serializedLogs).toContain('f•••@example.com')
  })
})

describe('request-access rate limiting and audit logging', () => {
  it('blocks repeated request-access attempts and logs request_access.blocked', async () => {
    const handler = require('../api/auth/request-access').default
    const max = env.LOGIN_RATE_LIMIT_MAX

    for (let i = 0; i < max; i++) {
      const req = createMockRequest({
        method: 'POST',
        body: { name: `Person ${i}`, email: `person${i}@example.com` },
        headers: { 'x-forwarded-for': '10.0.1.1' },
      })
      const res = createMockResponse()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(201)
    }

    expect(authAuditEntries('request_access.success')).toHaveLength(max)

    const blockedReq = createMockRequest({
      method: 'POST',
      body: { name: 'One More', email: 'oneMore@example.com' },
      headers: { 'x-forwarded-for': '10.0.1.1' },
    })
    const blockedRes = createMockResponse()
    await handler(blockedReq, blockedRes)

    expect(blockedRes.status).toHaveBeenCalledWith(429)
    const blocked = authAuditEntries('request_access.blocked')
    expect(blocked).toHaveLength(1)
    expect(blocked[0].reason).toBe('rate_limited')
  })

  it('logs request_access.success with a masked email hint and no full email', async () => {
    const handler = require('../api/auth/request-access').default

    const req = createMockRequest({
      method: 'POST',
      body: { name: 'Jane Doe', email: 'janedoe@example.com' },
    })
    const res = createMockResponse()
    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(201)
    const entries = authAuditEntries('request_access.success')
    expect(entries).toHaveLength(1)
    expect(entries[0].emailHint).toBe('j•••@example.com')

    const serializedLogs = JSON.stringify(getData().auditLogs)
    expect(serializedLogs).not.toContain('janedoe@example.com')
  })
})

describe('Token hygiene — issueToken', () => {
  it('produces a minimal-payload token that withAuth accepts via the live user lookup', async () => {
    const user = makeUser()
    seedDb({ users: [user] })

    const token = authService.issueToken(user)
    const mockHandler = jest.fn()
    const wrapped = withAuth(mockHandler)

    const req = createMockRequest({ method: 'GET', headers: { authorization: `Bearer ${token}` } })
    const res = createMockResponse()
    await wrapped(req, res)

    expect(mockHandler).toHaveBeenCalled()
    const handlerReq = mockHandler.mock.calls[0][0]
    expect(handlerReq.user.id).toBe(user.id)
  })

  it('signs only { id, tokenVersion } — no other user fields', () => {
    const user = makeUser({ tokenVersion: 3 })
    const token = authService.issueToken(user)
    const decoded = jwt.decode(token) as Record<string, unknown>

    const payloadKeys = Object.keys(decoded).filter((key) => !['iat', 'exp'].includes(key))
    expect(payloadKeys.sort()).toEqual(['id', 'tokenVersion'])
    expect(decoded.id).toBe(user.id)
    expect(decoded.tokenVersion).toBe(3)
  })

  it('defaults tokenVersion to 0 when the user has none set', () => {
    const user = makeUser()
    delete user.tokenVersion
    const token = authService.issueToken(user)
    const decoded = jwt.decode(token) as Record<string, unknown>

    expect(decoded.tokenVersion).toBe(0)
  })
})

describe('withAuth — tokenVersion enforcement', () => {
  it('rejects a token minted at version 0 once the user is bumped to version 1', async () => {
    const user = makeUser({ tokenVersion: 0 })
    seedDb({ users: [user] })

    const staleToken = authService.issueToken(user)

    // Simulate a forced session reset (role/email change, revoke cleanup, ...).
    const liveUser = getData().users.find((u) => u.id === user.id)!
    bumpTokenVersion(liveUser)

    const mockHandler = jest.fn()
    const wrapped = withAuth(mockHandler)
    const req = createMockRequest({ method: 'GET', headers: { authorization: `Bearer ${staleToken}` } })
    const res = createMockResponse()
    await wrapped(req, res)

    expect(mockHandler).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Session expired' })
  })

  it('accepts a freshly issued token after the bump (matching versions)', async () => {
    const user = makeUser({ tokenVersion: 1 })
    seedDb({ users: [user] })

    const freshToken = authService.issueToken(user)
    const mockHandler = jest.fn()
    const wrapped = withAuth(mockHandler)
    const req = createMockRequest({ method: 'GET', headers: { authorization: `Bearer ${freshToken}` } })
    const res = createMockResponse()
    await wrapped(req, res)

    expect(mockHandler).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('still accepts a legacy full-user token (no tokenVersion) against a legacy user (no tokenVersion)', async () => {
    const legacyUser = makeUser()
    delete legacyUser.tokenVersion
    seedDb({ users: [legacyUser] })

    // Legacy tokens embedded the full user object and never carried tokenVersion.
    const legacyToken = jwt.sign(legacyUser, JWT_SECRET, { expiresIn: '7d' })
    const mockHandler = jest.fn()
    const wrapped = withAuth(mockHandler)
    const req = createMockRequest({ method: 'GET', headers: { authorization: `Bearer ${legacyToken}` } })
    const res = createMockResponse()
    await wrapped(req, res)

    expect(mockHandler).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })
})

describe('Auth audit log retention pruning', () => {
  it('prunes auth-attempt entries older than the retention horizon on the next recordAuthAttempt', async () => {
    const retentionMs = env.AUTH_AUDIT_RETENTION_HOURS * 60 * 60 * 1000
    const staleTimestamp = new Date(Date.now() - retentionMs - 60_000).toISOString()
    const freshTimestamp = new Date().toISOString()

    const staleEntry: IAuthAuditEntry = {
      id: randomUUID(),
      action: 'login.failure',
      actorId: null,
      emailHint: 'o•••@example.com',
      emailKey: 'stale-key',
      reason: 'unknown_user',
      timestamp: staleTimestamp,
    }
    const freshEntry: IAuthAuditEntry = {
      id: randomUUID(),
      action: 'login.failure',
      actorId: null,
      emailHint: 'f•••@example.com',
      emailKey: 'fresh-key',
      reason: 'unknown_user',
      timestamp: freshTimestamp,
    }
    getData().auditLogs.push(staleEntry, freshEntry)

    await recordAuthAttempt({ action: 'login.failure', actorId: null, email: 'trigger@example.com', reason: 'unknown_user' })

    const ids = getData().auditLogs.map((entry) => entry.id)
    expect(ids).not.toContain(staleEntry.id)
    expect(ids).toContain(freshEntry.id)
  })

  it('never prunes non-auth audit entries (gift-pool contributions or admin actions), no matter how old', async () => {
    const retentionMs = env.AUTH_AUDIT_RETENTION_HOURS * 60 * 60 * 1000
    const ancientTimestamp = new Date(Date.now() - retentionMs * 10).toISOString()

    const giftPoolEntry: AuditLogEntry = {
      id: randomUUID(),
      action: 'contribution.approved',
      actorId: randomUUID(),
      contributionId: randomUUID(),
      poolId: randomUUID(),
      timestamp: ancientTimestamp,
    }
    const adminActionEntry: IAdminAuditEntry = {
      id: randomUUID(),
      action: 'user.access_revoked',
      actorId: randomUUID(),
      targetUserId: randomUUID(),
      timestamp: ancientTimestamp,
    }
    getData().auditLogs.push(giftPoolEntry, adminActionEntry)

    await recordAuthAttempt({ action: 'login.failure', actorId: null, email: 'trigger-2@example.com', reason: 'unknown_user' })

    const ids = getData().auditLogs.map((entry) => entry.id)
    expect(ids).toContain(giftPoolEntry.id)
    expect(ids).toContain(adminActionEntry.id)
  })
})

describe('Revoking and reinstating approved-user access', () => {
  const sign = (user: IUser) => jwt.sign({ id: user.id, tokenVersion: user.tokenVersion ?? 0 }, JWT_SECRET, { expiresIn: '7d' })

  function adminAuditEntries(action: 'user.access_revoked' | 'user.access_reinstated'): IAdminAuditEntry[] {
    return (getData().auditLogs as unknown as IAdminAuditEntry[]).filter((entry) => entry.action === action)
  }

  it('lets an admin revoke an approved user, bumps tokenVersion, and writes a user.access_revoked entry', async () => {
    const admin = makeUser({ role: 'admin' })
    const member = makeUser()
    const originalTokenVersion = member.tokenVersion ?? 0
    seedDb({ users: [admin, member] })

    const userByIdHandler = require('../api/users/[id]').default
    const req = createMockRequest({
      method: 'PATCH',
      headers: { authorization: `Bearer ${sign(admin)}` },
      query: { id: member.id },
      body: { accessStatus: 'revoked' },
    })
    const res = createMockResponse()
    await userByIdHandler(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    const liveMember = getData().users.find((u) => u.id === member.id)!
    expect(liveMember.accessStatus).toBe('revoked')
    expect(liveMember.tokenVersion).toBe(originalTokenVersion + 1)

    const entries = adminAuditEntries('user.access_revoked')
    expect(entries).toHaveLength(1)
    expect(entries[0].actorId).toBe(admin.id)
    expect(entries[0].targetUserId).toBe(member.id)
  })

  it('rejects a token issued before the revoke (401 via withAuth) and blocks login (403)', async () => {
    const admin = makeUser({ role: 'admin' })
    const member = makeUser()
    seedDb({ users: [admin, member] })

    const staleToken = authService.issueToken(member)

    const userByIdHandler = require('../api/users/[id]').default
    await userByIdHandler(
      createMockRequest({
        method: 'PATCH',
        headers: { authorization: `Bearer ${sign(admin)}` },
        query: { id: member.id },
        body: { accessStatus: 'revoked' },
      }),
      createMockResponse(),
    )

    const mockHandler = jest.fn()
    const wrapped = withAuth(mockHandler)
    const authRes = createMockResponse()
    await wrapped(
      createMockRequest({ method: 'GET', headers: { authorization: `Bearer ${staleToken}` } }),
      authRes,
    )
    expect(mockHandler).not.toHaveBeenCalled()
    expect(authRes.status).toHaveBeenCalledWith(401)

    const loginHandler = require('../api/auth/login').default
    const loginRes = createMockResponse()
    await loginHandler(createMockRequest({ method: 'POST', body: { email: member.email } }), loginRes)
    expect(loginRes.status).toHaveBeenCalledWith(403)
  })

  it('lets an admin reinstate a revoked user, restoring login access, and writes a user.access_reinstated entry', async () => {
    const admin = makeUser({ role: 'admin' })
    const revokedUser = makeUser({ accessStatus: 'revoked' })
    seedDb({ users: [admin, revokedUser] })

    const userByIdHandler = require('../api/users/[id]').default
    const res = createMockResponse()
    await userByIdHandler(
      createMockRequest({
        method: 'PATCH',
        headers: { authorization: `Bearer ${sign(admin)}` },
        query: { id: revokedUser.id },
        body: { accessStatus: 'approved' },
      }),
      res,
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(getData().users.find((u) => u.id === revokedUser.id)?.accessStatus).toBe('approved')
    expect(adminAuditEntries('user.access_reinstated')).toHaveLength(1)

    const loginHandler = require('../api/auth/login').default
    const loginRes = createMockResponse()
    await loginHandler(createMockRequest({ method: 'POST', body: { email: revokedUser.email } }), loginRes)
    expect(loginRes.status).toHaveBeenCalledWith(200)
  })

  it('returns 403 when a non-admin (the account owner) tries to change their own accessStatus', async () => {
    const member = makeUser()
    seedDb({ users: [member] })

    const userByIdHandler = require('../api/users/[id]').default
    const res = createMockResponse()
    await userByIdHandler(
      createMockRequest({
        method: 'PATCH',
        headers: { authorization: `Bearer ${sign(member)}` },
        query: { id: member.id },
        body: { accessStatus: 'revoked' },
      }),
      res,
    )

    expect(res.status).toHaveBeenCalledWith(403)
    expect(getData().users.find((u) => u.id === member.id)?.accessStatus).toBe('approved')
  })

  it('refuses self-revoke when other approved admins exist', async () => {
    const admin = makeUser({ role: 'admin' })
    const otherAdmin = makeUser({ role: 'admin' })
    seedDb({ users: [admin, otherAdmin] })

    const userByIdHandler = require('../api/users/[id]').default
    const res = createMockResponse()
    await userByIdHandler(
      createMockRequest({
        method: 'PATCH',
        headers: { authorization: `Bearer ${sign(admin)}` },
        query: { id: admin.id },
        body: { accessStatus: 'revoked' },
      }),
      res,
    )

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'You cannot change your own access status' })
    expect(getData().users.find((u) => u.id === admin.id)?.accessStatus).toBe('approved')
  })

  it('refuses to revoke the last approved admin', async () => {
    const soleAdmin = makeUser({ role: 'admin' })
    seedDb({ users: [soleAdmin] })

    const userByIdHandler = require('../api/users/[id]').default
    const res = createMockResponse()
    await userByIdHandler(
      createMockRequest({
        method: 'PATCH',
        headers: { authorization: `Bearer ${sign(soleAdmin)}` },
        query: { id: soleAdmin.id },
        body: { accessStatus: 'revoked' },
      }),
      res,
    )

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Cannot revoke the last approved admin' })
    expect(getData().users.find((u) => u.id === soleAdmin.id)?.accessStatus).toBe('approved')
  })

  it('leaves the pending-access-request rejection flow untouched', async () => {
    const admin = makeUser({ role: 'admin' })
    const pendingRequest = {
      id: randomUUID(),
      name: 'Pending Person',
      email: 'pending@example.com',
      status: 'pending' as const,
      requestedAt: new Date().toISOString(),
    }
    seedDb({ users: [admin], accessRequests: [pendingRequest] })

    const revokeAccessHandler = require('../api/auth/revoke-access').default
    const res = createMockResponse()
    await revokeAccessHandler(
      createMockRequest({
        method: 'POST',
        headers: { authorization: `Bearer ${sign(admin)}` },
        body: { accessRequestId: pendingRequest.id },
      }),
      res,
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(getData().accessRequests.find((r) => r.id === pendingRequest.id)).toBeUndefined()
    expect(getData().accessRequestHistory.find((r) => r.id === pendingRequest.id)?.status).toBe('rejected')
  })
})
