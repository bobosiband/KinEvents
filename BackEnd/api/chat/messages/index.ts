import { z } from 'zod'
import type { VercelResponse } from '@vercel/node'

import { messageService } from '../../../src/services/message.service'
import { withAuth, type RequestWithUser } from '../../../src/middleware/withAuth'

const listSchema = z.object({
  limit: z.string().optional(),
  cursor: z.string().optional(),
  direction: z.enum(['before', 'after']).optional(),
})

const createSchema = z.object({
  content: z.string().min(1).max(2000),
})

async function handler(req: RequestWithUser, res: VercelResponse) {
  if (req.method === 'GET') {
    const parse = listSchema.safeParse(req.query)
    if (!parse.success) {
      res.status(400).json({ success: false, message: 'Validation failed', details: parse.error.flatten() })
      return
    }

    const { limit, cursor, direction } = parse.data
    const limitNum = limit ? parseInt(limit, 10) : undefined

    const result = await messageService.listMessages({ limit: limitNum, cursor, direction: direction as any })
    res.status(200).json({ success: true, data: result })
  } else if (req.method === 'POST') {
    const parse = createSchema.safeParse(req.body)
    if (!parse.success) {
      res.status(400).json({ success: false, message: 'Validation failed', details: parse.error.flatten() })
      return
    }

    try {
      const from = req.user!.id
      const msg = await messageService.createMessage({ from, content: parse.data.content })
      res.status(201).json({ success: true, data: msg })
    } catch (err) {
      res.status(400).json({ success: false, message: (err as Error).message })
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' })
  }
}

export default withAuth(handler)
