import type { VercelResponse } from '@vercel/node'

import { notificationService } from '../../src/services/notification.service'
import { withAuth, type RequestWithUser } from '../../src/middleware/withAuth'

async function handler(req: RequestWithUser, res: VercelResponse) {
  const { id } = req.query

  if (typeof id !== 'string') {
    res.status(400).json({ success: false, message: 'Invalid notification id' })
    return
  }

  // Handle /api/notifications/:id/read - id will be "uuid/read"
  const isReadEndpoint = id.includes('/')
  const actualId = isReadEndpoint ? id.split('/')[0] : id

  if (isReadEndpoint && id.endsWith('/read')) {
    if (req.method === 'PATCH') {
      // Mark as read endpoint
      const notification = await notificationService.markAsReadByUser(actualId, req.user?.id || '')
      if (!notification) {
        res.status(404).json({ success: false, message: 'Notification not found' })
        return
      }

      res.status(200).json({ success: true, data: notification })
      return
    }

    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  res.status(405).json({ success: false, message: 'Method not allowed' })
}

export default withAuth(handler)
