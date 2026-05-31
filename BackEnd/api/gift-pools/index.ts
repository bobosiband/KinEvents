import { z } from 'zod'
import type { VercelResponse } from '@vercel/node'
import { giftPoolService } from '../../src/services/giftPool.service'
import { withAuth, type RequestWithUser } from '../../src/middleware/withAuth'

const createPoolSchema = z.object({
  eventId: z.string().uuid(),
  birthdayUserId: z.string().uuid(),
  targetAmount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
})

async function handler(req: RequestWithUser, res: VercelResponse) {
  if (req.method === 'GET') {
    const pools = await giftPoolService.listPools()
    res.status(200).json({ success: true, data: pools })
    return
  }

  if (req.method === 'POST') {
    const parse = createPoolSchema.safeParse(req.body)
    if (!parse.success) {
      res.status(400).json({ success: false, message: 'Validation failed', details: parse.error.flatten() })
      return
    }
    try {
      const pool = await giftPoolService.createPool({
        ...parse.data,
        createdBy: req.user!.id,
      })
      res.status(201).json({ success: true, data: pool, message: 'Gift pool created' })
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message })
    }
    return
  }

  res.status(405).json({ success: false, message: 'Method not allowed' })
}

export default withAuth(handler, 'admin')
