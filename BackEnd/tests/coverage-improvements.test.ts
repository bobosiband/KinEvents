import { randomUUID } from 'crypto'

import { getData } from '../src/config/db'
import { authService } from '../src/services/auth.service'
import { birthdayService } from '../src/services/birthday.service'
import { contentService } from '../src/services/content.service'
import { eventService } from '../src/services/event.service'
import { notificationService } from '../src/services/notification.service'
import { resetDb } from './helpers/db.helper'

describe('Coverage Improvements', () => {
  beforeEach(() => {
    resetDb()
  })

  it('covers content service upsert and lookup branches', async () => {
    const created = await contentService.upsertContent('announcement', 'hello', 'system')
    expect(created.value).toBe('hello')
    expect(await contentService.getContent('announcement')).toBeDefined()

    const replaced = await contentService.upsertContent('announcement', 'updated', 'admin')
    expect(replaced.value).toBe('updated')
    expect(getData().content).toHaveLength(1)
  })

  it('covers access request service query branches', async () => {
    const request = await authService.requestAccess({
      name: 'Case User',
      email: 'Case@Test.com',
      message: 'request',
    })

    const accessRequests = getData().accessRequests
    expect(accessRequests.find((item) => item.email.toLowerCase() === 'case@test.com')?.id).toBe(request.id)
    expect(accessRequests.filter((item) => item.status === 'pending')).toHaveLength(1)
    expect(accessRequests.filter((item) => item.status === 'approved')).toHaveLength(0)
  })

  it('covers auth service existing-user approval and list methods', async () => {
    const existingUser = {
      id: randomUUID(),
      name: 'Existing',
      email: 'existing@example.com',
      role: 'member' as const,
      accessStatus: 'pending' as const,
      capabilities: [],
      notificationPrefs: { level: 'all' as const, channels: ['email' as const] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    getData().users.push(existingUser)

    const request = await authService.requestAccess({
      name: 'Existing Updated',
      email: 'existing@example.com',
    })

    const approved = await authService.approveAccess(request.id)
    expect(approved.user.id).toBe(existingUser.id)
    expect(approved.user.accessStatus).toBe('approved')
    expect((await authService.listAccessRequests()).length).toBeGreaterThan(0)
    expect((await authService.listApprovedUsers()).length).toBeGreaterThan(0)
    await expect(authService.revokeAccess('missing-id')).rejects.toThrow('Access request not found')
  })

  it('covers event service error branch for missing RSVP target', async () => {
    await expect(eventService.setRsvp('missing-event', 'user-id', 'yes')).rejects.toThrow('Event not found')
  })

  it('covers birthday service parsing and generation branches', async () => {
    getData().users.push({
      id: randomUUID(),
      name: 'Valid Birthday User',
      email: 'valid@example.com',
      role: 'member' as const,
      accessStatus: 'approved' as const,
      capabilities: [],
      notificationPrefs: { level: 'all' as const, channels: ['email' as const] },
      birthday: '2001-11-03',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    getData().users.push({
      id: randomUUID(),
      name: 'Invalid Birthday User',
      email: 'invalid@example.com',
      role: 'member' as const,
      accessStatus: 'approved' as const,
      capabilities: [],
      notificationPrefs: { level: 'all' as const, channels: ['email' as const] },
      birthday: 'invalidformat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const upcoming = await birthdayService.getUpcomingBirthdays(new Date('2026-01-01T00:00:00.000Z'))
    expect(upcoming).toHaveLength(1)
    expect(upcoming[0]?.birthdayThisYear).toBe('2026-11-03')

    const created = await birthdayService.generateBirthdayEvents(2026)
    expect(created).toHaveLength(1)
    expect(created[0]?.date).toBe('2026-11-03')
  })

  it('covers notification service status transitions and misses', async () => {
    const notification = await notificationService.createNotification({
      type: 'event_created',
      recipientId: 'recipient-1',
      payload: { eventId: 'evt-1' },
      status: 'pending',
    })

    expect(getData().notifications.filter((item) => item.recipientId === 'recipient-1')).toHaveLength(1)
    expect(getData().notifications.filter((item) => item.status === 'pending')).toHaveLength(1)

    const sent = await notificationService.markAsSent(notification.id)
    expect(sent?.status).toBe('sent')
    expect(getData().notifications.filter((item) => item.status === 'sent')).toHaveLength(1)

    const failed = await notificationService.markAsFailed(notification.id)
    expect(failed?.status).toBe('failed')
    expect(await notificationService.markAsSent('missing-id')).toBeNull()
    expect(await notificationService.markAsFailed('missing-id')).toBeNull()
    expect(await notificationService.listNotifications()).toHaveLength(1)
  })
})