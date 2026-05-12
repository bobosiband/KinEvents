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
})
