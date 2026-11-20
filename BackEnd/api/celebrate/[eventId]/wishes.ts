import { z } from 'zod'
import type { VercelResponse } from '@vercel/node'

import { featureFlags } from '../../../src/config/FeatureFlags'
import { withAuth, type RequestWithUser } from '../../../src/middleware/withAuth'
import { readData } from '../../../src/config/db'
import { wishesStore } from '../../../src/services/wishesStore'

const createWishSchema = z.object({
  message: z.string().trim().min(1).max(2000),
})

async function handler(req: RequestWithUser, res: VercelResponse): Promise<void> {
  if (!featureFlags.wishesWall) {
    res.status(404).json({ success: false, message: 'Wishes wall is disabled' })
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }
  const params = (req as unknown as { params?: Record<string, string> }).params ?? {}
  const eventId = params.eventId ?? (typeof req.query?.eventId === 'string' ? req.query.eventId : '')
  if (!eventId) {
    res.status(400).json({ success: false, message: 'Missing eventId' })
    return
  }
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' })
    return
  }
  const parse = createWishSchema.safeParse(req.body)
  if (!parse.success) {
    res.status(400).json({ success: false, message: 'Validation failed', details: parse.error.flatten() })
    return
  }

  const db = await readData()
  const event = db.events.find((e) => e.id === eventId)
  if (!event) {
    res.status(404).json({ success: false, message: 'Event not found' })
    return
  }
  const recipientUserId = event.birthdayUserId ?? event.createdBy
  const year = new Date(event.date).getUTCFullYear()

  const wish = wishesStore.upsertOwn({
    recipientUserId,
    eventId,
    year,
    authorId: req.user.id,
    authorName: req.user.name,
    message: parse.data.message,
  })
  res.status(201).json({ success: true, data: wish })
}

export default withAuth(handler)
