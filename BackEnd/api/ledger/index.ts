import type { VercelResponse } from '@vercel/node'

import { featureFlags } from '../../src/config/FeatureFlags'
import { withAuth, type RequestWithUser } from '../../src/middleware/withAuth'
import { ledgerStore } from '../../src/services/ledgerStore'

async function handler(req: RequestWithUser, res: VercelResponse): Promise<void> {
  if (!featureFlags.paymentsLedger) {
    res.status(404).json({ success: false, message: 'Payments ledger is disabled' })
    return
  }
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' })
    return
  }

  // Members only see their own entries; managers and admins see all.
  const canSeeAll = req.user.role === 'admin' || req.user.role === 'manager'
  const entries = canSeeAll ? ledgerStore.listAll() : ledgerStore.listForUser(req.user.id)
  res.status(200).json({ success: true, data: entries })
}

export default withAuth(handler)
