import type { VercelResponse } from '@vercel/node'

import { messageService } from '../../src/services/message.service'
import { withAuth, type RequestWithUser } from '../../src/middleware/withAuth'

async function handler(req: RequestWithUser, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  const count = await messageService.getUnreadCount(req.user!.id)
  res.status(200).json({ success: true, data: { count } })
}

export default withAuth(handler)
