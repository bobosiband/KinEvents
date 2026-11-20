import type { VercelResponse } from '@vercel/node'
import { giftPoolService } from '../../src/services/giftPool.service'
import { withAuth, type RequestWithUser } from '../../src/middleware/withAuth'
import { applyPolicy } from '../../src/middleware/applyPolicy'
import { RolePolicy } from '../../src/auth/policies/RolePolicy'

async function handler(req: RequestWithUser, res: VercelResponse) {
  const queryId = typeof req.query.id === 'string' ? req.query.id : undefined
  const paramsId = (req as unknown as { params?: Record<string, unknown> }).params?.id
  const id = queryId ?? (typeof paramsId === 'string' ? paramsId : undefined)
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
    // Close pool — admin or manager via PermissionPolicy
    if (!applyPolicy(req, res, new RolePolicy(['admin', 'manager']))) {
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
