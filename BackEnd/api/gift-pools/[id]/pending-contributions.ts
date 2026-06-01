import type { VercelResponse } from '@vercel/node'
import { giftPoolService } from '../../../src/services/giftPool.service'
import { withAuth, type RequestWithUser } from '../../../src/middleware/withAuth'

async function handler(req: RequestWithUser, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  const queryId = typeof req.query.id === 'string' ? req.query.id : undefined
  const paramsId = (req as unknown as { params?: Record<string, unknown> }).params?.id
  const poolId = queryId ?? (typeof paramsId === 'string' ? paramsId : undefined)
  if (!poolId) {
    res.status(400).json({ success: false, message: 'Missing pool id' })
    return
  }

  try {
    const list = await giftPoolService.listPendingContributions(poolId)
    res.status(200).json({ success: true, data: list })
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message })
  }
}

export default withAuth(handler, 'admin')
