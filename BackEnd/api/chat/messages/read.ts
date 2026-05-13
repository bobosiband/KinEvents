import { z } from 'zod'
import type { VercelResponse } from '@vercel/node'

import { readData } from '../../../src/config/db'
import { messageService } from '../../../src/services/message.service'
import { withAuth, type RequestWithUser } from '../../../src/middleware/withAuth'

const schema = z.object({
  messageIds: z.array(z.string().min(1)).min(1).max(100),
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
  const db = await readData()
  const existingIds = new Set((db.messages ?? []).map((message) => message.id))
  const validIds = Array.from(
    new Set(
      parse.data.messageIds
        .map((messageId) => messageId.trim())
        .filter((messageId) => messageId && !messageId.startsWith('temp-') && existingIds.has(messageId)),
    ),
  )

  if (!validIds.length) {
    res.status(200).json({ success: true, data: { updated: 0 } })
    return
  }

  const updated = await messageService.markAsRead(validIds, userId)
  res.status(200).json({ success: true, data: { updated } })
}

export default withAuth(handler)
