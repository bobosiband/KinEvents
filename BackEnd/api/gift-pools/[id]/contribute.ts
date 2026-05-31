import { z } from 'zod'
import type { VercelResponse } from '@vercel/node'
import { giftPoolService } from '../../../src/services/giftPool.service'
import { withAuth, type RequestWithUser } from '../../../src/middleware/withAuth'

const contributeSchema = z.object({
  onBehalfOf: z.array(z.string().uuid()).default([]),
  amount: z.number().positive(),
  paymentMethod: z.enum(['bank_transfer', 'cash', 'paypal', 'other']).optional(),
  reference: z.string().max(100).optional(),
  note: z.string().max(300).optional(),
})

async function handler(req: RequestWithUser, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  const poolId = typeof req.query.id === 'string' ? req.query.id : undefined
  if (!poolId) {
    res.status(400).json({ success: false, message: 'Missing pool id' })
    return
  }

  const parse = contributeSchema.safeParse(req.body)
  if (!parse.success) {
    res.status(400).json({ success: false, message: 'Validation failed', details: parse.error.flatten() })
    return
  }

  try {
    const contribution = await giftPoolService.addContribution({
      poolId,
      paidBy: req.user!.id,
      ...parse.data,
    })
    res.status(201).json({ success: true, data: contribution, message: 'Contribution recorded' })
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message })
  }
}

export default withAuth(handler)
