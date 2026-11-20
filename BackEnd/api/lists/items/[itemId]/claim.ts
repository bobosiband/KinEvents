import type { VercelResponse } from '@vercel/node'

import { featureFlags } from '../../../../src/config/FeatureFlags'
import { withAuth, type RequestWithUser } from '../../../../src/middleware/withAuth'
import { sharedListsStore } from '../../../../src/services/sharedListsStore'

async function handler(req: RequestWithUser, res: VercelResponse): Promise<void> {
  if (!featureFlags.sharedLists) {
    res.status(404).json({ success: false, message: 'Shared lists are disabled' })
    return
  }
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' })
    return
  }
  const params = (req as unknown as { params?: Record<string, string> }).params ?? {}
  const itemId = params.itemId ?? (typeof req.query?.itemId === 'string' ? req.query.itemId : '')
  if (!itemId) {
    res.status(400).json({ success: false, message: 'Missing itemId' })
    return
  }

  if (req.method === 'POST') {
    const item = sharedListsStore.claim(itemId, req.user.id)
    if (!item) {
      res.status(409).json({ success: false, message: 'Item not found or already claimed' })
      return
    }
    res.status(200).json({ success: true, data: item })
    return
  }
  if (req.method === 'DELETE') {
    const item = sharedListsStore.release(itemId, req.user.id)
    if (!item) {
      res.status(409).json({ success: false, message: 'Item not found or not claimed by you' })
      return
    }
    res.status(200).json({ success: true, data: item })
    return
  }
  res.status(405).json({ success: false, message: 'Method not allowed' })
}

export default withAuth(handler)
