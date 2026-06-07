import { env } from '../config/env'
import { buildEmailContent } from '../utils/emailTemplates'
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

function buildNotificationContext(notification: INotification): Record<string, string | number | undefined> {
  return {
    appUrl: env.APP_URL,
    eventTitle: notification.payload.title ?? notification.payload.eventTitle,
    eventDate: notification.payload.date ?? notification.payload.eventDate,
    daysUntil: notification.payload.daysUntil ?? notification.payload.daysRemaining,
    birthdayName: notification.payload.name ?? notification.payload.birthdayPersonName,
    birthdayPersonName: notification.payload.name ?? notification.payload.birthdayPersonName,
    recipientName: notification.payload.recipientName,
  }
}

export class NotificationDispatcherService {
  async dispatchNotification(notification: INotification, recipient: IUser): Promise<void> {
    const messageLevel = getMessageLevel(notification.type)
    const context = buildNotificationContext(notification)

    if (shouldSendChannel(recipient, 'email', messageLevel)) {
      try {
        const { subject, text, html } = buildEmailContent(notification.type, context as never)
        await emailService.send(
          {
            to: { name: recipient.name, email: recipient.email },
            subject,
            html,
            text,
          },
          { templateName: this.mapEmailTemplate(notification.type), recipientId: recipient.id }
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
