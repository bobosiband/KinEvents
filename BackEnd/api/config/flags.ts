import type { VercelRequest, VercelResponse } from '@vercel/node'

import { featureFlags } from '../../src/config/FeatureFlags'

/**
 * Public read-only endpoint. The frontend reads it once per session to decide
 * which optional UI to render. No auth required: flag state is not sensitive
 * and an unauthenticated login screen needs to know whether PIN entry will be
 * asked for.
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  res.status(200).json({ success: true, data: featureFlags.toJSON() })
}
