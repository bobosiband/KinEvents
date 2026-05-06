import { z } from 'zod'
import type { VercelResponse } from '@vercel/node'

import { birthdayService } from '../../src/services/birthday.service'
import { withAuth, type RequestWithUser } from '../../src/middleware/withAuth'

const upcomingBirthdaysSchema = z.object({
  limit: z.number().int().optional(),
})

/**
 * Lists the upcoming birthdays for the current calendar window.
 * @param req Incoming request object with authenticated user.
 * @param res Vercel response object.
 */
async function handler(req: RequestWithUser, res: VercelResponse) {
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
    const birthdays = await birthdayService.getUpcomingBirthdays(new Date(), limit)
    res.status(200).json({ success: true, data: birthdays })
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message })
  }
}

export default withAuth(handler)
