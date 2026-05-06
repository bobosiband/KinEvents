import { randomUUID } from 'crypto'

import type { NotificationStatus, NotificationType, INotification } from '../interfaces/notification.interface'
import { notificationRepository } from '../repositories/notification.repository'

export interface CreateNotificationInput {
  type: NotificationType
  recipientId: string
  payload: Record<string, string>
  status?: NotificationStatus
}

export class NotificationService {
  /**
   * Returns every stored notification.
    * @returns All notifications.
   */
  listNotifications(): INotification[] {
    return notificationRepository.findAll()
  }

  /**
   * Creates a new notification record.
    * @param input Notification payload.
    * @returns The created notification.
   */
  createNotification(input: CreateNotificationInput): INotification {
    const notification: INotification = {
      id: randomUUID(),
      type: input.type,
      recipientId: input.recipientId,
      payload: input.payload,
      status: input.status ?? 'pending',
      createdAt: new Date().toISOString(),
    }

    return notificationRepository.insert(notification)
  }

  /**
   * Marks a notification as sent.
    * @param id Notification identifier.
    * @returns The updated notification, or null when no notification exists.
   */
  markAsSent(id: string): INotification | null {
    return notificationRepository.update(id, {
      status: 'sent',
      sentAt: new Date().toISOString(),
    })
  }

  /**
   * Marks a notification as failed.
    * @param id Notification identifier.
    * @returns The updated notification, or null when no notification exists.
   */
  markAsFailed(id: string): INotification | null {
    return notificationRepository.update(id, {
      status: 'failed',
    })
  }
}

export const notificationService = new NotificationService()