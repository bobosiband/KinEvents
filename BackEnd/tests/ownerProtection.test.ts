import { randomUUID } from 'crypto'

import { OwnerPolicy, OwnerProtectedError } from '../src/auth/OwnerPolicy'
import { authService } from '../src/services/auth.service'
import { resetDb } from './helpers/db.helper'
import { getData } from '../src/config/db'
import promoteHandler from '../api/users/promote'
import userByIdHandler from '../api/users/[id]'
import type { IUser } from '../src/interfaces/user.interface'
import jwt from 'jsonwebtoken'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const OWNER_EMAIL = 'owner@kinevents.test'

function makeUser(overrides: Partial<IUser> = {}): IUser {
  return {
    id: randomUUID(),
    name: 'User',
    email: 'user@example.com',
    role: 'admin',
    accessStatus: 'approved',
    capabilities: [],
    notificationPrefs: { level: 'all', channels: ['email'] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

function makeRes() {
  const res: Partial<VercelResponse> & { statusCode: number; body: unknown } = {
    statusCode: 0,
    body: null,
    status(code: number) {
      this.statusCode = code
      return this as VercelResponse
    },
    json(payload: unknown) {
      this.body = payload
      return this as VercelResponse
    },
  }
  return res as VercelResponse & { statusCode: number; body: any }
}

function tokenFor(user: IUser): string {
  return jwt.sign(user, process.env.JWT_SECRET || 'test-secret-key-for-testing-purposes-only')
}

describe('OwnerPolicy', () => {
  const previousOwnerEmail = process.env.OWNER_EMAIL

  beforeEach(() => {
    process.env.OWNER_EMAIL = OWNER_EMAIL
    resetDb()
  })

  afterAll(() => {
    if (previousOwnerEmail) process.env.OWNER_EMAIL = previousOwnerEmail
    else delete process.env.OWNER_EMAIL
  })

  describe('identity', () => {
    it('recognises the owner by email (case/whitespace tolerant)', () => {
      expect(OwnerPolicy.isOwner({ email: OWNER_EMAIL })).toBe(true)
      expect(OwnerPolicy.isOwner({ email: OWNER_EMAIL.toUpperCase() })).toBe(true)
      expect(OwnerPolicy.isOwner({ email: `  ${OWNER_EMAIL}  ` })).toBe(true)
    })

    it('rejects others', () => {
      expect(OwnerPolicy.isOwner({ email: 'someone-else@example.com' })).toBe(false)
    })

    it('returns false when OWNER_EMAIL is unset', () => {
      delete process.env.OWNER_EMAIL
      expect(OwnerPolicy.isOwner({ email: 'owner@kinevents.test' })).toBe(false)
      process.env.OWNER_EMAIL = OWNER_EMAIL
    })
  })

  describe('enforceNotTargetingOwner', () => {
    it('throws OwnerProtectedError for every protected action against the owner', () => {
      const owner = { email: OWNER_EMAIL }
      for (const action of ['demote', 'lock', 'delete', 'revoke'] as const) {
        expect(() => OwnerPolicy.enforceNotTargetingOwner(owner, action)).toThrow(OwnerProtectedError)
      }
    })

    it('is a no-op for non-owners', () => {
      const user = { email: 'someone@example.com' }
      for (const action of ['demote', 'lock', 'delete', 'revoke'] as const) {
        expect(() => OwnerPolicy.enforceNotTargetingOwner(user, action)).not.toThrow()
      }
    })
  })

  describe('promote handler', () => {
    it('rejects demoting the owner from admin', async () => {
      const owner = makeUser({ email: OWNER_EMAIL, role: 'admin' })
      const other = makeUser({ email: 'admin2@example.com', role: 'admin' })
      getData().users.push(owner, other)

      const req = {
        method: 'POST',
        headers: { authorization: `Bearer ${tokenFor(other)}` },
        body: { userId: owner.id, role: 'member' },
        query: {},
      } as unknown as VercelRequest
      const res = makeRes()
      await promoteHandler(req, res)

      expect(res.statusCode).toBe(400)
      expect(res.body.success).toBe(false)
      expect(res.body.message).toMatch(/owner/i)
      const stored = getData().users.find((u) => u.id === owner.id)
      expect(stored?.role).toBe('admin')
    })

    it('allows promoting a non-owner', async () => {
      const otherAdmin = makeUser({ email: 'admin2@example.com', role: 'admin' })
      const target = makeUser({ email: 'target@example.com', role: 'member' })
      getData().users.push(otherAdmin, target)

      const req = {
        method: 'POST',
        headers: { authorization: `Bearer ${tokenFor(otherAdmin)}` },
        body: { userId: target.id, role: 'manager' },
        query: {},
      } as unknown as VercelRequest
      const res = makeRes()
      await promoteHandler(req, res)

      expect(res.statusCode).toBe(200)
      const stored = getData().users.find((u) => u.id === target.id)
      expect(stored?.role).toBe('manager')
    })
  })

  describe('user DELETE handler', () => {
    it('refuses to delete the owner', async () => {
      const owner = makeUser({ email: OWNER_EMAIL, role: 'admin' })
      const other = makeUser({ email: 'admin2@example.com', role: 'admin' })
      getData().users.push(owner, other)

      const req = {
        method: 'DELETE',
        headers: { authorization: `Bearer ${tokenFor(other)}` },
        query: { id: owner.id },
        body: {},
      } as unknown as VercelRequest
      const res = makeRes()
      await userByIdHandler(req, res)

      expect(res.statusCode).toBe(400)
      expect(res.body.message).toMatch(/owner/i)
      expect(getData().users.find((u) => u.id === owner.id)).toBeDefined()
    })
  })

  describe('user PATCH (accessStatus=revoked)', () => {
    it('refuses to revoke the owner', async () => {
      const owner = makeUser({ email: OWNER_EMAIL, role: 'admin' })
      const other = makeUser({ email: 'admin2@example.com', role: 'admin' })
      getData().users.push(owner, other)

      const req = {
        method: 'PATCH',
        headers: { authorization: `Bearer ${tokenFor(other)}` },
        query: { id: owner.id },
        body: { accessStatus: 'revoked' },
      } as unknown as VercelRequest
      const res = makeRes()
      await userByIdHandler(req, res)

      expect(res.statusCode).toBe(400)
      expect(res.body.message).toMatch(/owner/i)
    })
  })

  describe('authService.revokeAccess', () => {
    it('refuses to revoke an access request belonging to the owner email', async () => {
      const accessRequestId = randomUUID()
      getData().accessRequests.push({
        id: accessRequestId,
        name: 'Owner',
        email: OWNER_EMAIL,
        message: '',
        status: 'pending',
        requestedAt: new Date().toISOString(),
      } as never)

      await expect(authService.revokeAccess(accessRequestId)).rejects.toBeInstanceOf(OwnerProtectedError)
    })
  })
})
