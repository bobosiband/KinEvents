import type { VercelResponse } from '@vercel/node'

import { featureFlags } from '../../src/config/FeatureFlags'
import { withAuth, type RequestWithUser } from '../../src/middleware/withAuth'
import { readData } from '../../src/config/db'
import { wishesStore } from '../../src/services/wishesStore'

async function handler(req: RequestWithUser, res: VercelResponse): Promise<void> {
  if (!featureFlags.wishesWall) {
    res.status(404).json({ success: false, message: 'Wishes wall is disabled' })
    return
  }
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  const params = (req as unknown as { params?: Record<string, string> }).params ?? {}
  const eventId = params.eventId ?? (typeof req.query?.eventId === 'string' ? req.query.eventId : '')
  if (!eventId) {
    res.status(400).json({ success: false, message: 'Missing eventId' })
    return
  }

  const db = await readData()
  const event = db.events.find((e) => e.id === eventId)
  if (!event) {
    res.status(404).json({ success: false, message: 'Event not found' })
    return
  }

  const wishes = wishesStore.listApprovedFor(eventId)
  res.status(200).json({ success: true, data: { event, wishes } })
}

export default withAuth(handler)
