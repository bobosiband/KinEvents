import type { VercelRequest, VercelResponse } from '@vercel/node'

import { featureFlags } from '../../../src/config/FeatureFlags'

/**
 * Flag-gated stub. Full PIN verification (challenge → bcrypt compare →
 * lockout → trusted device record → final JWT) lands in a later PR. With
 * featureFlags.adminPin off (tonight), this endpoint signals "feature
 * disabled" so clients know not to show the PIN screen.
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }
  if (!featureFlags.adminPin) {
    res.status(404).json({ success: false, message: 'Admin PIN login is disabled' })
    return
  }
  res.status(501).json({ success: false, message: 'Admin PIN verification is not yet implemented' })
}
