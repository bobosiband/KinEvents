import { z } from 'zod'
import type { VercelResponse } from '@vercel/node'

import { eventService } from '../../src/services/event.service'
import { withAuth, type RequestWithUser } from '../../src/middleware/withAuth'

const generateEventRemindersSchema = z.object({
  daysAhead: z.number().int().optional(),
})

async function handler(req: RequestWithUser, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  const parseResult = generateEventRemindersSchema.safeParse(req.body)
  if (!parseResult.success) {
    res.status(400).json({ success: false, message: 'Validation failed', details: parseResult.error.flatten() })
    return
  }

  try {
    const daysAhead = parseResult.data.daysAhead ?? 3
    const notifications = await eventService.generateEventReminders(daysAhead)
    res.status(201).json({
      success: true,
      data: notifications,
      message: `Generated ${notifications.length} event reminders`,
    })
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message })
  }
}

export default withAuth(handler, 'admin')