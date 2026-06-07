import { randomUUID } from 'crypto'

import { readData, persistData } from '../config/db'
import type { NotificationStatus, NotificationType, INotification } from '../interfaces/notification.interface'
import { notificationDispatcher } from './notification-dispatcher.service'

export interface CreateNotificationInput {
  type: NotificationType
  recipientId: string
  payload: Record<string, string>
  status?: NotificationStatus
}

export class NotificationService {
  async listNotifications(userId?: string): Promise<Array<INotification & { isRead?: boolean }>> {
    const db = await readData()
    const notifications = db.notifications
    
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
    const db = await readData()
    const notification: INotification = {
      id: randomUUID(),
      type: input.type,
      recipientId: input.recipientId,
      payload: input.payload,
      status: input.status ?? 'pending',
      createdAt: new Date().toISOString(),
    }
    db.notifications.push(notification)
    await persistData()

    // Fire-and-forget dispatch through the central notification dispatcher.
    if (notification.status !== 'pending') {
      return notification
    }

    try {
      const recipient = db.users.find((u) => u.id === input.recipientId)
      if (recipient) {
        await notificationDispatcher.dispatchNotification(notification, recipient)
        await this.markAsSent(notification.id)
      }
    } catch (err) {
      console.error('[NOTIFICATION] Dispatch error:', err)
      await this.markAsFailed(notification.id)
    }

    return notification
  }

  async markAsReadByUser(notificationId: string, userId: string): Promise<INotification | null> {
    const db = await readData()
    const notification = db.notifications.find((item) => item.id === notificationId)
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
    const db = await readData()
    const notification = db.notifications.find((item) => item.id === id)
    if (!notification) return null
    notification.status = 'sent'
    notification.sentAt = new Date().toISOString()
    await persistData()
    return notification
  }

  async markAsFailed(id: string): Promise<INotification | null> {
    const db = await readData()
    const notification = db.notifications.find((item) => item.id === id)
    if (!notification) return null
    notification.status = 'failed'
    await persistData()
    return notification
  }
}

export const notificationService = new NotificationService()
