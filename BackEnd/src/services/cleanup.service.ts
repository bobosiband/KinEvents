import { getData, persistData } from '../config/db'

export class CleanupService {
  /**
   * Deletes notifications that were read more than 1 hour ago.
   */
  async deleteOldReadNotifications(): Promise<number> {
    const db = getData()
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const before = db.notifications.length

    db.notifications = db.notifications.filter((n) => {
      if (!n.readAt) return true
      return n.readAt > oneHourAgo
    })

    const deleted = before - db.notifications.length
    if (deleted > 0) {
      await persistData()
    }

    return deleted
  }

  /**
   * Deletes events whose date was more than 1 day ago.
   * Keeps locked events.
   */
  async deleteOldEvents(): Promise<number> {
    const db = getData()
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const before = db.events.length

    db.events = db.events.filter((e) => {
      if (e.date > oneDayAgo) return true
      if (e.locked) return true
      return false
    })

    const deleted = before - db.events.length
    if (deleted > 0) {
      await persistData()
    }

    return deleted
  }
}

export const cleanupService = new CleanupService()
