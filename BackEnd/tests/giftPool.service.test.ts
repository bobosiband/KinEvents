import { randomUUID } from 'crypto'
import { giftPoolService } from '../src/services/giftPool.service'
import { getData } from '../src/config/db'
import { resetDb } from './helpers/db.helper'

const makeUser = (overrides: Partial<ReturnType<typeof baseUser>> = {}) => ({
  ...baseUser(),
  ...overrides,
})

function baseUser() {
  return {
    id: randomUUID(),
    name: 'Test User',
    email: `${randomUUID()}@test.com`,
    role: 'member' as const,
    accessStatus: 'approved' as const,
    capabilities: [],
    notificationPrefs: { level: 'all' as const, channels: ['email' as const] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

describe('GiftPoolService', () => {
  beforeEach(() => resetDb())

  describe('createPool', () => {
    it('creates a pool successfully', async () => {
      const pool = await giftPoolService.createPool({
        eventId: randomUUID(),
        birthdayUserId: randomUUID(),
        createdBy: randomUUID(),
        currency: 'GBP',
      })
      expect(pool.id).toBeTruthy()
      expect(pool.status).toBe('open')
      expect(pool.currency).toBe('GBP')
      expect(getData().giftPools).toHaveLength(1)
    })

    it('throws if a pool already exists for the same event', async () => {
      const eventId = randomUUID()
      await giftPoolService.createPool({ eventId, birthdayUserId: randomUUID(), createdBy: randomUUID() })
      await expect(
        giftPoolService.createPool({ eventId, birthdayUserId: randomUUID(), createdBy: randomUUID() })
      ).rejects.toThrow('already exists')
    })

    it('defaults currency to GBP when not specified', async () => {
      const pool = await giftPoolService.createPool({
        eventId: randomUUID(), birthdayUserId: randomUUID(), createdBy: randomUUID(),
      })
      expect(pool.currency).toBe('GBP')
    })
  })

  describe('addContribution', () => {
    it('always includes paidBy in onBehalfOf', async () => {
      const pool = await giftPoolService.createPool({
        eventId: randomUUID(), birthdayUserId: randomUUID(), createdBy: randomUUID(),
      })
      const paidBy = randomUUID()
      const other = randomUUID()

      const contribution = await giftPoolService.addContribution({
        poolId: pool.id, paidBy, onBehalfOf: [other], amount: 50,
      })

      expect(contribution.onBehalfOf).toContain(paidBy)
      expect(contribution.onBehalfOf).toContain(other)
      expect(contribution.amount).toBe(50)
    })

    it('deduplicates onBehalfOf when paidBy already present', async () => {
      const pool = await giftPoolService.createPool({
        eventId: randomUUID(), birthdayUserId: randomUUID(), createdBy: randomUUID(),
      })
      const paidBy = randomUUID()

      const contribution = await giftPoolService.addContribution({
        poolId: pool.id, paidBy, onBehalfOf: [paidBy], amount: 20,
      })

      expect(contribution.onBehalfOf.filter(id => id === paidBy)).toHaveLength(1)
    })

    it('throws for a closed pool', async () => {
      const pool = await giftPoolService.createPool({
        eventId: randomUUID(), birthdayUserId: randomUUID(), createdBy: randomUUID(),
      })
      await giftPoolService.closePool(pool.id)
      await expect(
        giftPoolService.addContribution({ poolId: pool.id, paidBy: randomUUID(), onBehalfOf: [], amount: 10 })
      ).rejects.toThrow('closed')
    })

    it('throws for amount <= 0', async () => {
      const pool = await giftPoolService.createPool({
        eventId: randomUUID(), birthdayUserId: randomUUID(), createdBy: randomUUID(),
      })
      await expect(
        giftPoolService.addContribution({ poolId: pool.id, paidBy: randomUUID(), onBehalfOf: [], amount: 0 })
      ).rejects.toThrow('greater than zero')
    })

    it('throws when birthday person tries to contribute', async () => {
      const birthdayUserId = randomUUID()
      const pool = await giftPoolService.createPool({
        eventId: randomUUID(), birthdayUserId, createdBy: randomUUID(),
      })
      await expect(
        giftPoolService.addContribution({ poolId: pool.id, paidBy: birthdayUserId, onBehalfOf: [], amount: 10 })
      ).rejects.toThrow('birthday person')
    })

    it('throws when birthday person is in onBehalfOf', async () => {
      const birthdayUserId = randomUUID()
      const pool = await giftPoolService.createPool({
        eventId: randomUUID(), birthdayUserId, createdBy: randomUUID(),
      })
      await expect(
        giftPoolService.addContribution({
          poolId: pool.id, paidBy: randomUUID(), onBehalfOf: [birthdayUserId], amount: 10,
        })
      ).rejects.toThrow('birthday person')
    })
  })

  describe('getPoolStatus', () => {
    it('correctly calculates totalRaised', async () => {
      const pool = await giftPoolService.createPool({
        eventId: randomUUID(), birthdayUserId: randomUUID(), createdBy: randomUUID(),
      })
      await giftPoolService.addContribution({ poolId: pool.id, paidBy: randomUUID(), onBehalfOf: [], amount: 20 })
      await giftPoolService.addContribution({ poolId: pool.id, paidBy: randomUUID(), onBehalfOf: [], amount: 30 })

      const status = await giftPoolService.getPoolStatus(pool.id)
      expect(status.totalRaised).toBe(50)
    })

    it('correctly identifies non-contributors', async () => {
      const birthdayUser = makeUser()
      const member1 = makeUser()
      const member2 = makeUser()
      getData().users.push(birthdayUser, member1, member2)

      const pool = await giftPoolService.createPool({
        eventId: randomUUID(), birthdayUserId: birthdayUser.id, createdBy: member1.id,
      })
      await giftPoolService.addContribution({ poolId: pool.id, paidBy: member1.id, onBehalfOf: [], amount: 20 })

      const status = await giftPoolService.getPoolStatus(pool.id)
      expect(status.contributorIds).toContain(member1.id)
      expect(status.nonContributors.map(u => u.id)).toContain(member2.id)
      expect(status.nonContributors.map(u => u.id)).not.toContain(birthdayUser.id)
    })

    it('marks user as contributed when covered on behalf of by someone else', async () => {
      const birthdayUser = makeUser()
      const payer = makeUser()
      const covered = makeUser()
      getData().users.push(birthdayUser, payer, covered)

      const pool = await giftPoolService.createPool({
        eventId: randomUUID(), birthdayUserId: birthdayUser.id, createdBy: payer.id,
      })
      await giftPoolService.addContribution({ poolId: pool.id, paidBy: payer.id, onBehalfOf: [covered.id], amount: 40 })

      const status = await giftPoolService.getPoolStatus(pool.id)
      expect(status.contributorIds).toContain(covered.id)
      expect(status.nonContributors).toHaveLength(0)
    })

    it('throws for unknown pool id', async () => {
      await expect(giftPoolService.getPoolStatus(randomUUID())).rejects.toThrow('not found')
    })
  })

  describe('closePool', () => {
    it('closes an open pool', async () => {
      const pool = await giftPoolService.createPool({
        eventId: randomUUID(), birthdayUserId: randomUUID(), createdBy: randomUUID(),
      })
      const closed = await giftPoolService.closePool(pool.id)
      expect(closed.status).toBe('closed')
    })

    it('throws for unknown pool id', async () => {
      await expect(giftPoolService.closePool(randomUUID())).rejects.toThrow('not found')
    })
  })

  describe('confirmReceived', () => {
    it('marks the pool as received, sets all fields, and closes it', async () => {
      const pool = await giftPoolService.createPool({
        eventId: randomUUID(),
        birthdayUserId: randomUUID(),
        createdBy: randomUUID(),
      })
      const adminId = randomUUID()

      const confirmed = await giftPoolService.confirmReceived(pool.id, adminId, 'Amazon voucher + card')

      expect(confirmed.receivedAt).toBeTruthy()
      expect(confirmed.confirmedBy).toBe(adminId)
      expect(confirmed.giftDescription).toBe('Amazon voucher + card')
      expect(confirmed.status).toBe('closed')
    })

    it('works without a giftDescription', async () => {
      const pool = await giftPoolService.createPool({
        eventId: randomUUID(),
        birthdayUserId: randomUUID(),
        createdBy: randomUUID(),
      })
      const confirmed = await giftPoolService.confirmReceived(pool.id, randomUUID())
      expect(confirmed.receivedAt).toBeTruthy()
      expect(confirmed.giftDescription).toBeUndefined()
      expect(confirmed.status).toBe('closed')
    })

    it('trims whitespace-only giftDescription and treats it as undefined', async () => {
      const pool = await giftPoolService.createPool({
        eventId: randomUUID(),
        birthdayUserId: randomUUID(),
        createdBy: randomUUID(),
      })
      const confirmed = await giftPoolService.confirmReceived(pool.id, randomUUID(), '   ')
      expect(confirmed.giftDescription).toBeUndefined()
    })

    it('throws if pool is already confirmed', async () => {
      const pool = await giftPoolService.createPool({
        eventId: randomUUID(),
        birthdayUserId: randomUUID(),
        createdBy: randomUUID(),
      })
      await giftPoolService.confirmReceived(pool.id, randomUUID())
      await expect(
        giftPoolService.confirmReceived(pool.id, randomUUID())
      ).rejects.toThrow('already confirmed')
    })

    it('throws for unknown pool id', async () => {
      await expect(
        giftPoolService.confirmReceived(randomUUID(), randomUUID())
      ).rejects.toThrow('not found')
    })
  })

  describe('deleteContribution', () => {
    it('owner can delete their own contribution', async () => {
      const pool = await giftPoolService.createPool({
        eventId: randomUUID(), birthdayUserId: randomUUID(), createdBy: randomUUID(),
      })
      const paidBy = randomUUID()
      const contribution = await giftPoolService.addContribution({ poolId: pool.id, paidBy, onBehalfOf: [], amount: 10 })

      const deleted = await giftPoolService.deleteContribution(contribution.id, paidBy, false)
      expect(deleted).toBe(true)
      expect(getData().giftContributions).toHaveLength(0)
    })

    it('admin can delete any contribution', async () => {
      const pool = await giftPoolService.createPool({
        eventId: randomUUID(), birthdayUserId: randomUUID(), createdBy: randomUUID(),
      })
      const contribution = await giftPoolService.addContribution({ poolId: pool.id, paidBy: randomUUID(), onBehalfOf: [], amount: 10 })

      const deleted = await giftPoolService.deleteContribution(contribution.id, randomUUID(), true)
      expect(deleted).toBe(true)
    })

    it('non-owner non-admin cannot delete', async () => {
      const pool = await giftPoolService.createPool({
        eventId: randomUUID(), birthdayUserId: randomUUID(), createdBy: randomUUID(),
      })
      const contribution = await giftPoolService.addContribution({ poolId: pool.id, paidBy: randomUUID(), onBehalfOf: [], amount: 10 })

      await expect(
        giftPoolService.deleteContribution(contribution.id, randomUUID(), false)
      ).rejects.toThrow('Forbidden')
    })

    it('returns false for unknown contribution id', async () => {
      const deleted = await giftPoolService.deleteContribution(randomUUID(), randomUUID(), true)
      expect(deleted).toBe(false)
    })
  })
})
