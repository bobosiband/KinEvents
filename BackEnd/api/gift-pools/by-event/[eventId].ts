import type { VercelResponse } from '@vercel/node'
import { giftPoolService } from '../../../src/services/giftPool.service'
import { withAuth, type RequestWithUser } from '../../../src/middleware/withAuth'

async function handler(req: RequestWithUser, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  const queryEventId = typeof req.query.eventId === 'string' ? req.query.eventId : undefined
  const paramsEventId = (req as unknown as { params?: Record<string, unknown> }).params?.eventId
  const eventId = queryEventId ?? (typeof paramsEventId === 'string' ? paramsEventId : undefined)
  if (!eventId) {
    res.status(400).json({ success: false, message: 'Missing eventId' })
    return
  }

  const pool = await giftPoolService.getPoolByEvent(eventId)
  if (!pool) {
    res.status(200).json({ success: true, data: null })
    return
  }

  try {
    const status = await giftPoolService.getPoolStatus(pool.id)
    res.status(200).json({ success: true, data: status })
  } catch (error) {
    res.status(404).json({ success: false, message: (error as Error).message })
  }
}

export default withAuth(handler)
