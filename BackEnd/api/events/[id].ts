import { z } from 'zod'
import type { VercelResponse } from '@vercel/node'

import { eventService } from '../../src/services/event.service'
import { withAuth, type RequestWithUser } from '../../src/middleware/withAuth'

const updateEventSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  date: z.string().datetime().optional(),
  location: z.string().optional(),
  onlineLink: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  locked: z.boolean().optional(),
})

/**
 * Retrieves, updates, or deletes a single event by id.
 * @param req Incoming request object with authenticated user.
 * @param res Vercel response object.
 */
async function handler(req: RequestWithUser, res: VercelResponse) {
  const queryId = req.query?.id
  const paramsId = (req as unknown as { params?: Record<string, unknown> }).params?.id
  const id = typeof queryId === 'string' ? queryId : typeof paramsId === 'string' ? paramsId : undefined

  if (!id) {
    res.status(400).json({ success: false, message: 'Invalid event ID' })
    return
  }

  if (req.method === 'GET') {
    const event = await eventService.getEvent(id)
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' })
      return
    }
    res.status(200).json({ success: true, data: event })
  } else if (req.method === 'PUT' || req.method === 'PATCH') {
    const parseResult = updateEventSchema.safeParse(req.body)
    if (!parseResult.success) {
      res.status(400).json({ success: false, message: 'Validation failed', details: parseResult.error.flatten() })
      return
    }

    try {
      const updatedEvent = await eventService.updateEvent(id, parseResult.data)
      if (!updatedEvent) {
        res.status(404).json({ success: false, message: 'Event not found' })
        return
      }
      res.status(200).json({ success: true, data: updatedEvent })
    } catch (error) {
      res.status(400).json({ success: false, message: (error as Error).message })
    }
  } else if (req.method === 'DELETE') {
    try {
      const deleted = await eventService.deleteEvent(id)
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Event not found' })
        return
      }

      res.status(200).json({ success: true, message: 'Event deleted successfully' })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to persist event deletion' })
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' })
  }
}

export default withAuth(handler)
