import type { VercelResponse } from '@vercel/node'

import { notificationService } from '../../src/services/notification.service'
import { withAuth, type RequestWithUser } from '../../src/middleware/withAuth'

/**
 * Marks a notification as read by the current user.
 * Accepts notificationId as a query parameter.
 * @param req Incoming request object with authenticated user.
 * @param res Vercel response object.
 */
async function handler(req: RequestWithUser, res: VercelResponse) {
  if (req.method !== 'PATCH') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  const notificationId = req.body?.notificationId || req.query?.notificationId

  if (!notificationId || typeof notificationId !== 'string') {
    res.status(400).json({ success: false, message: 'Missing or invalid notificationId' })
    return
  }

  try {
    const notification = await notificationService.markAsReadByUser(notificationId, req.user?.id || '')
    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' })
      return
    }

    res.status(200).json({ success: true, data: notification })
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message })
  }
}

export default withAuth(handler)
