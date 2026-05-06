import { randomUUID } from 'crypto'

import { accessRequestRepository } from '../src/repositories/accessRequest.repository'
import { contentRepository } from '../src/repositories/content.repository'
import { notificationRepository } from '../src/repositories/notification.repository'
import { userRepository } from '../src/repositories/user.repository'
import { authService } from '../src/services/auth.service'
import { birthdayService } from '../src/services/birthday.service'
import { eventService } from '../src/services/event.service'
import { notificationService } from '../src/services/notification.service'
import { resetDb } from './helpers/db.helper'

describe('Coverage Improvements', () => {
  beforeEach(() => {
    resetDb()
  })

  it('covers content repository upsert/find/remove branches', async () => {
    const first = await contentRepository.upsert({
      key: 'announcement',
      value: 'hello',
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
    })

    expect(first.value).toBe('hello')
    expect(contentRepository.findByKey('announcement')?.value).toBe('hello')

    const replaced = await contentRepository.upsert({
      key: 'announcement',
      value: 'updated',
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin',
    })

    expect(replaced.value).toBe('updated')
    expect(contentRepository.findAll()).toHaveLength(1)
    expect(await contentRepository.removeByKey('homepage_title')).toBe(false)
    expect(await contentRepository.removeByKey('announcement')).toBe(true)
  })

  it('covers access request repository queries', async () => {
    const request = await authService.requestAccess({
      name: 'Case User',
      email: 'Case@Test.com',
      message: 'request',
    })

    expect(accessRequestRepository.findByEmail('case@test.com')?.id).toBe(request.id)
    expect(accessRequestRepository.findByStatus('pending')).toHaveLength(1)
    expect(accessRequestRepository.findByStatus('approved')).toHaveLength(0)
  })

  it('covers auth service existing-user approval and list methods', async () => {
    const existingUser = await userRepository.insert({
      id: randomUUID(),
      name: 'Existing',
      email: 'existing@example.com',
      role: 'member',
      accessStatus: 'pending',
      capabilities: [],
      notificationPrefs: { level: 'all', channels: ['email'] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

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
    await userRepository.insert({
      id: randomUUID(),
      name: 'Valid Birthday User',
      email: 'valid@example.com',
      role: 'member',
      accessStatus: 'approved',
      capabilities: [],
      notificationPrefs: { level: 'all', channels: ['email'] },
      birthday: '2001-11-03',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    await userRepository.insert({
      id: randomUUID(),
      name: 'Invalid Birthday User',
      email: 'invalid@example.com',
      role: 'member',
      accessStatus: 'approved',
      capabilities: [],
      notificationPrefs: { level: 'all', channels: ['email'] },
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

    expect(notificationRepository.findByRecipientId('recipient-1')).toHaveLength(1)
    expect(notificationRepository.findByStatus('pending')).toHaveLength(1)

    const sent = await notificationService.markAsSent(notification.id)
    expect(sent?.status).toBe('sent')
    expect(notificationRepository.findByStatus('sent')).toHaveLength(1)

    const failed = await notificationService.markAsFailed(notification.id)
    expect(failed?.status).toBe('failed')
    expect(await notificationService.markAsSent('missing-id')).toBeNull()
    expect(await notificationService.markAsFailed('missing-id')).toBeNull()
    expect(await notificationService.listNotifications()).toHaveLength(1)
  })
})
