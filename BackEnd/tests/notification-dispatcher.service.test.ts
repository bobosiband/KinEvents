import { notificationDispatcher } from '../src/services/notification-dispatcher.service'
import { emailService } from '../src/services/email.service'
import { whatsappDispatcher } from '../src/services/whatsapp-dispatcher.service'
import type { INotification } from '../src/interfaces/notification.interface'
import type { IUser } from '../src/interfaces/user.interface'
import { resetDb } from './helpers/db.helper'

describe('NotificationDispatcherService', () => {
  const mockUser: IUser = {
    id: 'user-1',
    name: 'Alex',
    email: 'alex@example.com',
    role: 'member',
    accessStatus: 'approved',
    capabilities: [],
    notificationPrefs: { level: 'all', channels: ['email', 'whatsapp'] },
    phone: '+61412345678',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const notification: INotification = {
    id: 'notification-1',
    type: 'birthday_reminder',
    recipientId: mockUser.id,
    payload: {
      name: 'Taylor',
      birthdayDate: '2026-06-10',
      daysUntil: '3',
    },
    status: 'pending',
    createdAt: new Date().toISOString(),
  }

  beforeEach(() => {
    resetDb()
    jest.spyOn(emailService, 'send').mockResolvedValue(true)
    jest.spyOn(whatsappDispatcher, 'dispatchNotification').mockResolvedValue(undefined)
    jest.spyOn(whatsappDispatcher, 'onWelcome').mockResolvedValue(undefined)
    jest.spyOn(whatsappDispatcher, 'onAccessApproved').mockResolvedValue(undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('routes a notification to both email and WhatsApp when enabled', async () => {
    await notificationDispatcher.dispatchNotification(notification, mockUser)

    expect(emailService.send).toHaveBeenCalledTimes(1)
    expect(whatsappDispatcher.dispatchNotification).toHaveBeenCalledTimes(1)
  })

  it('skips WhatsApp when the channel is disabled', async () => {
    const emailOnlyUser: IUser = {
      ...mockUser,
      notificationPrefs: { level: 'all', channels: ['email'] },
    }

    await notificationDispatcher.dispatchNotification(notification, emailOnlyUser)

    expect(emailService.send).toHaveBeenCalledTimes(1)
    expect(whatsappDispatcher.dispatchNotification).not.toHaveBeenCalled()
  })

  it('dispatches welcome notifications through both channels for new users', async () => {
    await notificationDispatcher.onWelcome(mockUser)

    expect(whatsappDispatcher.onWelcome).toHaveBeenCalledWith(mockUser)
  })

  it('dispatches access approval notifications through both channels', async () => {
    await notificationDispatcher.onAccessApproved(mockUser)

    expect(whatsappDispatcher.onAccessApproved).toHaveBeenCalledWith(mockUser)
  })
})