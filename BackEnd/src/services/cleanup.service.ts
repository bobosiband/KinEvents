import { readData, persistData } from '../config/db'

export class CleanupService {
  private static readonly ReadNotificationRetentionDays: number = 30
  private static readonly AccessRequestHistoryRetentionDays: number = 30
  private static readonly EmailLogRetentionDays: number = 30

  /**
   * Deletes only READ notifications older than 30 days. Unread notifications
   * stay forever regardless of age so a quiet account never loses its backlog.
   */
  async deleteOldReadNotifications(): Promise<number> {
    const db = await readData()
    const cutoff = new Date(Date.now() - CleanupService.ReadNotificationRetentionDays * 24 * 60 * 60 * 1000).toISOString()
    const before = db.notifications.length
    const previousNotifications = [...db.notifications]

    db.notifications = db.notifications.filter((n) => {
      const isRead = Array.isArray(n.readBy) && n.readBy.length > 0
      if (!isRead) return true
      return n.createdAt > cutoff
    })

    const deleted = before - db.notifications.length
    if (deleted > 0) {
      try {
        await persistData()
      } catch (error) {
        db.notifications = previousNotifications
        throw error
      }
    }

    return deleted
  }

  /**
   * Past events are kept forever — they're history, not noise. This method
   * stays so the admin cleanup button and existing callers keep working, but
   * it never deletes anything.
   */
  async deleteOldEvents(): Promise<number> {
    return 0
  }

  /**
   * Chat messages are history and are never auto-deleted. Kept as a no-op
   * so the admin cleanup button keeps working.
   */
  async deleteOldMessages(): Promise<number> {
    return 0
  }

  /**
   * Deletes legacy Mongo email logs older than 30 days. New email logs live
   * in the EmailService DynamoDB table with its own TTL, so this method only
   * drains the old Mongo rows during the migration window.
   */
  async deleteOldEmailLogs(): Promise<number> {
    const db = await readData()
    const cutoff = new Date(Date.now() - CleanupService.EmailLogRetentionDays * 24 * 60 * 60 * 1000).toISOString()
    const before = db.emailLogs.length
    const previousEmailLogs = [...db.emailLogs]

    db.emailLogs = db.emailLogs.filter((log) => log.createdAt > cutoff)

    const deleted = before - db.emailLogs.length
    if (deleted > 0) {
      try {
        await persistData()
      } catch (error) {
        db.emailLogs = previousEmailLogs
        throw error
      }
    }

    return deleted
  }

  async deleteOldAccessRequestHistory(): Promise<number> {
    const db = await readData()
    const cutoff = new Date(Date.now() - CleanupService.AccessRequestHistoryRetentionDays * 24 * 60 * 60 * 1000).toISOString()
    const before = db.accessRequestHistory.length
    const previousAccessRequestHistory = [...db.accessRequestHistory]

    db.accessRequestHistory = db.accessRequestHistory.filter((entry) => {
      const timestamp = entry.resolvedAt ?? entry.requestedAt
      return timestamp > cutoff
    })

    const deleted = before - db.accessRequestHistory.length
    if (deleted > 0) {
      try {
        await persistData()
      } catch (error) {
        db.accessRequestHistory = previousAccessRequestHistory
        throw error
      }
    }

    return deleted
  }
}

export const cleanupService = new CleanupService()
