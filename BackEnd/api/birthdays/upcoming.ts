import { z } from 'zod'
import type { VercelRequest, VercelResponse } from '@vercel/node'

import { birthdayService } from '../../src/services/birthday.service'

const upcomingBirthdaysSchema = z.object({
  limit: z.number().int().optional(),
})

/**
 * Lists the upcoming birthdays for the current calendar window.
 * @param req Incoming request object.
 * @param res Vercel response object.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10
  if (isNaN(limit) || limit < 1) {
    res.status(400).json({ success: false, message: 'Invalid limit parameter' })
    return
  }

  try {
    const birthdays = birthdayService.getUpcomingBirthdays(new Date(), limit)
    res.status(200).json({ success: true, data: birthdays })
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message })
  }
}
