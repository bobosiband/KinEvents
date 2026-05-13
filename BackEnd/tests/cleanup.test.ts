import { randomUUID } from 'crypto'

import { cleanupService } from '../src/services/cleanup.service'
import { getData } from '../src/config/db'
import type { EmailLogEntry } from '../src/interfaces/email.interface'
import { resetDb } from './helpers/db.helper'

describe('Cleanup Service', () => {
  beforeEach(() => resetDb())

  it('should delete all notifications older than 1 hour regardless of read status', async () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()

    getData().notifications.push(
      {
        id: randomUUID(),
        type: 'event_created',
        recipientId: 'user-1',
        payload: {},
        status: 'sent',
        createdAt: twoHoursAgo,
      },
      {
        id: randomUUID(),
        type: 'event_created',
        recipientId: 'user-2',
        payload: {},
        status: 'sent',
        createdAt: twoHoursAgo,
        readAt: twoHoursAgo,
        readBy: ['user-2'],
      },
      {
        id: randomUUID(),
        type: 'event_created',
        recipientId: 'user-3',
        payload: {},
        status: 'pending',
        createdAt: thirtyMinsAgo,
      },
    )

    const deleted = await cleanupService.deleteOldReadNotifications()

    expect(deleted).toBe(2)
    expect(getData().notifications).toHaveLength(1)
  })

  it('should delete non-locked past events', async () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    getData().events.push(
      {
        id: randomUUID(),
        title: 'Old Custom Event',
        description: 'Past',
        date: twoDaysAgo,
        type: 'custom',
        locked: false,
        createdBy: 'user-1',
        rsvps: {},
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo,
      },
      {
        id: randomUUID(),
        title: 'Old Birthday Event',
        description: 'Locked birthday',
        date: twoDaysAgo,
        type: 'birthday',
        locked: true,
        createdBy: 'user-1',
        rsvps: {},
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo,
      },
      {
        id: randomUUID(),
        title: 'Future Event',
        description: 'Upcoming',
        date: tomorrow,
        type: 'custom',
        locked: false,
        createdBy: 'user-1',
        rsvps: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    )

    const deleted = await cleanupService.deleteOldEvents()

    expect(deleted).toBe(1)
    expect(getData().events).toHaveLength(2)
  })

  it('should delete email logs older than 1 day', async () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()

    const oldLog1: EmailLogEntry = {
      id: randomUUID(),
      templateName: 'event-created',
      recipientId: 'user-1',
      recipientEmail: 'user1@example.com',
      subject: 'Old Log 1',
      status: 'sent',
      createdAt: twoDaysAgo,
      retryCount: 0,
    }

    const oldLog2: EmailLogEntry = {
      id: randomUUID(),
      templateName: 'event-updated',
      recipientId: 'user-2',
      recipientEmail: 'user2@example.com',
      subject: 'Old Log 2',
      status: 'failed',
      createdAt: twoDaysAgo,
      retryCount: 1,
    }

    const recentLog: EmailLogEntry = {
      id: randomUUID(),
      templateName: 'birthday-reminder',
      recipientId: 'user-3',
      recipientEmail: 'user3@example.com',
      subject: 'Recent Log',
      status: 'sent',
      createdAt: sixHoursAgo,
      retryCount: 0,
    }

    getData().emailLogs.push(oldLog1, oldLog2, recentLog)

    const deleted = await cleanupService.deleteOldEmailLogs()

    expect(deleted).toBe(2)
    expect(getData().emailLogs).toHaveLength(1)
  })

  it('should delete access request history older than 30 days', async () => {
    const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
    const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString()
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()

    getData().accessRequestHistory.push(
      {
        id: randomUUID(),
        name: 'Old Approved',
        email: 'old-approved@example.com',
        status: 'approved',
        requestedAt: fortyDaysAgo,
        resolvedAt: fortyDaysAgo,
        resolvedBy: 'admin',
      },
      {
        id: randomUUID(),
        name: 'Old Rejected Legacy',
        email: 'old-rejected@example.com',
        status: 'rejected',
        requestedAt: thirtyOneDaysAgo,
      },
      {
        id: randomUUID(),
        name: 'Recent Approved',
        email: 'recent@example.com',
        status: 'approved',
        requestedAt: tenDaysAgo,
        resolvedAt: tenDaysAgo,
        resolvedBy: 'admin',
      },
    )

    const deleted = await cleanupService.deleteOldAccessRequestHistory()

    expect(deleted).toBe(2)
    expect(getData().accessRequestHistory).toHaveLength(1)
    expect(getData().accessRequestHistory[0].email).toBe('recent@example.com')
  })

  it('should hard-delete messages older than 7 days and keep recent soft-deleted messages', async () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    const now = new Date().toISOString()

    getData().messages.push(
      {
        id: randomUUID(),
        from: 'user-1',
        content: 'old active',
        createdAt: eightDaysAgo,
        updatedAt: eightDaysAgo,
        readBy: [],
        type: 'text' as const,
      },
      {
        id: randomUUID(),
        from: 'user-2',
        content: 'old deleted',
        createdAt: eightDaysAgo,
        updatedAt: eightDaysAgo,
        deletedAt: twoHoursAgo,
        readBy: [],
        type: 'text' as const,
      },
      {
        id: randomUUID(),
        from: 'user-3',
        content: 'recent deleted',
        createdAt: twoHoursAgo,
        updatedAt: twoHoursAgo,
        deletedAt: twoHoursAgo,
        readBy: [],
        type: 'text' as const,
      },
      {
        id: randomUUID(),
        from: 'user-4',
        content: 'active message',
        createdAt: now,
        updatedAt: now,
        readBy: [],
        type: 'text' as const,
      },
    )

    const deleted = await cleanupService.deleteOldMessages()

    expect(deleted).toBe(2)
    expect(getData().messages.find((m) => m.content === 'old active')).toBeUndefined()
    expect(getData().messages.find((m) => m.content === 'old deleted')).toBeUndefined()
    expect(getData().messages.find((m) => m.content === 'recent deleted')).toBeDefined()
    expect(getData().messages.find((m) => m.content === 'active message')).toBeDefined()
  })
})
