import { randomUUID } from 'crypto'

import { getData, persistData } from '../config/db'
import type { NotificationStatus, NotificationType, INotification } from '../interfaces/notification.interface'

export interface CreateNotificationInput {
  type: NotificationType
  recipientId: string
  payload: Record<string, string>
  status?: NotificationStatus
}

export class NotificationService {
  async listNotifications(): Promise<INotification[]> {
    return getData().notifications
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