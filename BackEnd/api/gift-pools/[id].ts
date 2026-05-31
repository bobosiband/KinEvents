import type { VercelResponse } from '@vercel/node'
import { giftPoolService } from '../../src/services/giftPool.service'
import { withAuth, type RequestWithUser } from '../../src/middleware/withAuth'

async function handler(req: RequestWithUser, res: VercelResponse) {
  const id = typeof req.query.id === 'string' ? req.query.id : undefined
  if (!id) {
    res.status(400).json({ success: false, message: 'Missing pool id' })
    return
  }

  if (req.method === 'GET') {
    try {
      const status = await giftPoolService.getPoolStatus(id)
      res.status(200).json({ success: true, data: status })
    } catch (error) {
      res.status(404).json({ success: false, message: (error as Error).message })
    }
    return
  }

  if (req.method === 'PATCH') {
    // Close pool — admin only
    if (req.user?.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Insufficient permissions' })
      return
    }
    try {
      const pool = await giftPoolService.closePool(id)
      res.status(200).json({ success: true, data: pool, message: 'Pool closed' })
    } catch (error) {
      res.status(404).json({ success: false, message: (error as Error).message })
    }
    return
  }

  res.status(405).json({ success: false, message: 'Method not allowed' })
}

export default withAuth(handler)
