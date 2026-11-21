import { env } from '../config/env'
import { emailService } from './email.service'
import { emailDispatcher } from './email-dispatcher.service'
import { whatsappDispatcher } from './whatsapp-dispatcher.service'
import type { EmailTemplateName } from '../interfaces/email.interface'
import type { IEvent, RSVPStatus } from '../interfaces/event.interface'
import type { IAccessRequest } from '../interfaces/auth.interface'
import type { INotification } from '../interfaces/notification.interface'
import type { IUser, NotificationLevel, NotificationChannel } from '../interfaces/user.interface'

function hasChannel(user: IUser, channel: NotificationChannel): boolean {
  return (user.notificationPrefs?.channels ?? []).includes(channel)
}

function shouldSendChannel(user: IUser, channel: NotificationChannel, messageLevel: NotificationLevel): boolean {
  if (!hasChannel(user, channel)) {
    return false
  }

  const preferences = user.notificationPreferences
  if (channel === 'email' && preferences?.email === false) {
    return false
  }
  if (channel === 'whatsapp' && preferences?.whatsapp === false) {
    return false
  }
  if (user.notificationPrefs?.level === 'none') {
    return false
  }
  if (user.notificationPrefs?.level === 'important' && messageLevel !== 'important') {
    return false
  }
  return true
}

function getMessageLevel(type: INotification['type']): NotificationLevel {
  return type === 'access_approved' || type === 'access_rejected' ? 'important' : 'all'
}

/**
 * Builds the `data` payload that EmailService's template registry will
 * validate. Every required `requireString` field on the matching template
 * must be a non-empty string in the returned record. The recipient is
 * always the current user being dispatched to — that's where recipientName
 * comes from (notification.payload rarely carries it).
 *
 * Keep this in lockstep with EmailService/src/templates/*Template.ts and
 * tests/emailContract.test.ts; the contract test fails loudly on drift.
 */
function buildEmailContextFor(
  notification: INotification,
  recipient: IUser,
): Record<string, string> {
  const payload = notification.payload as Record<string, unknown>
  const asString = (v: unknown): string => (typeof v === 'string' && v.length > 0 ? v : '')

  const base: Record<string, string> = {
    recipientName: recipient.name,
    appUrl: env.APP_URL,
  }

  const eventTitle = asString(payload.title ?? payload.eventTitle)
  const eventId = asString(payload.eventId)
  const eventUrl = eventId ? `${env.APP_URL.replace(/\/$/, '')}/events/${eventId}` : env.APP_URL
  const daysUntil = asString(payload.daysUntil ?? payload.daysRemaining)
  const birthdayName = asString(payload.name ?? payload.birthdayPersonName)

  switch (notification.type) {
    case 'event_created':
      return {
        ...base,
        eventTitle,
        eventDate: asString(payload.date ?? payload.eventDate),
        eventUrl,
      }
    case 'event_updated':
      return { ...base, eventTitle, eventUrl }
    case 'event_reminder':
      return { ...base, eventTitle, eventUrl, daysUntil }
    case 'birthday_reminder':
      return { ...base, birthdayName, daysUntil }
    case 'birthday_today':
      return { ...base, birthdayName: birthdayName || recipient.name }
    case 'access_approved':
      return { ...base, loginUrl: `${env.APP_URL.replace(/\/$/, '')}/login` }
    case 'access_rejected':
      return { ...base, supportEmail: 'kinfamevents@gmail.com' }
    case 'rsvp_received':
      return {
        ...base,
        eventTitle,
        rsvpStatus: asString(payload.rsvpStatus ?? payload.status),
      }
    case 'gift_pool_reminder':
      return {
        ...base,
        title: asString(payload.title) || 'Gift pool reminder',
        message: asString(payload.message) || `Gift pool reminder for ${birthdayName}`,
      }
    case 'contribution_verified':
    case 'contribution_rejected':
    default:
      return {
        ...base,
        title: asString(payload.title) || 'KinEvents notification',
        message: asString(payload.message) || asString(payload.body) || 'You have a new update.',
      }
  }
}

export class NotificationDispatcherService {
  async dispatchNotification(notification: INotification, recipient: IUser): Promise<void> {
    const messageLevel = getMessageLevel(notification.type)

    if (shouldSendChannel(recipient, 'email', messageLevel)) {
      try {
        await emailService.sendTemplate(
          this.mapEmailTemplate(notification.type),
          buildEmailContextFor(notification, recipient),
          { name: recipient.name, email: recipient.email },
          recipient.id,
        )
      } catch (error) {
        console.error(`[NotificationDispatcher] Email dispatch failed for ${recipient.id}:`, error)
      }
    }

    if (shouldSendChannel(recipient, 'whatsapp', messageLevel)) {
      await whatsappDispatcher.dispatchNotification(notification, recipient)
    }
  }

  async onWelcome(user: IUser): Promise<void> {
    await Promise.all([
      emailDispatcher.onWelcome(user),
      whatsappDispatcher.onWelcome(user),
    ])
  }

  async onAccessApproved(user: IUser): Promise<void> {
    await Promise.all([
      emailDispatcher.onAccessApproved(user),
      whatsappDispatcher.onAccessApproved(user),
    ])
  }

  async onAccessRejected(request: IAccessRequest): Promise<void> {
    await emailDispatcher.onAccessRejected(request)
    await whatsappDispatcher.onAccessRejected(request)
  }

  async onEventCreated(event: IEvent, recipients: IUser[]): Promise<void> {
    await emailDispatcher.onEventCreated(event, recipients)
  }

  async onEventUpdated(event: IEvent, recipients: IUser[], changes: string[]): Promise<void> {
    await emailDispatcher.onEventUpdated(event, recipients, changes)
  }

  async onEventCancelled(event: IEvent, recipients: IUser[]): Promise<void> {
    await emailDispatcher.onEventCancelled(event, recipients)
  }

  async onEventReminder(event: IEvent, recipients: IUser[], daysUntil: number): Promise<void> {
    await Promise.all([
      emailDispatcher.onEventReminder(event, recipients, daysUntil),
      whatsappDispatcher.onEventReminder(event, recipients, daysUntil),
    ])
  }

  async onRsvpConfirmed(event: IEvent, user: IUser, status: RSVPStatus): Promise<void> {
    await emailDispatcher.onRsvpConfirmed(event, user, status)
  }

  async onBirthdayToday(user: IUser): Promise<void> {
    await Promise.all([
      emailDispatcher.onBirthdayToday(user),
      whatsappDispatcher.onBirthdayToday(user),
    ])
  }

  async onBirthdayReminder(birthdayUser: IUser, notifyUser: IUser, daysUntil: number): Promise<void> {
    await Promise.all([
      emailDispatcher.onBirthdayReminder(birthdayUser, notifyUser, daysUntil),
      whatsappDispatcher.onBirthdayReminder(birthdayUser, notifyUser, daysUntil),
    ])
  }

  async onGiftPoolReminder(birthdayUser: IUser, recipients: IUser[]): Promise<void> {
    await whatsappDispatcher.onGiftPoolReminder(birthdayUser, recipients)
  }

  async onAnnouncement(
    title: string,
    body: string,
    recipients: IUser[],
    priority: 'normal' | 'important' = 'normal'
  ): Promise<void> {
    await emailDispatcher.onAnnouncement(title, body, recipients, priority)
  }

  async onAccessRequested(request: IAccessRequest): Promise<void> {
    await emailDispatcher.onAccessRequested(request)
  }

  private mapEmailTemplate(type: INotification['type']): EmailTemplateName {
    switch (type) {
      case 'event_created':
        return 'event-created'
      case 'event_updated':
        return 'event-updated'
      case 'event_reminder':
        return 'event-reminder'
      case 'birthday_reminder':
        return 'birthday-reminder'
      case 'birthday_today':
        return 'birthday-today'
      case 'access_approved':
        return 'access-approved'
      case 'access_rejected':
        return 'access-rejected'
      case 'rsvp_received':
        return 'rsvp-confirmation'
      case 'gift_pool_reminder':
        return 'announcement'
      case 'contribution_verified':
      case 'contribution_rejected':
      default:
        return 'announcement'
    }
  }
}

export const notificationDispatcher = new NotificationDispatcherService()
