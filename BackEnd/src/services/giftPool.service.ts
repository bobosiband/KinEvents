import { randomUUID } from 'crypto'
import { readData, persistData } from '../config/db'
import type { IGiftPool, IGiftContribution } from '../interfaces/gift.interface'
import type { INotification } from '../interfaces/notification.interface'
import type { IUser } from '../interfaces/user.interface'
import { notificationService } from './notification.service'

export interface GiftPoolStatus {
  pool: IGiftPool
  contributions: IGiftContribution[]
  totalRaised: number
  contributorIds: string[]
  nonContributors: IUser[]
}

export class GiftPoolService {

  async createPool(input: {
    eventId: string
    birthdayUserId: string
    targetAmount?: number
    currency?: string
    createdBy: string
  }): Promise<IGiftPool> {
    const db = await readData()

    const existing = db.giftPools.find(p => p.eventId === input.eventId)
    if (existing) throw new Error('A gift pool already exists for this event')

    const pool: IGiftPool = {
      id: randomUUID(),
      eventId: input.eventId,
      birthdayUserId: input.birthdayUserId,
      targetAmount: input.targetAmount,
      currency: input.currency || 'AUD',
      status: 'open',
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    db.giftPools.push(pool)
    await persistData()
    return pool
  }

  async getPoolByEvent(eventId: string): Promise<IGiftPool | null> {
    const db = await readData()
    return db.giftPools.find(p => p.eventId === eventId) ?? null
  }

  async getPoolById(poolId: string): Promise<IGiftPool | null> {
    const db = await readData()
    return db.giftPools.find(p => p.id === poolId) ?? null
  }

  async addContribution(input: {
    poolId: string
    paidBy: string
    onBehalfOf: string[]
    amount: number
    paymentMethod?: string
    reference?: string
    note?: string
  }): Promise<IGiftContribution> {
    const db = await readData()

    const pool = db.giftPools.find(p => p.id === input.poolId)
    if (!pool) throw new Error('Gift pool not found')
    if (pool.status === 'closed') throw new Error('This gift pool is closed')
    if (input.amount <= 0) throw new Error('Amount must be greater than zero')

    // Guard: birthday person must not appear in onBehalfOf
    if (input.onBehalfOf.includes(pool.birthdayUserId) ||
        input.paidBy === pool.birthdayUserId) {
      throw new Error('The birthday person cannot contribute to their own pool')
    }

    // Always include paidBy in onBehalfOf — deduplicate
    const onBehalfOf = [...new Set([input.paidBy, ...input.onBehalfOf])]

    const contribution: IGiftContribution = {
      id: randomUUID(),
      poolId: input.poolId,
      paidBy: input.paidBy,
      onBehalfOf,
      amount: input.amount,
      paymentMethod: input.paymentMethod as IGiftContribution['paymentMethod'],
      reference: input.reference,
      note: input.note,
      createdAt: new Date().toISOString(),
      // mark as pending verification until an admin approves
      status: 'PENDING_VERIFICATION',
      submittedAt: new Date().toISOString(),
    }

    db.giftContributions.push(contribution)
    const poolRef = db.giftPools.find(p => p.id === input.poolId)
    if (poolRef) poolRef.updatedAt = new Date().toISOString()
    await persistData()
    return contribution
  }

  async recordContribution(input: {
    poolId: string
    paidBy: string
    recordedBy: string
    onBehalfOf?: string[]
    amount: number
    paymentMethod?: string
    reference?: string
    note?: string
  }): Promise<IGiftContribution> {
    const db = await readData()

    const pool = db.giftPools.find(p => p.id === input.poolId)
    if (!pool) throw new Error('Gift pool not found')
    if (pool.status === 'closed') throw new Error('This gift pool is closed')
    if (input.amount <= 0) throw new Error('Amount must be greater than zero')

    const payer = db.users.find(u => u.id === input.paidBy)
    if (!payer || payer.accessStatus !== 'approved') {
      throw new Error('Payer must be an approved family member')
    }

    const onBehalfOf = [...new Set([input.paidBy, ...(input.onBehalfOf ?? [])])]
    if (input.paidBy === pool.birthdayUserId || onBehalfOf.includes(pool.birthdayUserId)) {
      throw new Error('The birthday person cannot contribute to their own pool')
    }

    const now = new Date().toISOString()
    const contribution: IGiftContribution = {
      id: randomUUID(),
      poolId: input.poolId,
      paidBy: input.paidBy,
      onBehalfOf,
      amount: input.amount,
      paymentMethod: input.paymentMethod as IGiftContribution['paymentMethod'],
      reference: input.reference,
      note: input.note,
      createdAt: now,
      status: 'CONFIRMED',
      submittedAt: now,
      recordedBy: input.recordedBy,
      verifiedBy: input.recordedBy,
      verifiedAt: now,
    }

    db.giftContributions.push(contribution)
    pool.updatedAt = now

    db.auditLogs.push({
      id: randomUUID(),
      action: 'contribution.recorded',
      actorId: input.recordedBy,
      contributionId: contribution.id,
      poolId: contribution.poolId,
      timestamp: now,
    })

    await persistData()

    try {
      await notificationService.createNotification({
        type: 'contribution_verified',
        recipientId: contribution.paidBy,
        payload: { amount: String(contribution.amount), poolId: contribution.poolId },
      })
    } catch (err) {
      // ignore notify failures
    }

    return contribution
  }

  async getPoolStatus(poolId: string): Promise<GiftPoolStatus> {
    const db = await readData()

    const pool = db.giftPools.find(p => p.id === poolId)
    if (!pool) throw new Error('Gift pool not found')

    const contributions = db.giftContributions.filter(c => c.poolId === poolId)
    const contributorIds = [...new Set(contributions.flatMap(c => c.onBehalfOf))]
    // Only CONFIRMED contributions count towards totals
    const totalRaised = contributions.filter(c => c.status === 'CONFIRMED').reduce((sum, c) => sum + c.amount, 0)

    // Non-contributors: approved, not the birthday person, not already covered
    const nonContributors = db.users.filter(u =>
      u.accessStatus === 'approved' &&
      u.id !== pool.birthdayUserId &&
      !contributorIds.includes(u.id)
    )

    return { pool, contributions, totalRaised, contributorIds, nonContributors }
  }

  async getContributionById(contributionId: string): Promise<IGiftContribution | null> {
    const db = await readData()
    return db.giftContributions.find(c => c.id === contributionId) ?? null
  }

  async listPendingContributions(poolId?: string): Promise<IGiftContribution[]> {
    const db = await readData()
    let items = db.giftContributions.filter(c => c.status === 'PENDING_VERIFICATION')
    if (poolId && poolId.trim().length > 0) items = items.filter(c => c.poolId === poolId)
    return items
  }

  async approveContribution(contributionId: string, adminUserId: string): Promise<IGiftContribution> {
    const db = await readData()
    const contribution = db.giftContributions.find(c => c.id === contributionId)
    if (!contribution) throw new Error('Contribution not found')
    if (contribution.status === 'CONFIRMED') throw new Error('Contribution already confirmed')

    contribution.status = 'CONFIRMED'
    contribution.verifiedBy = adminUserId
    contribution.verifiedAt = new Date().toISOString()

    const pool = db.giftPools.find(p => p.id === contribution.poolId)
    if (pool) pool.updatedAt = new Date().toISOString()

    // audit log
    db.auditLogs.push({
      id: randomUUID(),
      action: 'contribution.approved',
      actorId: adminUserId,
      contributionId: contribution.id,
      poolId: contribution.poolId,
      timestamp: new Date().toISOString(),
    })

    await persistData()

    // Notify contributor
    try {
      await notificationService.createNotification({
        type: 'contribution_verified',
        recipientId: contribution.paidBy,
        payload: { amount: String(contribution.amount), poolId: contribution.poolId },
      })
    } catch (err) {
      // ignore notify failures
    }

    return contribution
  }

  async rejectContribution(contributionId: string, adminUserId: string, reason?: string): Promise<IGiftContribution> {
    const db = await readData()
    const contribution = db.giftContributions.find(c => c.id === contributionId)
    if (!contribution) throw new Error('Contribution not found')
    if (contribution.status === 'REJECTED') throw new Error('Contribution already rejected')

    contribution.status = 'REJECTED'
    contribution.rejectedBy = adminUserId
    contribution.rejectedAt = new Date().toISOString()
    contribution.rejectionReason = reason?.trim() || undefined

    const pool = db.giftPools.find(p => p.id === contribution.poolId)
    if (pool) pool.updatedAt = new Date().toISOString()

    db.auditLogs.push({
      id: randomUUID(),
      action: 'contribution.rejected',
      actorId: adminUserId,
      contributionId: contribution.id,
      poolId: contribution.poolId,
      reason: contribution.rejectionReason,
      timestamp: new Date().toISOString(),
    })

    await persistData()

    try {
      await notificationService.createNotification({
        type: 'contribution_rejected',
        recipientId: contribution.paidBy,
        payload: { amount: String(contribution.amount), poolId: contribution.poolId, reason: contribution.rejectionReason ?? '' },
      })
    } catch (err) {
      // ignore
    }

    return contribution
  }

  async closePool(poolId: string): Promise<IGiftPool> {
    const db = await readData()
    const pool = db.giftPools.find(p => p.id === poolId)
    if (!pool) throw new Error('Gift pool not found')
    pool.status = 'closed'
    pool.updatedAt = new Date().toISOString()
    await persistData()
    return pool
  }

  async generateGiftPoolReminders(poolId: string): Promise<INotification[]> {
    const db = await readData()
    const pool = db.giftPools.find(p => p.id === poolId)
    if (!pool) throw new Error('Gift pool not found')

    const birthdayUser = db.users.find(u => u.id === pool.birthdayUserId)
    if (!birthdayUser) throw new Error('Birthday user not found')

    const contributions = db.giftContributions.filter(c => c.poolId === poolId)
    const contributorIds = [...new Set(contributions.flatMap(c => c.onBehalfOf))]
    const nonContributors = db.users.filter(u =>
      u.accessStatus === 'approved' &&
      u.id !== pool.birthdayUserId &&
      !contributorIds.includes(u.id)
    )
    const notifications: INotification[] = []

    for (const recipient of nonContributors) {
      try {
        const notification = await notificationService.createNotification({
          type: 'gift_pool_reminder',
          recipientId: recipient.id,
          payload: {
            poolId: pool.id,
            birthdayUserId: birthdayUser.id,
            name: birthdayUser.name,
            birthdayPersonName: birthdayUser.name,
          },
        })
        notifications.push(notification)
      } catch (error) {
        console.error(`[GiftPoolService] Gift pool reminder failed for ${recipient.id}:`, error)
      }
    }

    return notifications
  }

  async confirmReceived(
    poolId: string,
    confirmedBy: string,
    giftDescription?: string,
  ): Promise<IGiftPool> {
    const db = await readData()
    const pool = db.giftPools.find(p => p.id === poolId)
    if (!pool) throw new Error('Gift pool not found')
    if (pool.receivedAt) throw new Error('Gift receipt already confirmed')

    pool.receivedAt = new Date().toISOString()
    pool.confirmedBy = confirmedBy
    if (giftDescription?.trim()) pool.giftDescription = giftDescription.trim()
    pool.status = 'closed'
    pool.updatedAt = new Date().toISOString()

    await persistData()
    return pool
  }

  async listPools(): Promise<IGiftPool[]> {
    const db = await readData()
    return db.giftPools
  }

  async deleteContribution(
    contributionId: string,
    requestingUserId: string,
    isAdmin: boolean,
  ): Promise<boolean> {
    const db = await readData()
    const idx = db.giftContributions.findIndex(c => c.id === contributionId)
    if (idx < 0) return false

    const contribution = db.giftContributions[idx]
    if (!isAdmin && contribution.paidBy !== requestingUserId) {
      throw new Error('Forbidden')
    }

    db.giftContributions.splice(idx, 1)
    await persistData()
    return true
  }
}

export const giftPoolService = new GiftPoolService()
