import type { INotification } from '../interfaces/notification.interface'
import { BaseRepository } from './base.repository'

export class NotificationRepository extends BaseRepository<'notifications', INotification> {
  constructor() {
    super('notifications')
  }

  /**
   * Returns every notification for the given recipient.
    * @param recipientId Recipient user identifier.
    * @returns Every notification for the recipient.
   */
  findByRecipientId(recipientId: string): INotification[] {
    return this.findWhere((notification) => notification.recipientId === recipientId)
  }

  /**
   * Returns every notification with the requested delivery status.
    * @param status Delivery status to match.
    * @returns Every notification that matches the status.
   */
  findByStatus(status: INotification['status']): INotification[] {
    return this.findWhere((notification) => notification.status === status)
  }
}

export const notificationRepository = new NotificationRepository()