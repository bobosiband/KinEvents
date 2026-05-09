import type { VercelResponse } from '@vercel/node'

import { notificationService } from '../../../src/services/notification.service'
import { withAuth, type RequestWithUser } from '../../../src/middleware/withAuth'

/**
 * Marks a notification as read by the current user.
 * @param req Incoming request object with authenticated user.
 * @param res Vercel response object.
 */
async function handler(req: RequestWithUser, res: VercelResponse) {
  if (req.method !== 'PATCH') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  const queryId = req.query?.id
  const paramsId = (req as unknown as { params?: Record<string, unknown> }).params?.id
  const id = typeof paramsId === 'string' ? paramsId : typeof queryId === 'string' ? queryId : undefined

  if (!id) {
    res.status(400).json({ success: false, message: 'Invalid notification id' })
    return
  }

  try {
    const notification = await notificationService.markAsReadByUser(id, req.user?.id || '')
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
