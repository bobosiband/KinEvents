import { z } from 'zod'
import type { VercelResponse } from '@vercel/node'

import { eventService } from '../../src/services/event.service'
import { withAuth, type RequestWithUser } from '../../src/middleware/withAuth'

const rsvpSchema = z.object({
  eventId: z.string().uuid(),
  userId: z.string().uuid(),
  status: z.enum(['yes', 'no', 'maybe']),
})

/**
 * Stores an RSVP response for a user and event.
 * @param req Incoming request object with authenticated user.
 * @param res Vercel response object.
 */
function handler(req: RequestWithUser, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  const parseResult = rsvpSchema.safeParse(req.body)
  if (!parseResult.success) {
    res.status(400).json({ success: false, message: 'Validation failed', details: parseResult.error.flatten() })
    return
  }

  try {
    const event = eventService.setRsvp(parseResult.data.eventId, parseResult.data.userId, parseResult.data.status)
    res.status(200).json({
      success: true,
      data: event,
      message: `RSVP recorded as "${parseResult.data.status}"`,
    })
  } catch (error) {
    res.status(404).json({ success: false, message: (error as Error).message })
  }
}

export default withAuth(handler)
