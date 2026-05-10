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
    
    // After approval, the request is archived, so it should be in history
    expect((await authService.listAccessRequestHistory()).length).toBeGreaterThan(0)
    
    // Create another pending request so listAccessRequests is not empty
    await authService.requestAccess({
      name: 'Another User',
      email: 'another@example.com',
    })
    expect((await authService.listAccessRequests()).length).toBeGreaterThan(0)
    expect((await authService.listApprovedUsers()).length).toBeGreaterThan(0)
    await expect(authService.revokeAccess('missing-id')).rejects.toThrow('Access request not found')
  })

  it('covers event service error branch for missing RSVP target', async () => {
    await expect(eventService.setRsvp('missing-event', 'user-id', 'yes')).rejects.toThrow('Event not found')
  })

  it('RSVP by a different user triggers a notification to the event creator', async () => {
    const creatorId = randomUUID()
    const rsvpUserId = randomUUID()
    const notificationSpy = jest.spyOn(notificationService, 'createNotification')

    const event = await eventService.createEvent({
      title: 'RSVP Notification Event',
      description: 'Event for RSVP notification coverage',
      date: new Date().toISOString(),
      createdBy: creatorId,
    })

    notificationSpy.mockClear()

    await eventService.setRsvp(event.id, rsvpUserId, 'yes')

    expect(notificationSpy).toHaveBeenCalledTimes(1)
    expect(notificationSpy).toHaveBeenCalledWith({
      type: 'event_reminder',
      recipientId: creatorId,
      payload: {
        eventId: event.id,
        title: event.title,
        userId: rsvpUserId,
        status: 'yes',
      },
    })

    notificationSpy.mockRestore()
  })

  it('RSVP by the event creator does NOT trigger a notification', async () => {
    const creatorId = randomUUID()
    const notificationSpy = jest.spyOn(notificationService, 'createNotification')

    const event = await eventService.createEvent({
      title: 'Self RSVP Event',
      description: 'Event for self RSVP coverage',
      date: new Date().toISOString(),
      createdBy: creatorId,
    })

    notificationSpy.mockClear()

    await eventService.setRsvp(event.id, creatorId, 'maybe')

    expect(notificationSpy).not.toHaveBeenCalled()

    notificationSpy.mockRestore()
  })

  it('notification payload contains eventId, title, userId, and status', async () => {
    const creatorId = randomUUID()
    const rsvpUserId = randomUUID()
    const notificationSpy = jest.spyOn(notificationService, 'createNotification')

    const event = await eventService.createEvent({
      title: 'Payload Event',
      description: 'Event for payload coverage',
      date: new Date().toISOString(),
      createdBy: creatorId,
    })

    notificationSpy.mockClear()

    await eventService.setRsvp(event.id, rsvpUserId, 'no')

    expect(notificationSpy).toHaveBeenCalledWith({
      type: 'event_reminder',
      recipientId: creatorId,
      payload: {
        eventId: event.id,
        title: event.title,
        userId: rsvpUserId,
        status: 'no',
      },
    })

    notificationSpy.mockRestore()
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
    expect(created.events).toHaveLength(1)
    expect(created.skipped).toBe(0)
    expect(created.events[0]?.date).toBe('2026-11-03')
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

  it('covers birthday reminders with daysAhead parameter', async () => {
    // Add a user with birthday in 4 days
    const userId = randomUUID()
    const today = new Date('2026-05-09T00:00:00.000Z')
    const birthdayDate = new Date('2026-05-13T00:00:00.000Z')

    getData().users.push({
      id: userId,
      name: 'Birthday User',
      email: 'birthday@example.com',
      role: 'member' as const,
      accessStatus: 'approved' as const,
      capabilities: [],
      notificationPrefs: { level: 'all' as const, channels: ['email' as const] },
      birthday: '1990-05-13',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    // Generate reminders for 7 days ahead
    const reminders = await birthdayService.generateBirthdayReminders(7, today)
    expect(reminders).toHaveLength(1)
    expect(reminders[0]?.type).toBe('birthday_reminder')
    expect(reminders[0]?.recipientId).toBe(userId)
    expect(reminders[0]?.payload.daysUntil).toBe('4')
  })

  it('covers birthday reminders with birthday today', async () => {
    const userId = randomUUID()
    const today = new Date('2026-05-13T00:00:00.000Z')

    getData().users.push({
      id: userId,
      name: 'Birthday Today User',
      email: 'birthdaytoday@example.com',
      role: 'member' as const,
      accessStatus: 'approved' as const,
      capabilities: [],
      notificationPrefs: { level: 'all' as const, channels: ['email' as const] },
      birthday: '1990-05-13',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    // Generate reminders with daysAhead=0 (today only)
    const reminders = await birthdayService.generateBirthdayReminders(0, today)
    expect(reminders).toHaveLength(1)
    expect(reminders[0]?.type).toBe('birthday_today')
    expect(reminders[0]?.payload.daysUntil).toBe('0')
  })

  it('events within daysAhead window generate reminders for RSVP yes users', async () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-05-10T12:00:00.000Z'))

    const creatorId = randomUUID()
    const rsvpUserId = randomUUID()
    const notificationSpy = jest.spyOn(notificationService, 'createNotification')

    const event = await eventService.createEvent({
      title: 'Upcoming Event',
      description: 'Event inside reminder window',
      date: '2026-05-12T00:00:00.000Z',
      createdBy: creatorId,
    })
    event.rsvps[rsvpUserId] = 'yes'

    notificationSpy.mockClear()

    const reminders = await eventService.generateEventReminders(3)

    expect(reminders).toHaveLength(2)
    expect(notificationSpy).toHaveBeenCalledTimes(2)
    expect(reminders.map((item) => item.recipientId).sort()).toEqual([creatorId, rsvpUserId].sort())
    expect(reminders[0]?.payload.daysUntil).toBe('2')

    notificationSpy.mockRestore()
    jest.useRealTimers()
  })

  it('events outside the reminder window generate no reminders', async () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-05-10T12:00:00.000Z'))

    const creatorId = randomUUID()
    const rsvpUserId = randomUUID()
    const notificationSpy = jest.spyOn(notificationService, 'createNotification')

    const event = await eventService.createEvent({
      title: 'Distant Event',
      description: 'Event outside reminder window',
      date: '2026-05-20T00:00:00.000Z',
      createdBy: creatorId,
    })
    event.rsvps[rsvpUserId] = 'yes'

    notificationSpy.mockClear()

    const reminders = await eventService.generateEventReminders(3)

    expect(reminders).toHaveLength(0)
    expect(notificationSpy).not.toHaveBeenCalled()

    notificationSpy.mockRestore()
    jest.useRealTimers()
  })

  it('event creator gets notified even if they did not RSVP', async () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-05-10T12:00:00.000Z'))

    const creatorId = randomUUID()
    const rsvpUserId = randomUUID()
    const notificationSpy = jest.spyOn(notificationService, 'createNotification')

    const event = await eventService.createEvent({
      title: 'Creator Reminder Event',
      description: 'Event for creator reminder coverage',
      date: '2026-05-11T00:00:00.000Z',
      createdBy: creatorId,
    })
    event.rsvps[rsvpUserId] = 'yes'

    notificationSpy.mockClear()

    const reminders = await eventService.generateEventReminders(3)

    expect(reminders).toHaveLength(2)
    expect(reminders.map((item) => item.recipientId)).toContain(creatorId)
    expect(reminders.map((item) => item.recipientId)).toContain(rsvpUserId)

    notificationSpy.mockRestore()
    jest.useRealTimers()
  })

  it('covers mark notification as read by user', async () => {
    const notification = await notificationService.createNotification({
      type: 'event_created',
      recipientId: 'recipient-1',
      payload: { eventId: 'evt-1' },
    })

    expect(notification.readBy).toBeUndefined()

    const marked = await notificationService.markAsReadByUser(notification.id, 'user-1')
    expect(marked?.readBy).toContain('user-1')
    expect(marked?.readBy).toHaveLength(1)

    // Mark as read twice with same user — should not duplicate
    const markedAgain = await notificationService.markAsReadByUser(notification.id, 'user-1')
    expect(markedAgain?.readBy).toHaveLength(1)

    // Mark as read by different user
    const markedByAnother = await notificationService.markAsReadByUser(notification.id, 'user-2')
    expect(markedByAnother?.readBy).toContain('user-1')
    expect(markedByAnother?.readBy).toContain('user-2')
    expect(markedByAnother?.readBy).toHaveLength(2)
  })

  it('covers listNotifications with userId computing isRead field', async () => {
    const notification = await notificationService.createNotification({
      type: 'event_created',
      recipientId: 'recipient-1',
      payload: { eventId: 'evt-1' },
    })

    // Before marking as read
    const unreadList = await notificationService.listNotifications('user-1')
    const unreadNotif = unreadList.find((n) => n.id === notification.id)
    expect(unreadNotif?.isRead).toBe(false)

    // Mark as read
    await notificationService.markAsReadByUser(notification.id, 'user-1')

    // After marking as read
    const readList = await notificationService.listNotifications('user-1')
    const readNotif = readList.find((n) => n.id === notification.id)
    expect(readNotif?.isRead).toBe(true)

    // Different user still sees it as unread
    const otherUserList = await notificationService.listNotifications('user-2')
    const otherUserNotif = otherUserList.find((n) => n.id === notification.id)
    expect(otherUserNotif?.isRead).toBe(false)
  })

  it('covers mark as read for missing notification', async () => {
    const result = await notificationService.markAsReadByUser('missing-id', 'user-1')
    expect(result).toBeNull()
  })

  it('calling generateBirthdayEvents twice for the same year only creates events once', async () => {
    getData().users.push({
      id: randomUUID(),
      name: 'Duplicate Guard User',
      email: 'duplicate@example.com',
      role: 'member' as const,
      accessStatus: 'approved' as const,
      capabilities: [],
      notificationPrefs: { level: 'all' as const, channels: ['email' as const] },
      birthday: '1992-07-14',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const first = await birthdayService.generateBirthdayEvents(2026)
    const second = await birthdayService.generateBirthdayEvents(2026)

    expect(first.events).toHaveLength(1)
    expect(first.skipped).toBe(0)
    expect(second.events).toHaveLength(0)
    expect(second.skipped).toBe(1)
  })

  it('new users added after first generation get their event created on second call', async () => {
    const firstUserId = randomUUID()
    const secondUserId = randomUUID()

    getData().users.push({
      id: firstUserId,
      name: 'First Birthday User',
      email: 'first@example.com',
      role: 'member' as const,
      accessStatus: 'approved' as const,
      capabilities: [],
      notificationPrefs: { level: 'all' as const, channels: ['email' as const] },
      birthday: '1991-08-20',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const first = await birthdayService.generateBirthdayEvents(2026)
    expect(first.events).toHaveLength(1)
    expect(first.skipped).toBe(0)

    getData().users.push({
      id: secondUserId,
      name: 'Second Birthday User',
      email: 'second@example.com',
      role: 'member' as const,
      accessStatus: 'approved' as const,
      capabilities: [],
      notificationPrefs: { level: 'all' as const, channels: ['email' as const] },
      birthday: '1993-09-21',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const second = await birthdayService.generateBirthdayEvents(2026)

    expect(second.events).toHaveLength(1)
    expect(second.skipped).toBe(1)
    expect(second.events[0]?.createdBy).toBe(secondUserId)
  })
})