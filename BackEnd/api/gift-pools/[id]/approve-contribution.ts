import { z } from 'zod'
import type { VercelResponse } from '@vercel/node'
import { giftPoolService } from '../../../src/services/giftPool.service'
import { withAuth, type RequestWithUser } from '../../../src/middleware/withAuth'

const approveSchema = z.object({ contributionId: z.string().uuid() })

async function handler(req: RequestWithUser, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  const parse = approveSchema.safeParse(req.body)
  if (!parse.success) {
    res.status(400).json({ success: false, message: 'Validation failed', details: parse.error.flatten() })
    return
  }

  try {
    const contribution = await giftPoolService.approveContribution(parse.data.contributionId, req.user!.id)
    res.status(200).json({ success: true, data: contribution, message: 'Contribution approved' })
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message })
  }
}

export default withAuth(handler, 'admin')
