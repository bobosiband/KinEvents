import { z } from 'zod'
import type { VercelRequest, VercelResponse } from '@vercel/node'

import { eventService } from '../../src/services/event.service'

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.string().datetime(),
  createdBy: z.string().uuid(),
  location: z.string().optional(),
  onlineLink: z.string().optional(),
  imageUrl: z.string().optional(),
  type: z.enum(['birthday', 'custom']).optional(),
})

/**
 * Lists all events or creates a new event.
 * @param req Incoming request object.
 * @param res Vercel response object.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const events = eventService.listEvents()
    res.status(200).json({ success: true, data: events })
  } else if (req.method === 'POST') {
    const parseResult = createEventSchema.safeParse(req.body)
    if (!parseResult.success) {
      res.status(400).json({ success: false, message: 'Validation failed', details: parseResult.error.flatten() })
      return
    }

    try {
      const event = eventService.createEvent(parseResult.data)
      res.status(201).json({ success: true, data: event })
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message })
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' })
  }
}