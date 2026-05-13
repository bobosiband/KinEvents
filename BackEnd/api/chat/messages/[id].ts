import type { VercelResponse } from '@vercel/node'

import { messageService } from '../../../src/services/message.service'
import { withAuth, type RequestWithUser } from '../../../src/middleware/withAuth'

async function handler(req: RequestWithUser, res: VercelResponse) {
  if (req.method !== 'DELETE') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  const id =
    typeof req.query.id === 'string'
      ? req.query.id
      : typeof (req as any).params?.id === 'string'
        ? (req as any).params.id
        : Array.isArray(req.query.id)
          ? req.query.id[0]
          : undefined

  const messageId = id?.trim()
  if (!messageId) {
    res.status(400).json({ success: false, message: 'Missing id' })
    return
  }

  try {
    const deleted = await messageService.deleteMessage(messageId, req.user!.id, req.user!.role)
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Not found' })
      return
    }

    res.status(200).json({ success: true, data: deleted })
  } catch (err) {
    if ((err as Error).message === 'Forbidden') {
      res.status(403).json({ success: false, message: 'Forbidden' })
      return
    }
    res.status(400).json({ success: false, message: (err as Error).message })
  }
}

export default withAuth(handler)
