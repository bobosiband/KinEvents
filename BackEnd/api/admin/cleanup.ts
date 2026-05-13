import type { VercelResponse } from '@vercel/node'

import { cleanupService } from '../../src/services/cleanup.service'
import { withAuth, type RequestWithUser } from '../../src/middleware/withAuth'

async function handler(req: RequestWithUser, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  try {
    const deletedNotifications = await cleanupService.deleteOldReadNotifications()
    const deletedEvents = await cleanupService.deleteOldEvents()
    const deletedEmailLogs = await cleanupService.deleteOldEmailLogs()
    const deletedMessages = await cleanupService.deleteOldSoftDeletedMessages()

    res.status(200).json({
      success: true,
      data: { deletedNotifications, deletedEvents, deletedEmailLogs, deletedMessages },
      message: `Cleanup complete: ${deletedNotifications} notifications, ${deletedEvents} events, ${deletedEmailLogs} email logs, ${deletedMessages} messages deleted`,
    })
  } catch (error) {
    console.error('[POST /api/admin/cleanup] Cleanup error:', error)
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' })
  }
}

export default withAuth(handler, 'admin')
