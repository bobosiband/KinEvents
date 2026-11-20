import type { VercelResponse } from '@vercel/node'

import { birthdayService } from '../../src/services/birthday.service'
import { withAuth, type RequestWithUser } from '../../src/middleware/withAuth'

/**
 * Admin button handler. Delegates to the same shared helper as the daily
 * BirthdayEventJob so the button and the schedule produce identical events
 * and the second press is a no-op.
 */
async function handler(req: RequestWithUser, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  try {
    const result = await birthdayService.generateUpcomingBirthdayEvents()
    res.status(201).json({
      success: true,
      data: result.events,
      message: `Generated ${result.events.length} birthday events (${result.skipped} skipped — duplicate, past, or beyond the 30-day horizon)`,
    })
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message })
  }
}

export default withAuth(handler, 'admin')
