import { randomUUID } from 'crypto'

import { cleanupService } from '../src/services/cleanup.service'
import { getData } from '../src/config/db'
import { resetDb } from './helpers/db.helper'

describe('Cleanup Service', () => {
  beforeEach(() => resetDb())

  it('should delete read notifications older than 1 hour', async () => {
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
        readAt: twoHoursAgo,
        readBy: ['user-1'],
      },
      {
        id: randomUUID(),
        type: 'event_created',
        recipientId: 'user-2',
        payload: {},
        status: 'sent',
        createdAt: thirtyMinsAgo,
        readAt: thirtyMinsAgo,
        readBy: ['user-2'],
      },
      {
        id: randomUUID(),
        type: 'event_created',
        recipientId: 'user-3',
        payload: {},
        status: 'pending',
        createdAt: twoHoursAgo,
      },
    )

    const deleted = await cleanupService.deleteOldReadNotifications()

    expect(deleted).toBe(1)
    expect(getData().notifications).toHaveLength(2)
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
})
