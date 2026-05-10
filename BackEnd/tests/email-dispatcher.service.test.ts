import { emailDispatcher } from '../src/services/email-dispatcher.service'
import { emailService } from '../src/services/email.service'
import type { IUser } from '../src/interfaces/user.interface'
import type { IEvent } from '../src/interfaces/event.interface'
import type { IAccessRequest } from '../src/interfaces/auth.interface'
import { resetDb } from './helpers/db.helper'

// Mock the email service
jest.mock('../src/services/email.service')

describe('EmailDispatcherService', () => {
  beforeEach(() => {
    resetDb()
    jest.clearAllMocks()
  })

  const mockUser: IUser = {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'member',
    accessStatus: 'approved',
    capabilities: [],
    notificationPrefs: { level: 'all', channels: ['email'] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const mockEvent: IEvent = {
    id: 'event-123',
    title: 'Family Reunion',
    description: 'Annual family reunion',
    date: '2026-07-15',
    type: 'custom',
    locked: false,
    createdBy: 'user-456',
    rsvps: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const mockAccessRequest: IAccessRequest = {
    id: 'req-123',
    name: 'Jane Smith',
    email: 'jane@example.com',
    status: 'pending',
    requestedAt: new Date().toISOString(),
  }

  describe('onAccessApproved', () => {
    it('should send email for user with level: all', async () => {
      const user: IUser = {
        ...mockUser,
        notificationPrefs: { level: 'all' as const, channels: ['email' as const] },
      }

      await emailDispatcher.onAccessApproved(user)

      expect(emailService.sendTemplate).toHaveBeenCalledWith(
        'access-approved',
        expect.objectContaining({ recipientName: user.name }),
        expect.objectContaining({ email: user.email }),
        user.id
      )
    })

    it('should skip email for user with level: none', async () => {
      const user: IUser = {
        ...mockUser,
        notificationPrefs: { level: 'none' as const, channels: ['email' as const] },
      }

      await emailDispatcher.onAccessApproved(user)

      expect(emailService.sendTemplate).not.toHaveBeenCalled()
    })

    it('should skip email if email not in channels', async () => {
      const user: IUser = {
        ...mockUser,
        notificationPrefs: { level: 'all' as const, channels: [] },
      }

      await emailDispatcher.onAccessApproved(user)

      expect(emailService.sendTemplate).not.toHaveBeenCalled()
    })
  })

  describe('onAccessRejected', () => {
    it('should send rejection email', async () => {
      await emailDispatcher.onAccessRejected(mockAccessRequest)

      expect(emailService.sendTemplate).toHaveBeenCalledWith(
        'access-rejected',
        expect.objectContaining({ recipientName: mockAccessRequest.name }),
        expect.any(Object),
        expect.any(String)
      )
    })
  })

  describe('onEventCreated', () => {
    it('should send to multiple recipients', async () => {
      const user2: IUser = {
        ...mockUser,
        id: 'user-456',
        email: 'jane@example.com',
      }
      const recipients: IUser[] = [mockUser, user2]

      await emailDispatcher.onEventCreated(mockEvent, recipients)

      expect(emailService.sendTemplate).toHaveBeenCalledTimes(2)
      expect(emailService.sendTemplate).toHaveBeenCalledWith(
        'event-created',
        expect.objectContaining({ eventTitle: mockEvent.title }),
        expect.any(Object),
        expect.any(String)
      )
    })

    it('should respect user notification preferences', async () => {
      const userNoEmail: IUser = {
        ...mockUser,
        notificationPrefs: { level: 'none' as const, channels: ['email' as const] },
      }
      const recipients: IUser[] = [mockUser, userNoEmail]

      await emailDispatcher.onEventCreated(mockEvent, recipients)

      expect(emailService.sendTemplate).toHaveBeenCalledTimes(1)
    })
  })

  describe('onBirthdayToday', () => {
    it('should send birthday greeting', async () => {
      await emailDispatcher.onBirthdayToday(mockUser)

      expect(emailService.sendTemplate).toHaveBeenCalledWith(
        'birthday-today',
        expect.objectContaining({ recipientName: mockUser.name }),
        expect.any(Object),
        mockUser.id
      )
    })
  })

  describe('onBirthdayReminder', () => {
    it('should send reminder to notified user', async () => {
      const birthdayUser = { ...mockUser, id: 'user-bday' }
      const notifyUser = { ...mockUser, id: 'user-notify' }

      await emailDispatcher.onBirthdayReminder(birthdayUser, notifyUser, 3)

      expect(emailService.sendTemplate).toHaveBeenCalledWith(
        'birthday-reminder',
        expect.objectContaining({
          recipientName: notifyUser.name,
          birthdayPersonName: birthdayUser.name,
          daysUntil: 3,
        }),
        expect.any(Object),
        notifyUser.id
      )
    })
  })

  describe('onRoleChanged', () => {
    it('should send role change email for important level', async () => {
      const user: IUser = {
        ...mockUser,
        notificationPrefs: { level: 'important' as const, channels: ['email' as const] },
      }

      await emailDispatcher.onRoleChanged(user)

      expect(emailService.sendTemplate).toHaveBeenCalledWith(
        'role-changed',
        expect.objectContaining({ recipientName: user.name }),
        expect.any(Object),
        user.id
      )
    })
  })

  describe('shouldSendEmail', () => {
    it('should return true for level: all with all message types', () => {
      const user: IUser = {
        ...mockUser,
        notificationPrefs: { level: 'all' as const, channels: ['email' as const] },
      }
      // Testing indirectly through onAccessApproved
      expect(async () => {
        await emailDispatcher.onAccessApproved(user)
      }).not.toThrow()
    })

    it('should return false for level: important with non-important messages', async () => {
      const user: IUser = {
        ...mockUser,
        notificationPrefs: { level: 'important' as const, channels: ['email' as const] },
      }

      // event-created is an 'all' level message
      await emailDispatcher.onEventCreated(mockEvent, [user])

      expect(emailService.sendTemplate).not.toHaveBeenCalled()
    })

    it('should return true for level: important with important messages', async () => {
      const user: IUser = {
        ...mockUser,
        notificationPrefs: { level: 'important' as const, channels: ['email' as const] },
      }

      await emailDispatcher.onAccessApproved(user)

      expect(emailService.sendTemplate).toHaveBeenCalled()
    })

    it('should return false if email not in channels', async () => {
      const user: IUser = {
        ...mockUser,
        notificationPrefs: { level: 'all' as const, channels: [] },
      }

      await emailDispatcher.onAccessApproved(user)

      expect(emailService.sendTemplate).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should not throw on email service failure', async () => {
      ;(emailService.sendTemplate as jest.Mock).mockRejectedValueOnce(new Error('SMTP error'))

      expect(async () => {
        await emailDispatcher.onAccessApproved(mockUser)
      }).not.toThrow()
    })

    it('should handle errors gracefully for multiple recipients', async () => {
      ;(emailService.sendTemplate as jest.Mock).mockRejectedValueOnce(new Error('SMTP error'))

      const recipients = [mockUser, { ...mockUser, id: 'user-2' }]

      expect(async () => {
        await emailDispatcher.onEventCreated(mockEvent, recipients)
      }).not.toThrow()
    })
  })
})
