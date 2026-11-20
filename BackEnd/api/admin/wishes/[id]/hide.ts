import type { VercelResponse } from '@vercel/node'

import { featureFlags } from '../../../../src/config/FeatureFlags'
import { withAuth, type RequestWithUser } from '../../../../src/middleware/withAuth'
import { applyPolicy } from '../../../../src/middleware/applyPolicy'
import { RolePolicy } from '../../../../src/auth/policies/RolePolicy'
import { wishesStore } from '../../../../src/services/wishesStore'

async function handler(req: RequestWithUser, res: VercelResponse): Promise<void> {
  if (!featureFlags.wishesWall) {
    res.status(404).json({ success: false, message: 'Wishes wall is disabled' })
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }
  if (!applyPolicy(req, res, new RolePolicy(['admin', 'manager']))) return

  const params = (req as unknown as { params?: Record<string, string> }).params ?? {}
  const id = params.id ?? (typeof req.query?.id === 'string' ? req.query.id : '')
  if (!id) {
    res.status(400).json({ success: false, message: 'Missing wish id' })
    return
  }
  const wish = wishesStore.moderate(id, 'hidden')
  if (!wish) {
    res.status(404).json({ success: false, message: 'Wish not found' })
    return
  }
  res.status(200).json({ success: true, data: wish })
}

export default withAuth(handler)
