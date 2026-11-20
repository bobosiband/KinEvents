import { randomUUID } from 'crypto'
import { z } from 'zod'
import type { VercelResponse } from '@vercel/node'

import { featureFlags } from '../../../src/config/FeatureFlags'
import { withAuth, type RequestWithUser } from '../../../src/middleware/withAuth'
import type { IEventComment } from '../../../src/interfaces/eventComment.interface'

const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  parentCommentId: z.string().uuid().optional(),
})

// In-memory store while the feature is off. When featureFlags.useCollections
// is on, this is replaced with a MongoEventCommentRepository in a later PR.
const comments: IEventComment[] = []

async function handler(req: RequestWithUser, res: VercelResponse): Promise<void> {
  if (!featureFlags.eventComments) {
    res.status(404).json({ success: false, message: 'Event comments are disabled' })
    return
  }

  const eventId = typeof (req as unknown as { params?: Record<string, unknown> }).params?.eventId === 'string'
    ? ((req as unknown as { params: Record<string, string> }).params.eventId)
    : (typeof req.query?.eventId === 'string' ? req.query.eventId : '')

  if (!eventId) {
    res.status(400).json({ success: false, message: 'Missing eventId' })
    return
  }

  if (req.method === 'GET') {
    const forEvent = comments.filter((c) => c.eventId === eventId && !c.deletedAt)
    res.status(200).json({ success: true, data: forEvent })
    return
  }

  if (req.method === 'POST') {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' })
      return
    }
    const parse = createCommentSchema.safeParse(req.body)
    if (!parse.success) {
      res.status(400).json({ success: false, message: 'Validation failed', details: parse.error.flatten() })
      return
    }
    const now = new Date().toISOString()
    const entry: IEventComment = {
      id: randomUUID(),
      eventId,
      authorId: req.user.id,
      body: parse.data.body,
      parentCommentId: parse.data.parentCommentId,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    }
    comments.push(entry)
    res.status(201).json({ success: true, data: entry })
    return
  }

  res.status(405).json({ success: false, message: 'Method not allowed' })
}

export default withAuth(handler)
export const __commentsStoreForTesting: IEventComment[] = comments
