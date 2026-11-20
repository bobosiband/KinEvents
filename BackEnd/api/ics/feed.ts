import type { VercelRequest, VercelResponse } from '@vercel/node'

import { featureFlags } from '../../src/config/FeatureFlags'
import { readData } from '../../src/config/db'
import { IcsBuilder } from '../../src/services/calendarSync/IcsBuilder'

/**
 * Public ICS feed: GET /api/ics/feed?token=<icsToken>. The token itself
 * is the authentication. When featureFlags.calendarSync is off, returns
 * 404 so subscribers quietly drop the feed.
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }
  if (!featureFlags.calendarSync) {
    res.status(404).json({ success: false, message: 'Calendar sync is disabled' })
    return
  }
  const token = typeof req.query?.token === 'string' ? req.query.token : null
  if (!token) {
    res.status(400).json({ success: false, message: 'Missing token' })
    return
  }
  const db = await readData()
  const user = db.users.find((u) => (u as unknown as { icsToken?: string }).icsToken === token)
  if (!user) {
    res.status(404).json({ success: false, message: 'Unknown token' })
    return
  }
  const events = db.events.filter((e) => e.rsvps?.[user.id] === 'yes')
  const builder = new IcsBuilder()
  const ics = builder.build(user, events)
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
  res.setHeader('Cache-Control', 'private, max-age=3600')
  res.status(200).send(ics)
}
