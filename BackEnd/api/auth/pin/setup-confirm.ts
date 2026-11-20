import type { VercelRequest, VercelResponse } from '@vercel/node'

import { featureFlags } from '../../../src/config/FeatureFlags'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }
  if (!featureFlags.adminPin) {
    res.status(404).json({ success: false, message: 'Admin PIN login is disabled' })
    return
  }
  res.status(501).json({ success: false, message: 'PIN setup confirmation not yet implemented' })
}
