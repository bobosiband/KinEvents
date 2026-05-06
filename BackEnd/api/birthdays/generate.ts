import { z } from 'zod'
import type { VercelRequest, VercelResponse } from '@vercel/node'

import { birthdayService } from '../../src/services/birthday.service'

const generateBirthdaysSchema = z.object({
  year: z.number().int().optional(),
})

/**
 * Generates birthday events from users with stored birthdays.
 * @param req Incoming request object.
 * @param res Vercel response object.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  const parseResult = generateBirthdaysSchema.safeParse(req.body)
  if (!parseResult.success) {
    res.status(400).json({ success: false, message: 'Validation failed', details: parseResult.error.flatten() })
    return
  }

  try {
    const events = birthdayService.generateBirthdayEvents(parseResult.data.year)
    res.status(201).json({
      success: true,
      data: events,
      message: `Generated ${events.length} birthday events`,
    })
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message })
  }
}
