import { randomUUID } from 'crypto'

import { authService } from '../src/services/auth.service'
import { birthdayService } from '../src/services/birthday.service'
import { eventService } from '../src/services/event.service'
import { giftPoolService } from '../src/services/giftPool.service'
import { notificationDispatcher } from '../src/services/notification-dispatcher.service'
import { notificationService } from '../src/services/notification.service'
import { getData } from '../src/config/db'
import { resetDb } from './helpers/db.helper'

describe('Notification flows', () => {
  beforeEach(() => {
    resetDb()
    jest.restoreAllMocks()
  })

  it('sends birthday reminder notifications to other approved users', async () => {
    const birthdayUser = {
      id: randomUUID(),
      name: 'Birthday Person',
      email: 'birthday@example.com',
      role: 'member' as const,
      accessStatus: 'approved' as const,
      birthday: '2000-06-05',
      capabilities: [],
      notificationPrefs: { level: 'all' as const, channels: ['email' as const, 'whatsapp' as const] },
      phone: '+61412345678',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const recipientA = {
      id: randomUUID(),
      name: 'Recipient A',
      email: 'a@example.com',
      role: 'member' as const,
      accessStatus: 'approved' as const,
      capabilities: [],
      notificationPrefs: { level: 'all' as const, channels: ['email' as const] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const recipientB = {
      id: randomUUID(),
      name: 'Recipient B',
      email: 'b@example.com',
      role: 'member' as const,
      accessStatus: 'approved' as const,
      capabilities: [],
      notificationPrefs: { level: 'all' as const, channels: ['email' as const, 'whatsapp' as const] },
      phone: '+447123456789',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    getData().users.push(birthdayUser, recipientA, recipientB)

    const createNotificationSpy = jest.spyOn(notificationService, 'createNotification').mockImplementation(async (input) => ({
      id: randomUUID(),
      type: input.type,
      recipientId: input.recipientId,
      payload: input.payload,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }))

    const notifications = await birthdayService.generateBirthdayReminders(7, new Date(Date.UTC(2026, 5, 2)))

    expect(notifications).toHaveLength(2)
    expect(createNotificationSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'birthday_reminder' }))
  })

  it('creates event reminder notifications for RSVPed users and the creator', async () => {
    const creatorId = randomUUID()
    const rsvpUserId = randomUUID()

    getData().users.push(
      {
        id: creatorId,
        name: 'Creator',
        email: 'creator@example.com',
        role: 'member' as const,
        accessStatus: 'approved' as const,
        capabilities: [],
        notificationPrefs: { level: 'all' as const, channels: ['email' as const] },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: rsvpUserId,
        name: 'Guest',
        email: 'guest@example.com',
        role: 'member' as const,
        accessStatus: 'approved' as const,
        capabilities: [],
        notificationPrefs: { level: 'all' as const, channels: ['email' as const, 'whatsapp' as const] },
        phone: '+61412345678',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    )

    const event = await eventService.createEvent({
      title: 'Upcoming Event',
      description: 'Reminder flow test',
      date: '2026-06-04T00:00:00.000Z',
      createdBy: creatorId,
    })

    await eventService.setRsvp(event.id, rsvpUserId, 'yes')

    const createNotificationSpy = jest.spyOn(notificationService, 'createNotification').mockImplementation(async (input) => ({
      id: randomUUID(),
      type: input.type,
      recipientId: input.recipientId,
      payload: input.payload,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }))

    const reminders = await eventService.generateEventReminders(7)

    expect(reminders).toHaveLength(2)
    expect(createNotificationSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'event_reminder' }))
  })

  it('creates gift pool reminder notifications for non-contributors', async () => {
    const birthdayUserId = randomUUID()
    const contributorId = randomUUID()
    const reminderRecipientId = randomUUID()

    getData().users.push(
      {
        id: birthdayUserId,
        name: 'Birthday Person',
        email: 'birthday@example.com',
        role: 'member' as const,
        accessStatus: 'approved' as const,
        capabilities: [],
        notificationPrefs: { level: 'all' as const, channels: ['email' as const, 'whatsapp' as const] },
        phone: '+61412345678',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: contributorId,
        name: 'Contributor',
        email: 'contrib@example.com',
        role: 'member' as const,
        accessStatus: 'approved' as const,
        capabilities: [],
        notificationPrefs: { level: 'all' as const, channels: ['email' as const] },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: reminderRecipientId,
        name: 'Reminder Recipient',
        email: 'recipient@example.com',
        role: 'member' as const,
        accessStatus: 'approved' as const,
        capabilities: [],
        notificationPrefs: { level: 'all' as const, channels: ['email' as const, 'whatsapp' as const] },
        phone: '+27712345678',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    )

    const pool = await giftPoolService.createPool({
      eventId: randomUUID(),
      birthdayUserId,
      createdBy: contributorId,
    })

    await giftPoolService.addContribution({
      poolId: pool.id,
      paidBy: contributorId,
      onBehalfOf: [],
      amount: 25,
    })

    const createNotificationSpy = jest.spyOn(notificationService, 'createNotification').mockImplementation(async (input) => ({
      id: randomUUID(),
      type: input.type,
      recipientId: input.recipientId,
      payload: input.payload,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }))

    const reminders = await giftPoolService.generateGiftPoolReminders(pool.id)

    expect(reminders).toHaveLength(1)
    expect(createNotificationSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'gift_pool_reminder' }))
  })

  it('creates access approval notifications and welcome dispatches for new users', async () => {
    const request = await authService.requestAccess({
      name: 'New User',
      email: 'new-user@example.com',
    })

    const createNotificationSpy = jest.spyOn(notificationService, 'createNotification').mockImplementation(async (input) => ({
      id: randomUUID(),
      type: input.type,
      recipientId: input.recipientId,
      payload: input.payload,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }))

    const welcomeSpy = jest.spyOn(notificationDispatcher, 'onWelcome').mockResolvedValue(undefined)

    await authService.approveAccess(request.id)

    expect(createNotificationSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'access_approved' }))
    expect(welcomeSpy).toHaveBeenCalledTimes(1)
  })
})