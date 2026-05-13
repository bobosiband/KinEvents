import { z } from 'zod'
import type { VercelResponse } from '@vercel/node'

import { messageService } from '../../../src/services/message.service'
import { withAuth, type RequestWithUser } from '../../../src/middleware/withAuth'

const schema = z.object({
  messageIds: z.array(z.string().uuid()).min(1).max(100),
})

async function handler(req: RequestWithUser, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  const parse = schema.safeParse(req.body)
  if (!parse.success) {
    res.status(400).json({ success: false, message: 'Validation failed', details: parse.error.flatten() })
    return
  }

  const userId = req.user!.id
  const updated = await messageService.markAsRead(parse.data.messageIds, userId)
  res.status(200).json({ success: true, data: { updated } })
}

export default withAuth(handler)
