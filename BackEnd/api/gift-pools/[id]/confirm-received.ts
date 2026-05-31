import { z } from 'zod'
import type { VercelResponse } from '@vercel/node'
import { giftPoolService } from '../../../src/services/giftPool.service'
import { withAuth, type RequestWithUser } from '../../../src/middleware/withAuth'

const confirmSchema = z.object({
  giftDescription: z.string().max(300).optional(),
})

async function handler(req: RequestWithUser, res: VercelResponse) {
  if (req.method !== 'POST') {
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

  const parse = confirmSchema.safeParse(req.body)
  if (!parse.success) {
    res.status(400).json({ success: false, message: 'Validation failed', details: parse.error.flatten() })
    return
  }

  try {
    const pool = await giftPoolService.confirmReceived(
      poolId,
      req.user!.id,
      parse.data.giftDescription,
    )
    res.status(200).json({ success: true, data: pool, message: 'Gift receipt confirmed' })
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message })
  }
}

export default withAuth(handler, 'admin')