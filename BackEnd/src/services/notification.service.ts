import { randomUUID } from 'crypto'

import { getData, persistData } from '../config/db'
import type { NotificationStatus, NotificationType, INotification } from '../interfaces/notification.interface'
import { emailService } from './email.service'
import { buildEmailContent } from '../utils/emailTemplates'
import { env } from '../config/env'

export interface CreateNotificationInput {
  type: NotificationType
  recipientId: string
  payload: Record<string, string>
  status?: NotificationStatus
}

export class NotificationService {
  async listNotifications(userId?: string): Promise<Array<INotification & { isRead?: boolean }>> {
    const notifications = getData().notifications
    
    if (!userId) {
      return notifications
    }

    // Attach isRead field for the given user
    return notifications.map((notification) => ({
      ...notification,
      isRead: notification.readBy?.includes(userId) ?? false,
    }))
  }

  async createNotification(input: CreateNotificationInput): Promise<INotification> {
    const notification: INotification = {
      id: randomUUID(),
      type: input.type,
      recipientId: input.recipientId,
      payload: input.payload,
      status: input.status ?? 'pending',
      createdAt: new Date().toISOString(),
    }
    getData().notifications.push(notification)
    await persistData()

    // Fire-and-forget email dispatch
    try {
      const recipient = getData().users.find((u) => u.id === input.recipientId)
      if (recipient?.email) {
        const ctx: any = {
          appUrl: env.APP_URL,
          eventTitle: input.payload.title,
          eventDate: input.payload.date,
          daysUntil: input.payload.daysUntil,
          birthdayName: input.payload.name,
        }
        const { subject, text, html } = buildEmailContent(input.type as NotificationType, ctx)
        const templateMap: Record<string, string> = {
          event_created: 'event-created',
          event_updated: 'event-updated',
          event_reminder: 'event-reminder',
          birthday_reminder: 'birthday-reminder',
          birthday_today: 'birthday-today',
          access_approved: 'access-approved',
          access_rejected: 'access-rejected',
        }

        const payload = {
          to: { name: recipient.name, email: recipient.email },
          subject,
          html,
          text,
        }

        emailService
          .send(payload, { templateName: (templateMap[input.type] as any) || 'announcement', recipientId: recipient.id })
          .then((sent) => {
            if (sent) notificationService.markAsSent(notification.id).catch(() => {})
            else notificationService.markAsFailed(notification.id).catch(() => {})
          })
          .catch((err) => console.error('[NOTIFICATION] Email dispatch error:', err))
      }
    } catch (err) {
      console.error('[NOTIFICATION] Email preparation error:', err)
    }

    return notification
  }

  async markAsReadByUser(notificationId: string, userId: string): Promise<INotification | null> {
    const notification = getData().notifications.find((item) => item.id === notificationId)
    if (!notification) return null
    
    if (!notification.readBy) {
      notification.readBy = []
    }
    
    if (!notification.readBy.includes(userId)) {
      notification.readBy.push(userId)
      if (!notification.readAt) {
        notification.readAt = new Date().toISOString()
      }
      await persistData()
    }
    
    return notification
  }

  async markAsSent(id: string): Promise<INotification | null> {
    const notification = getData().notifications.find((item) => item.id === id)
    if (!notification) return null
    notification.status = 'sent'
    notification.sentAt = new Date().toISOString()
    await persistData()
    return notification
  }

  async markAsFailed(id: string): Promise<INotification | null> {
    const notification = getData().notifications.find((item) => item.id === id)
    if (!notification) return null
    notification.status = 'failed'
    await persistData()
    return notification
  }
}

export const notificationService = new NotificationService()