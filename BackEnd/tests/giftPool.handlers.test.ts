import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import type { IUser } from '../src/interfaces/user.interface'
import { getData } from '../src/config/db'
import { resetDb, seedDb } from './helpers/db.helper'

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-testing-purposes-only'

const mockAdmin: IUser = {
  id: '22222222-2222-2222-2222-222222222222',
  name: 'Admin',
  email: 'admin@example.com',
  role: 'admin',
  accessStatus: 'approved',
  capabilities: ['*'],
  notificationPrefs: { level: 'all', channels: ['email'] },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const mockMember: IUser = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Member',
  email: 'member@example.com',
  role: 'member',
  accessStatus: 'approved',
  capabilities: [],
  notificationPrefs: { level: 'all', channels: ['email'] },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const req = (overrides: any = {}) => ({
  method: 'GET',
  headers: {},
  query: {},
  body: {},
  ...overrides,
}) as any

const res = () => {
  const response: any = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() }
  return response as any
}

const adminToken = () => jwt.sign(mockAdmin, JWT_SECRET, { expiresIn: '1h' })
const memberToken = () => jwt.sign(mockMember, JWT_SECRET, { expiresIn: '1h' })
const authHeader = (token: string) => ({ authorization: `Bearer ${token}` })

describe('Gift Pool Handlers', () => {
  beforeEach(() => resetDb())

  describe('GET /api/gift-pools', () => {
    it('requires admin', async () => {
      const handler = require('../api/gift-pools/index').default
      seedDb({ users: [mockMember] })
      const response = res()
      await handler(req({ method: 'GET', headers: authHeader(memberToken()) }), response)
      expect(response.status).toHaveBeenCalledWith(403)
    })

    it('returns list for admin', async () => {
      const handler = require('../api/gift-pools/index').default
      seedDb({ users: [mockAdmin] })
      const response = res()
      await handler(req({ method: 'GET', headers: authHeader(adminToken()) }), response)
      expect(response.status).toHaveBeenCalledWith(200)
    })
  })

  describe('POST /api/gift-pools', () => {
    it('requires admin', async () => {
      const handler = require('../api/gift-pools/index').default
      seedDb({ users: [mockMember] })
      const response = res()
      await handler(
        req({
          method: 'POST',
          headers: authHeader(memberToken()),
          body: { eventId: randomUUID(), birthdayUserId: randomUUID() },
        }),
        response,
      )
      expect(response.status).toHaveBeenCalledWith(403)
    })

    it('creates pool as admin', async () => {
      const handler = require('../api/gift-pools/index').default
      seedDb({ users: [mockAdmin] })
      const response = res()
      await handler(
        req({
          method: 'POST',
          headers: authHeader(adminToken()),
          body: { eventId: randomUUID(), birthdayUserId: randomUUID() },
        }),
        response,
      )
      expect(response.status).toHaveBeenCalledWith(201)
      expect(getData().giftPools).toHaveLength(1)
    })

    it('returns 400 for missing required fields', async () => {
      const handler = require('../api/gift-pools/index').default
      seedDb({ users: [mockAdmin] })
      const response = res()
      await handler(
        req({
          method: 'POST',
          headers: authHeader(adminToken()),
          body: { eventId: randomUUID() },
        }),
        response,
      )
      expect(response.status).toHaveBeenCalledWith(400)
    })
  })

  describe('POST /api/gift-pools/:id/contribute', () => {
    it('records contribution as member', async () => {
      const { giftPoolService } = require('../src/services/giftPool.service')
      seedDb({ users: [mockMember] })
      const pool = await giftPoolService.createPool({
        eventId: randomUUID(),
        birthdayUserId: randomUUID(),
        createdBy: mockAdmin.id,
      })

      const handler = require('../api/gift-pools/[id]/contribute').default
      const response = res()
      await handler(
        req({
          method: 'POST',
          headers: authHeader(memberToken()),
          query: { id: pool.id },
          body: { onBehalfOf: [], amount: 25 },
        }),
        response,
      )
      expect(response.status).toHaveBeenCalledWith(201)
      expect(getData().giftContributions).toHaveLength(1)
    })

    it('returns 400 for amount <= 0', async () => {
      const { giftPoolService } = require('../src/services/giftPool.service')
      seedDb({ users: [mockMember] })
      const pool = await giftPoolService.createPool({
        eventId: randomUUID(),
        birthdayUserId: randomUUID(),
        createdBy: mockAdmin.id,
      })

      const handler = require('../api/gift-pools/[id]/contribute').default
      const response = res()
      await handler(
        req({
          method: 'POST',
          headers: authHeader(memberToken()),
          query: { id: pool.id },
          body: { onBehalfOf: [], amount: -5 },
        }),
        response,
      )
      expect(response.status).toHaveBeenCalledWith(400)
    })

    it('returns 400 when missing pool id', async () => {
      const handler = require('../api/gift-pools/[id]/contribute').default
      seedDb({ users: [mockMember] })
      const response = res()
      await handler(
        req({
          method: 'POST',
          headers: authHeader(memberToken()),
          query: {},
          body: { onBehalfOf: [], amount: 10 },
        }),
        response,
      )
      expect(response.status).toHaveBeenCalledWith(400)
    })
  })

  describe('GET /api/gift-pools/by-event/:eventId', () => {
    it('returns null data when no pool exists', async () => {
      const handler = require('../api/gift-pools/by-event/[eventId]').default
      seedDb({ users: [mockMember] })
      const response = res()
      await handler(
        req({
          method: 'GET',
          headers: authHeader(memberToken()),
          query: { eventId: randomUUID() },
        }),
        response,
      )
      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ data: null }))
    })

    it('returns pool status when pool exists', async () => {
      const { giftPoolService } = require('../src/services/giftPool.service')
      const eventId = randomUUID()
      seedDb({ users: [mockMember] })
      await giftPoolService.createPool({ eventId, birthdayUserId: randomUUID(), createdBy: mockAdmin.id })

      const handler = require('../api/gift-pools/by-event/[eventId]').default
      const response = res()
      await handler(
        req({
          method: 'GET',
          headers: authHeader(memberToken()),
          query: { eventId },
        }),
        response,
      )
      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ pool: expect.any(Object) }) }),
      )
    })
  })

  describe('PATCH /api/gift-pools/:id (close pool)', () => {
    it('admin can close a pool', async () => {
      const { giftPoolService } = require('../src/services/giftPool.service')
      seedDb({ users: [mockAdmin] })
      const pool = await giftPoolService.createPool({
        eventId: randomUUID(),
        birthdayUserId: randomUUID(),
        createdBy: mockAdmin.id,
      })

      const handler = require('../api/gift-pools/[id]').default
      const response = res()
      await handler(
        req({
          method: 'PATCH',
          headers: authHeader(adminToken()),
          query: { id: pool.id },
        }),
        response,
      )
      expect(response.status).toHaveBeenCalledWith(200)
    })

    it('member cannot close a pool', async () => {
      const { giftPoolService } = require('../src/services/giftPool.service')
      seedDb({ users: [mockMember] })
      const pool = await giftPoolService.createPool({
        eventId: randomUUID(),
        birthdayUserId: randomUUID(),
        createdBy: mockAdmin.id,
      })

      const handler = require('../api/gift-pools/[id]').default
      const response = res()
      await handler(
        req({
          method: 'PATCH',
          headers: authHeader(memberToken()),
          query: { id: pool.id },
        }),
        response,
      )
      expect(response.status).toHaveBeenCalledWith(403)
    })
  })

  describe('POST /api/gift-pools/:id/confirm-received', () => {
    it('requires admin', async () => {
      const { giftPoolService } = require('../src/services/giftPool.service')
      seedDb({ users: [mockMember] })
      const pool = await giftPoolService.createPool({
        eventId: randomUUID(),
        birthdayUserId: randomUUID(),
        createdBy: mockAdmin.id,
      })

      const handler = require('../api/gift-pools/[id]/confirm-received').default
      const response = res()
      await handler(
        req({
          method: 'POST',
          headers: authHeader(memberToken()),
          query: { id: pool.id },
          body: {},
        }),
        response,
      )
      expect(response.status).toHaveBeenCalledWith(403)
    })

    it('admin confirms receipt with optional description', async () => {
      const { giftPoolService } = require('../src/services/giftPool.service')
      seedDb({ users: [mockAdmin] })
      const pool = await giftPoolService.createPool({
        eventId: randomUUID(),
        birthdayUserId: randomUUID(),
        createdBy: mockAdmin.id,
      })

      const handler = require('../api/gift-pools/[id]/confirm-received').default
      const response = res()
      await handler(
        req({
          method: 'POST',
          headers: authHeader(adminToken()),
          query: { id: pool.id },
          body: { giftDescription: 'Cash in card' },
        }),
        response,
      )
      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'closed',
            giftDescription: 'Cash in card',
            receivedAt: expect.any(String),
          }),
        }),
      )
    })

    it('returns 400 when pool id is missing', async () => {
      const handler = require('../api/gift-pools/[id]/confirm-received').default
      seedDb({ users: [mockAdmin] })
      const response = res()
      await handler(
        req({
          method: 'POST',
          headers: authHeader(adminToken()),
          query: {},
          body: {},
        }),
        response,
      )
      expect(response.status).toHaveBeenCalledWith(400)
    })

    it('returns 400 when pool is already confirmed', async () => {
      const { giftPoolService } = require('../src/services/giftPool.service')
      seedDb({ users: [mockAdmin] })
      const pool = await giftPoolService.createPool({
        eventId: randomUUID(),
        birthdayUserId: randomUUID(),
        createdBy: mockAdmin.id,
      })
      await giftPoolService.confirmReceived(pool.id, mockAdmin.id)

      const handler = require('../api/gift-pools/[id]/confirm-received').default
      const response = res()
      await handler(
        req({
          method: 'POST',
          headers: authHeader(adminToken()),
          query: { id: pool.id },
          body: {},
        }),
        response,
      )
      expect(response.status).toHaveBeenCalledWith(400)
    })
  })

  describe('Admin record contribution', () => {
    it('requires admin', async () => {
      const { giftPoolService } = require('../src/services/giftPool.service')
      seedDb({ users: [mockMember] })
      const pool = await giftPoolService.createPool({ eventId: randomUUID(), birthdayUserId: randomUUID(), createdBy: mockAdmin.id })

      const handler = require('../api/gift-pools/[id]/record-contribution').default
      const response = res()
      await handler(
        req({ method: 'POST', headers: authHeader(memberToken()), query: { id: pool.id }, body: { paidBy: mockMember.id, amount: 50 } }),
        response,
      )
      expect(response.status).toHaveBeenCalledWith(403)
    })

    it('records and auto-confirms contribution', async () => {
      const { giftPoolService } = require('../src/services/giftPool.service')
      seedDb({ users: [mockAdmin, mockMember] })
      const pool = await giftPoolService.createPool({ eventId: randomUUID(), birthdayUserId: randomUUID(), createdBy: mockAdmin.id })

      const handler = require('../api/gift-pools/[id]/record-contribution').default
      const response = res()
      await handler(
        req({ method: 'POST', headers: authHeader(adminToken()), query: { id: pool.id }, body: { paidBy: mockMember.id, amount: 75 } }),
        response,
      )
      expect(response.status).toHaveBeenCalledWith(201)

      const db = getData()
      expect(db.giftContributions).toHaveLength(1)
      const contribution = db.giftContributions[0]
      expect(contribution.status).toBe('CONFIRMED')
      expect(contribution.recordedBy).toBe(mockAdmin.id)
      expect(contribution.verifiedBy).toBe(mockAdmin.id)
      expect(contribution.verifiedAt).toBeDefined()
      expect((db as any).auditLogs).toHaveLength(1)
      expect((db as any).auditLogs[0].action).toBe('contribution.recorded')
    })

    it('rejects birthday person as payer', async () => {
      const { giftPoolService } = require('../src/services/giftPool.service')
      const birthdayUserId = mockMember.id
      seedDb({ users: [mockAdmin, mockMember] })
      const pool = await giftPoolService.createPool({ eventId: randomUUID(), birthdayUserId, createdBy: mockAdmin.id })

      const handler = require('../api/gift-pools/[id]/record-contribution').default
      const response = res()
      await handler(
        req({ method: 'POST', headers: authHeader(adminToken()), query: { id: pool.id }, body: { paidBy: birthdayUserId, amount: 50 } }),
        response,
      )
      expect(response.status).toHaveBeenCalledWith(400)
    })

    it('rejects unknown or unapproved payer', async () => {
      const { giftPoolService } = require('../src/services/giftPool.service')
      seedDb({ users: [mockAdmin] })
      const pool = await giftPoolService.createPool({ eventId: randomUUID(), birthdayUserId: randomUUID(), createdBy: mockAdmin.id })

      const handler = require('../api/gift-pools/[id]/record-contribution').default
      const response = res()
      await handler(
        req({ method: 'POST', headers: authHeader(adminToken()), query: { id: pool.id }, body: { paidBy: randomUUID(), amount: 50 } }),
        response,
      )
      expect(response.status).toHaveBeenCalledWith(400)
    })
  })

  describe('Admin verification endpoints', () => {
    it('GET pending contributions requires admin', async () => {
      const handler = require('../api/gift-pools/[id]/pending-contributions').default
      seedDb({ users: [mockMember] })
      const response = res()
      await handler(
        req({ method: 'GET', headers: authHeader(memberToken()), query: { id: randomUUID() } }),
        response,
      )
      expect(response.status).toHaveBeenCalledWith(403)
    })

    it('GET pending contributions returns items for admin', async () => {
      const { giftPoolService } = require('../src/services/giftPool.service')
      seedDb({ users: [mockAdmin] })
      const pool = await giftPoolService.createPool({ eventId: randomUUID(), birthdayUserId: randomUUID(), createdBy: mockAdmin.id })
      const c = await giftPoolService.addContribution({ poolId: pool.id, paidBy: mockMember.id, onBehalfOf: [], amount: 10 })

      const handler = require('../api/gift-pools/[id]/pending-contributions').default
      const response = res()
      await handler(
        req({ method: 'GET', headers: authHeader(adminToken()), query: { id: pool.id } }),
        response,
      )
      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ data: expect.arrayContaining([expect.objectContaining({ id: c.id })]) }))
    })

    it('POST approve contribution requires admin', async () => {
      const handler = require('../api/gift-pools/[id]/approve-contribution').default
      seedDb({ users: [mockMember] })
      const response = res()
      await handler(
        req({ method: 'POST', headers: authHeader(memberToken()), query: { id: randomUUID() }, body: { contributionId: randomUUID() } }),
        response,
      )
      expect(response.status).toHaveBeenCalledWith(403)
    })

    it('POST approve/reject contribution flow as admin', async () => {
      const { giftPoolService } = require('../src/services/giftPool.service')
      seedDb({ users: [mockAdmin, mockMember] })
      const pool = await giftPoolService.createPool({ eventId: randomUUID(), birthdayUserId: randomUUID(), createdBy: mockAdmin.id })
      const contribution = await giftPoolService.addContribution({ poolId: pool.id, paidBy: mockMember.id, onBehalfOf: [], amount: 15 })

      const approveHandler = require('../api/gift-pools/[id]/approve-contribution').default
      const approveRes = res()
      await approveHandler(
        req({ method: 'POST', headers: authHeader(adminToken()), query: { id: pool.id }, body: { contributionId: contribution.id } }),
        approveRes,
      )
      expect(approveRes.status).toHaveBeenCalledWith(200)
      // verify state
      const updated = await giftPoolService.getContributionById(contribution.id)
      expect(updated?.status).toBe('CONFIRMED')
      expect(getData().auditLogs).toHaveLength(1)

      // create another contribution and reject
      const contribution2 = await giftPoolService.addContribution({ poolId: pool.id, paidBy: mockMember.id, onBehalfOf: [], amount: 5 })
      const rejectHandler = require('../api/gift-pools/[id]/reject-contribution').default
      const rejectRes = res()
      await rejectHandler(
        req({ method: 'POST', headers: authHeader(adminToken()), query: { id: pool.id }, body: { contributionId: contribution2.id, reason: 'Invalid reference' } }),
        rejectRes,
      )
      expect(rejectRes.status).toHaveBeenCalledWith(200)
      const updated2 = await giftPoolService.getContributionById(contribution2.id)
      expect(updated2?.status).toBe('REJECTED')
      expect((getData() as any).auditLogs.length).toBeGreaterThanOrEqual(2)
    })
  })
})
