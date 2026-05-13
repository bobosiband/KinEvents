import { z } from 'zod'
import type { VercelResponse } from '@vercel/node'

import { readData } from '../../../src/config/db'
import { messageService } from '../../../src/services/message.service'
import { withAuth, type RequestWithUser } from '../../../src/middleware/withAuth'

const schema = z.object({
  messageIds: z.array(z.string().min(1)).min(1).max(100),
})

const idempotencyMap = new Map<string, { response: { success: true; data: { updated: number } }; expiresAt: number }>()

function cleanIdempotencyMap() {
  const now = Date.now()
  for (const [key, value] of idempotencyMap) {
    if (value.expiresAt < now) idempotencyMap.delete(key)
  }
}

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
  cleanIdempotencyMap()

  const rawIdempotencyKey = req.headers['x-idempotency-key']
  const idempotencyKey = typeof rawIdempotencyKey === 'string' ? rawIdempotencyKey.trim() : ''
  const cacheKey = idempotencyKey ? `${userId}:${idempotencyKey}` : ''
  if (cacheKey) {
    const cached = idempotencyMap.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      res.status(200).json(cached.response)
      return
    }
  }

  const db = await readData()
  const messageById = new Map((db.messages ?? []).map((message) => [message.id, message]))
  const validIds = Array.from(
    new Set(
      parse.data.messageIds
        .map((messageId) => messageId.trim())
        .filter((messageId) => {
          if (!messageId || messageId.startsWith('temp-')) return false
          const message = messageById.get(messageId)
          return Boolean(message && !message.deletedAt)
        }),
    ),
  )

  if (!validIds.length) {
    const response = { success: true as const, data: { updated: 0 } }
    if (cacheKey) {
      idempotencyMap.set(cacheKey, { response, expiresAt: Date.now() + 30000 })
    }
    res.status(200).json(response)
    return
  }

  const updated = await messageService.markAsRead(validIds, userId)
  const response = { success: true as const, data: { updated } }
  if (cacheKey) {
    idempotencyMap.set(cacheKey, { response, expiresAt: Date.now() + 30000 })
  }
  res.status(200).json(response)
}

export default withAuth(handler)
