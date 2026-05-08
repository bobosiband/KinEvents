import type { VercelResponse } from '@vercel/node'

import { notificationService } from '../../src/services/notification.service'
import { withAuth, type RequestWithUser } from '../../src/middleware/withAuth'

async function handler(req: RequestWithUser, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  const notifications = await notificationService.listNotifications()
  const visibleNotifications =
    req.user?.role === 'admin'
      ? notifications
      : notifications.filter((notification) => notification.recipientId === req.user?.id)

  res.status(200).json({ success: true, data: visibleNotifications })
}

export default withAuth(handler)
