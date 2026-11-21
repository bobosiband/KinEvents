import { randomUUID } from 'crypto'
import { emailDispatcher } from '../src/services/email-dispatcher.service'
import { emailService } from '../src/services/email.service'
import { notificationDispatcher } from '../src/services/notification-dispatcher.service'
import type { IUser } from '../src/interfaces/user.interface'
import type { IEvent } from '../src/interfaces/event.interface'
import type { IAccessRequest } from '../src/interfaces/auth.interface'
import type { INotification } from '../src/interfaces/notification.interface'
import { resetDb } from './helpers/db.helper'
import { getData } from '../src/config/db'

/**
 * Fields every EmailService template validates via `requireString`. Any
 * dispatcher call that omits one or sends a non-string for one would be
 * silently rejected by the Email Service as a ValidationError — exactly the
 * class of bug that broke birthday emails in production on 2026-11-20.
 */
const REQUIRED_STRING_FIELDS: Record<string, readonly string[]> = {
  'access-approved': ['recipientName', 'loginUrl'],
  'welcome': ['recipientName', 'loginUrl'],
  'access-rejected': ['recipientName', 'supportEmail'],
  'access-request': ['requesterName', 'requesterEmail', 'adminUrl'],
  'account-updated': ['recipientName', 'summary'],
  'announcement': ['recipientName', 'title', 'message'],
  'birthday-reminder': ['recipientName', 'birthdayName', 'daysUntil'],
  'birthday-today': ['recipientName', 'birthdayName'],
  'event-cancelled': ['recipientName', 'eventTitle'],
  'event-created': ['recipientName', 'eventTitle', 'eventDate', 'eventUrl'],
  'event-reminder': ['recipientName', 'eventTitle', 'eventUrl', 'daysUntil'],
  'event-updated': ['recipientName', 'eventTitle', 'eventUrl'],
  'role-changed': ['recipientName', 'newRole'],
  'rsvp-confirmation': ['recipientName', 'eventTitle', 'rsvpStatus'],
}

interface CapturedCall {
  templateName: string
  context: Record<string, unknown>
  recipientId: string
}

let captured: CapturedCall[]

function makeUser(overrides: Partial<IUser> = {}): IUser {
  return {
    id: randomUUID(),
    name: 'Alex',
    email: `${randomUUID()}@example.com`,
    role: 'member',
    accessStatus: 'approved',
    capabilities: [],
    notificationPrefs: { level: 'all', channels: ['email'] },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeEvent(createdBy: string): IEvent {
  return {
    id: randomUUID(),
    title: 'Family Reunion',
    description: 'Lunch',
    date: '2026-12-25T13:30:00Z',
    location: 'Durban',
    type: 'custom',
    locked: false,
    createdBy,
    rsvps: {},
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }
}

function makeAccessRequest(): IAccessRequest {
  return {
    id: randomUUID(),
    name: 'New Member',
    email: 'new@example.com',
    message: 'Please let me in',
    status: 'pending',
    requestedAt: '2024-01-01T00:00:00Z',
  } as IAccessRequest
}

function assertRequiredStrings(templateName: string, context: Record<string, unknown>): void {
  const required = REQUIRED_STRING_FIELDS[templateName]
  if (!required) throw new Error(`Test not covering template "${templateName}" — add it to REQUIRED_STRING_FIELDS`)
  for (const field of required) {
    const value = context[field]
    if (typeof value !== 'string' || value.length === 0) {
      throw new Error(`Template "${templateName}" missing required string field "${field}" (got ${typeof value}: ${JSON.stringify(value)})`)
    }
  }
}

describe('EmailService contract: dispatcher payloads match template requirements', () => {
  beforeEach(() => {
    resetDb()
    captured = []
    jest.spyOn(emailService, 'sendTemplate').mockImplementation(async (templateName, context, _recipient, recipientId) => {
      const safe = { ...(context as Record<string, unknown>) }
      captured.push({ templateName, context: safe, recipientId })
      assertRequiredStrings(templateName, safe)
      return true
    })
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('birthday-reminder sends birthdayName (not birthdayPersonName) and stringifies daysUntil', async () => {
    const birthday = makeUser({ name: 'Mom', birthday: '1960-12-01' })
    const notify = makeUser({ name: 'Alex' })
    await emailDispatcher.onBirthdayReminder(birthday, notify, 7)
    expect(captured).toHaveLength(1)
    expect(captured[0].templateName).toBe('birthday-reminder')
    expect(captured[0].context.birthdayName).toBe('Mom')
    expect(captured[0].context.daysUntil).toBe('7')
  })

  it('birthday-today sends birthdayName equal to the celebrant', async () => {
    const user = makeUser({ name: 'Mom' })
    await emailDispatcher.onBirthdayToday(user)
    expect(captured).toHaveLength(1)
    expect(captured[0].context.birthdayName).toBe('Mom')
  })

  it('event-reminder stringifies daysUntil', async () => {
    const creator = makeUser({ name: 'Alex' })
    const event = makeEvent(creator.id)
    await emailDispatcher.onEventReminder(event, [creator], 3)
    expect(captured).toHaveLength(1)
    expect(captured[0].context.daysUntil).toBe('3')
  })

  it('announcement sends title and message (not announcementTitle / announcementBody)', async () => {
    const user = makeUser()
    await emailDispatcher.onAnnouncement('Hello', 'Body text', [user])
    expect(captured).toHaveLength(1)
    expect(captured[0].context.title).toBe('Hello')
    expect(captured[0].context.message).toBe('Body text')
  })

  it('account-updated sends a summary string (not a changedFields array)', async () => {
    const user = makeUser()
    await emailDispatcher.onAccountUpdated(user, ['email', 'phone'])
    expect(captured).toHaveLength(1)
    expect(typeof captured[0].context.summary).toBe('string')
    expect(captured[0].context.summary).toContain('email')
  })

  it('access-request sends adminUrl to each admin', async () => {
    const admin = makeUser({ role: 'admin', email: 'admin@example.com' })
    getData().users.push(admin)
    const request = makeAccessRequest()
    await emailDispatcher.onAccessRequested(request)
    expect(captured).toHaveLength(1)
    expect(captured[0].templateName).toBe('access-request')
    expect(typeof captured[0].context.adminUrl).toBe('string')
  })

  describe('notificationDispatcher.dispatchNotification (scheduled job path)', () => {
    function makeNotification(type: INotification['type'], payload: Record<string, unknown> = {}): INotification {
      return {
        id: randomUUID(),
        type,
        recipientId: 'r1',
        payload,
        createdAt: '2024-01-01T00:00:00Z',
        readBy: [],
      } as unknown as INotification
    }

    it('birthday_reminder populates recipientName from the recipient and stringifies daysUntil', async () => {
      const recipient = makeUser({ name: 'Alex' })
      const notification = makeNotification('birthday_reminder', { name: 'Mom', daysUntil: '7' })
      await notificationDispatcher.dispatchNotification(notification, recipient)
      expect(captured[0].templateName).toBe('birthday-reminder')
      expect(captured[0].context.recipientName).toBe('Alex')
      expect(captured[0].context.birthdayName).toBe('Mom')
      expect(captured[0].context.daysUntil).toBe('7')
    })

    it('birthday_today falls back to recipient name when payload.name is missing', async () => {
      const recipient = makeUser({ name: 'Mom' })
      const notification = makeNotification('birthday_today', {})
      await notificationDispatcher.dispatchNotification(notification, recipient)
      expect(captured[0].context.birthdayName).toBe('Mom')
      expect(captured[0].context.recipientName).toBe('Mom')
    })

    it('event_reminder sends all required strings', async () => {
      const recipient = makeUser({ name: 'Alex' })
      const notification = makeNotification('event_reminder', {
        eventId: 'e1',
        title: 'Lunch',
        date: '2026-12-25T13:30:00Z',
        daysUntil: '3',
      })
      await notificationDispatcher.dispatchNotification(notification, recipient)
      expect(captured[0].templateName).toBe('event-reminder')
      expect(captured[0].context.eventTitle).toBe('Lunch')
      expect(captured[0].context.eventUrl).toMatch(/\/events\/e1$/)
      expect(captured[0].context.daysUntil).toBe('3')
    })
  })

  it('every dispatcher call produces a payload with all required string fields', async () => {
    const admin = makeUser({ role: 'admin', email: 'admin@example.com' })
    const user = makeUser()
    getData().users.push(admin)

    await emailDispatcher.onAccessApproved(user)
    await emailDispatcher.onWelcome(user)
    await emailDispatcher.onAccessRejected(makeAccessRequest())
    await emailDispatcher.onAccountUpdated(user, ['email'])
    await emailDispatcher.onRoleChanged(user)
    await emailDispatcher.onEventCreated(makeEvent(user.id), [user])
    await emailDispatcher.onEventUpdated(makeEvent(user.id), [user], ['date'])
    await emailDispatcher.onEventCancelled(makeEvent(user.id), [user])
    await emailDispatcher.onEventReminder(makeEvent(user.id), [user], 2)
    await emailDispatcher.onRsvpConfirmed(makeEvent(user.id), user, 'yes')
    await emailDispatcher.onBirthdayToday(user)
    await emailDispatcher.onBirthdayReminder(user, user, 5)
    await emailDispatcher.onAnnouncement('t', 'm', [user])
    await emailDispatcher.onAccessRequested(makeAccessRequest())

    // Every one of the above should have survived the assertRequiredStrings
    // check. If any is missing / wrong-typed, the mock impl throws.
    expect(captured.length).toBeGreaterThan(10)
  })
})
