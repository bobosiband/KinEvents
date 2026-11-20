import { randomUUID } from 'crypto'
import type { VercelResponse } from '@vercel/node'

import { featureFlags } from '../../../src/config/FeatureFlags'
import { withAuth, type RequestWithUser } from '../../../src/middleware/withAuth'
import { readData, persistData } from '../../../src/config/db'

async function handler(req: RequestWithUser, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }
  if (!featureFlags.calendarSync) {
    res.status(404).json({ success: false, message: 'Calendar sync is disabled' })
    return
  }
  const user = req.user
  if (!user) {
    res.status(401).json({ success: false, message: 'Not authenticated' })
    return
  }

  const token = randomUUID().replace(/-/g, '')
  const db = await readData()
  const stored = db.users.find((u) => u.id === user.id)
  if (!stored) {
    res.status(404).json({ success: false, message: 'User not found' })
    return
  }
  ;(stored as unknown as { icsToken?: string }).icsToken = token
  stored.updatedAt = new Date().toISOString()
  await persistData()

  res.status(200).json({ success: true, data: { token } })
}

export default withAuth(handler)
