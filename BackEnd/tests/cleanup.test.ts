import { randomUUID } from 'crypto'

import { cleanupService } from '../src/services/cleanup.service'
import { getData } from '../src/config/db'
import type { EmailLogEntry } from '../src/interfaces/email.interface'
import { resetDb } from './helpers/db.helper'

describe('Cleanup Service', () => {
  beforeEach(() => resetDb())

  it('deletes only read notifications older than 30 days; unread stay forever', async () => {
    const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()

    getData().notifications.push(
      {
        id: randomUUID(),
        type: 'event_created',
        recipientId: 'user-1',
        payload: {},
        status: 'sent',
        createdAt: yearAgo,
      },
      {
        id: randomUUID(),
        type: 'event_created',
        recipientId: 'user-2',
        payload: {},
        status: 'sent',
        createdAt: fortyDaysAgo,
        readAt: fortyDaysAgo,
        readBy: ['user-2'],
      },
      {
        id: randomUUID(),
        type: 'event_created',
        recipientId: 'user-3',
        payload: {},
        status: 'sent',
        createdAt: tenDaysAgo,
        readAt: tenDaysAgo,
        readBy: ['user-3'],
      },
    )

    const deleted = await cleanupService.deleteOldReadNotifications()

    expect(deleted).toBe(1)
    expect(getData().notifications).toHaveLength(2)
    expect(getData().notifications.find((n) => n.recipientId === 'user-1')).toBeDefined()
    expect(getData().notifications.find((n) => n.recipientId === 'user-2')).toBeUndefined()
    expect(getData().notifications.find((n) => n.recipientId === 'user-3')).toBeDefined()
  })

  it('never auto-deletes past events — they are history', async () => {
    const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    getData().events.push(
      {
        id: randomUUID(),
        title: 'Old Custom Event',
        description: 'Past',
        date: yearAgo,
        type: 'custom',
        locked: false,
        createdBy: 'user-1',
        rsvps: {},
        createdAt: yearAgo,
        updatedAt: yearAgo,
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

    expect(deleted).toBe(0)
    expect(getData().events).toHaveLength(2)
  })

  it('deletes legacy Mongo email logs older than 30 days', async () => {
    const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()

    const oldLog: EmailLogEntry = {
      id: randomUUID(),
      templateName: 'event-created',
      recipientId: 'user-1',
      recipientEmail: 'user1@example.com',
      subject: 'Old',
      status: 'sent',
      createdAt: fortyDaysAgo,
      retryCount: 0,
    }
    const recentLog: EmailLogEntry = {
      id: randomUUID(),
      templateName: 'birthday-reminder',
      recipientId: 'user-3',
      recipientEmail: 'user3@example.com',
      subject: 'Recent',
      status: 'sent',
      createdAt: sixHoursAgo,
      retryCount: 0,
    }

    getData().emailLogs.push(oldLog, recentLog)

    const deleted = await cleanupService.deleteOldEmailLogs()

    expect(deleted).toBe(1)
    expect(getData().emailLogs).toHaveLength(1)
    expect(getData().emailLogs[0].subject).toBe('Recent')
  })

  it('deletes access request history older than 30 days', async () => {
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

  it('never auto-deletes chat messages — chat is history', async () => {
    const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
    const now = new Date().toISOString()

    getData().messages.push(
      {
        id: randomUUID(),
        from: 'user-1',
        content: 'old active',
        createdAt: yearAgo,
        updatedAt: yearAgo,
        readBy: [],
        type: 'text' as const,
      },
      {
        id: randomUUID(),
        from: 'user-2',
        content: 'recent',
        createdAt: now,
        updatedAt: now,
        readBy: [],
        type: 'text' as const,
      },
    )

    const deleted = await cleanupService.deleteOldMessages()

    expect(deleted).toBe(0)
    expect(getData().messages).toHaveLength(2)
  })
})
