import { randomUUID } from 'crypto'

import { accessRequestRepository } from '../src/repositories/accessRequest.repository'
import { contentRepository } from '../src/repositories/content.repository'
import { eventRepository } from '../src/repositories/event.repository'
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

  it('covers content repository upsert/find/remove branches', () => {
    const first = contentRepository.upsert({
      key: 'announcement',
      value: 'hello',
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
    })

    expect(first.value).toBe('hello')
    expect(contentRepository.findByKey('announcement')?.value).toBe('hello')

    const replaced = contentRepository.upsert({
      key: 'announcement',
      value: 'updated',
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin',
    })

    expect(replaced.value).toBe('updated')
    expect(contentRepository.findAll()).toHaveLength(1)
    expect(contentRepository.removeByKey('homepage_title')).toBe(false)
    expect(contentRepository.removeByKey('announcement')).toBe(true)
  })

  it('covers access request repository queries', () => {
    const request = authService.requestAccess({
      name: 'Case User',
      email: 'Case@Test.com',
      message: 'request',
    })

    expect(accessRequestRepository.findByEmail('case@test.com')?.id).toBe(request.id)
    expect(accessRequestRepository.findByStatus('pending')).toHaveLength(1)
    expect(accessRequestRepository.findByStatus('approved')).toHaveLength(0)
  })

  it('covers auth service existing-user approval and list methods', () => {
    const existingUser = userRepository.insert({
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

    const request = authService.requestAccess({
      name: 'Existing Updated',
      email: 'existing@example.com',
    })

    const approved = authService.approveAccess(request.id)
    expect(approved.user.id).toBe(existingUser.id)
    expect(approved.user.accessStatus).toBe('approved')
    expect(authService.listAccessRequests().length).toBeGreaterThan(0)
    expect(authService.listApprovedUsers().length).toBeGreaterThan(0)
    expect(() => authService.revokeAccess('missing-id')).toThrow('Access request not found')
  })

  it('covers event service error branch for missing RSVP target', () => {
    expect(() => eventService.setRsvp('missing-event', 'user-id', 'yes')).toThrow('Event not found')
  })

  it('covers birthday service parsing and generation branches', () => {
    userRepository.insert({
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

    userRepository.insert({
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

    const upcoming = birthdayService.getUpcomingBirthdays(new Date('2026-01-01T00:00:00.000Z'))
    expect(upcoming).toHaveLength(1)
    expect(upcoming[0]?.birthdayThisYear).toBe('2026-11-03')

    const created = birthdayService.generateBirthdayEvents(2026)
    expect(created).toHaveLength(1)
    expect(created[0]?.date).toBe('2026-11-03')
  })

  it('covers notification service status transitions and misses', () => {
    const notification = notificationService.createNotification({
      type: 'event_created',
      recipientId: 'recipient-1',
      payload: { eventId: 'evt-1' },
      status: 'pending',
    })

    expect(notificationRepository.findByRecipientId('recipient-1')).toHaveLength(1)
    expect(notificationRepository.findByStatus('pending')).toHaveLength(1)

    const sent = notificationService.markAsSent(notification.id)
    expect(sent?.status).toBe('sent')
    expect(notificationRepository.findByStatus('sent')).toHaveLength(1)

    const failed = notificationService.markAsFailed(notification.id)
    expect(failed?.status).toBe('failed')
    expect(notificationService.markAsSent('missing-id')).toBeNull()
    expect(notificationService.markAsFailed('missing-id')).toBeNull()
    expect(notificationService.listNotifications()).toHaveLength(1)
  })
})