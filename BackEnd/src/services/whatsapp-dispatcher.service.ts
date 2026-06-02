import type { IEvent } from '../interfaces/event.interface'
import type { IAccessRequest } from '../interfaces/auth.interface'
import type { INotification } from '../interfaces/notification.interface'
import type { IUser, NotificationLevel, NotificationChannel } from '../interfaces/user.interface'
import { whatsappService } from './whatsapp.service'

function getPrimaryPhoneNumber(user: IUser): string | undefined {
  return user.phoneNumber || user.phone
}

function hasChannel(user: IUser, channel: NotificationChannel): boolean {
  const prefs = user.notificationPrefs?.channels ?? []
  return prefs.includes(channel)
}

function shouldSendWhatsApp(user: IUser, messageLevel: NotificationLevel): boolean {
  if (!hasChannel(user, 'whatsapp')) {
    return false
  }

  const preferences = user.notificationPreferences
  if (preferences?.whatsapp === false) {
    return false
  }

  if (user.notificationPrefs?.level === 'none') {
    return false
  }

  if (user.notificationPrefs?.level === 'important' && messageLevel !== 'important') {
    return false
  }

  return Boolean(getPrimaryPhoneNumber(user))
}

function getMessageLevel(type: INotification['type']): NotificationLevel {
  return type === 'access_approved' || type === 'access_rejected' ? 'important' : 'all'
}

export class WhatsAppDispatcherService {
  async dispatchNotification(notification: INotification, recipient: IUser): Promise<void> {
    if (!shouldSendWhatsApp(recipient, getMessageLevel(notification.type))) {
      console.log(`[WhatsApp] Skipping ${notification.type} for ${recipient.id} - user preferences or missing phone`)
      return
    }

    try {
      const phone = getPrimaryPhoneNumber(recipient)
      if (!phone) {
        return
      }

      const templateName = this.getTemplateName(notification.type)
      if (!templateName) {
        console.log(`[WhatsApp] No template for ${notification.type} - skipping ${recipient.id}`)
        return
      }

      await this.sendTemplateForNotification(notification, recipient, templateName, phone)
    } catch (error) {
      console.error(`[WhatsApp] dispatchNotification failed for ${recipient.id}:`, error)
    }
  }

  async onWelcome(user: IUser): Promise<void> {
    if (!shouldSendWhatsApp(user, 'all')) {
      console.log(`[WhatsApp] Skipping welcome for ${user.id} - user preferences or missing phone`)
      return
    }

    const phone = getPrimaryPhoneNumber(user)
    if (!phone) return
    await whatsappService.sendWelcomeMessage({ name: user.name, phone }, user.id)
  }

  async onAccessApproved(user: IUser): Promise<void> {
    if (!shouldSendWhatsApp(user, 'important')) {
      console.log(`[WhatsApp] Skipping access-approved for ${user.id} - user preferences or missing phone`)
      return
    }

    const phone = getPrimaryPhoneNumber(user)
    if (!phone) return
    await whatsappService.sendAccessApproved({ name: user.name, phone }, user.id)
  }

  async onBirthdayReminder(birthdayUser: IUser, notifyUser: IUser, daysRemaining: number): Promise<void> {
    if (!shouldSendWhatsApp(notifyUser, 'all')) {
      console.log(`[WhatsApp] Skipping birthday-reminder for ${notifyUser.id} - user preferences or missing phone`)
      return
    }

    const phone = getPrimaryPhoneNumber(notifyUser)
    if (!phone) return
    await whatsappService.sendBirthdayReminder({ name: notifyUser.name, phone }, birthdayUser.name, daysRemaining, notifyUser.id)
  }

  async onBirthdayToday(user: IUser): Promise<void> {
    if (!shouldSendWhatsApp(user, 'all')) {
      console.log(`[WhatsApp] Skipping happy-birthday for ${user.id} - user preferences or missing phone`)
      return
    }

    const phone = getPrimaryPhoneNumber(user)
    if (!phone) return
    await whatsappService.sendHappyBirthday({ name: user.name, phone }, user.id)
  }

  async onEventReminder(event: IEvent, recipients: IUser[], daysRemaining: number): Promise<void> {
    for (const recipient of recipients) {
      if (!shouldSendWhatsApp(recipient, 'all')) {
        console.log(`[WhatsApp] Skipping event-reminder for ${recipient.id} - user preferences or missing phone`)
        continue
      }

      const phone = getPrimaryPhoneNumber(recipient)
      if (!phone) continue

      await whatsappService.sendEventReminder({ name: recipient.name, phone }, event.title, event.date, recipient.id)
    }
  }

  async onGiftPoolReminder(birthdayUser: IUser, recipients: IUser[]): Promise<void> {
    for (const recipient of recipients) {
      if (!shouldSendWhatsApp(recipient, 'all')) {
        console.log(`[WhatsApp] Skipping gift-pool-reminder for ${recipient.id} - user preferences or missing phone`)
        continue
      }

      const phone = getPrimaryPhoneNumber(recipient)
      if (!phone) continue

      await whatsappService.sendGiftPoolReminder({ name: recipient.name, phone }, birthdayUser.name, recipient.id)
    }
  }

  async onAccessRejected(request: IAccessRequest): Promise<void> {
    console.log(`[WhatsApp] access-rejected template is not available - skipping ${request.id}`)
  }

  private async sendTemplateForNotification(
    notification: INotification,
    recipient: IUser,
    templateName: Parameters<typeof whatsappService.sendTemplate>[0],
    phone: string
  ): Promise<void> {
    const recipientPayload = { name: recipient.name, phone }

    switch (templateName) {
      case 'event_reminder':
        await whatsappService.sendEventReminder(
          recipientPayload,
          String(notification.payload.title ?? notification.payload.eventTitle ?? ''),
          String(notification.payload.date ?? ''),
          recipient.id
        )
        return
      case 'birthday_reminder':
        await whatsappService.sendBirthdayReminder(
          recipientPayload,
          String(notification.payload.name ?? notification.payload.birthdayPersonName ?? ''),
          Number(notification.payload.daysUntil ?? notification.payload.daysRemaining ?? 0),
          recipient.id
        )
        return
      case 'gift_pool_reminder':
        await whatsappService.sendGiftPoolReminder(
          recipientPayload,
          String(notification.payload.name ?? notification.payload.birthdayPersonName ?? ''),
          recipient.id
        )
        return
      case 'access_approved':
        await whatsappService.sendAccessApproved(recipientPayload, recipient.id)
        return
      case 'welcome':
        await whatsappService.sendWelcomeMessage(recipientPayload, recipient.id)
        return
      case 'happy_birthday':
        await whatsappService.sendHappyBirthday(recipientPayload, recipient.id)
        return
      default:
        return
    }
  }

  private getTemplateName(type: INotification['type']): Parameters<typeof whatsappService.sendTemplate>[0] | null {
    switch (type) {
      case 'birthday_reminder':
        return 'birthday_reminder'
      case 'birthday_today':
        return 'happy_birthday'
      case 'event_reminder':
        return 'event_reminder'
      case 'access_approved':
        return 'access_approved'
      case 'gift_pool_reminder':
        return 'gift_pool_reminder'
      default:
        return null
    }
  }
}

export const whatsappDispatcher = new WhatsAppDispatcherService()
