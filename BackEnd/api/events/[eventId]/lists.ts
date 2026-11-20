import { z } from 'zod'
import type { VercelResponse } from '@vercel/node'

import { featureFlags } from '../../../src/config/FeatureFlags'
import { withAuth, type RequestWithUser } from '../../../src/middleware/withAuth'
import { applyPolicy } from '../../../src/middleware/applyPolicy'
import { RolePolicy } from '../../../src/auth/policies/RolePolicy'
import { sharedListsStore } from '../../../src/services/sharedListsStore'

const createListSchema = z.object({
  title: z.string().trim().min(1).max(200),
})

async function handler(req: RequestWithUser, res: VercelResponse): Promise<void> {
  if (!featureFlags.sharedLists) {
    res.status(404).json({ success: false, message: 'Shared lists are disabled' })
    return
  }
  const params = (req as unknown as { params?: Record<string, string> }).params ?? {}
  const eventId = params.eventId ?? (typeof req.query?.eventId === 'string' ? req.query.eventId : '')
  if (!eventId) {
    res.status(400).json({ success: false, message: 'Missing eventId' })
    return
  }

  if (req.method === 'GET') {
    res.status(200).json({ success: true, data: sharedListsStore.listsForEvent(eventId) })
    return
  }
  if (req.method === 'POST') {
    if (!applyPolicy(req, res, new RolePolicy(['admin', 'manager']))) return
    const parse = createListSchema.safeParse(req.body)
    if (!parse.success) {
      res.status(400).json({ success: false, message: 'Validation failed', details: parse.error.flatten() })
      return
    }
    const list = sharedListsStore.createList({
      eventId,
      title: parse.data.title,
      createdBy: req.user!.id,
    })
    res.status(201).json({ success: true, data: list })
    return
  }
  res.status(405).json({ success: false, message: 'Method not allowed' })
}

export default withAuth(handler)
