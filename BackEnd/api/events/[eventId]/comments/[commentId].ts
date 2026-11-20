import { z } from 'zod'
import type { VercelResponse } from '@vercel/node'

import { featureFlags } from '../../../../src/config/FeatureFlags'
import { withAuth, type RequestWithUser } from '../../../../src/middleware/withAuth'
import { __commentsStoreForTesting } from '../comments'

const updateSchema = z.object({ body: z.string().trim().min(1).max(2000) })

async function handler(req: RequestWithUser, res: VercelResponse): Promise<void> {
  if (!featureFlags.eventComments) {
    res.status(404).json({ success: false, message: 'Event comments are disabled' })
    return
  }
  const params = (req as unknown as { params?: Record<string, string> }).params ?? {}
  const commentId = params.commentId ?? (typeof req.query?.commentId === 'string' ? req.query.commentId : '')
  if (!commentId) {
    res.status(400).json({ success: false, message: 'Missing commentId' })
    return
  }

  const comment = __commentsStoreForTesting.find((c) => c.id === commentId)
  if (!comment) {
    res.status(404).json({ success: false, message: 'Comment not found' })
    return
  }
  const user = req.user
  if (!user) {
    res.status(401).json({ success: false, message: 'Not authenticated' })
    return
  }

  if (req.method === 'PATCH') {
    if (comment.authorId !== user.id) {
      res.status(403).json({ success: false, message: 'Only the author can edit' })
      return
    }
    const parse = updateSchema.safeParse(req.body)
    if (!parse.success) {
      res.status(400).json({ success: false, message: 'Validation failed', details: parse.error.flatten() })
      return
    }
    comment.body = parse.data.body
    comment.updatedAt = new Date().toISOString()
    res.status(200).json({ success: true, data: comment })
    return
  }

  if (req.method === 'DELETE') {
    const isAdmin = user.role === 'admin'
    const isAuthor = comment.authorId === user.id
    if (!isAdmin && !isAuthor) {
      res.status(403).json({ success: false, message: 'Only the author or an admin can delete' })
      return
    }
    comment.deletedAt = new Date().toISOString()
    comment.updatedAt = comment.deletedAt
    res.status(200).json({ success: true, data: comment })
    return
  }

  res.status(405).json({ success: false, message: 'Method not allowed' })
}

export default withAuth(handler)
