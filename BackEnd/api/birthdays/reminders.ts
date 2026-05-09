import { z } from 'zod'
import type { VercelResponse } from '@vercel/node'

import { birthdayService } from '../../src/services/birthday.service'
import { withAuth, type RequestWithUser } from '../../src/middleware/withAuth'

const generateBirthdayRemindersSchema = z.object({
  daysAhead: z.number().int().optional(),
})

/**
 * Generates birthday reminder notifications for users with upcoming birthdays.
 * @param req Incoming request object with authenticated user.
 * @param res Vercel response object.
 */
async function handler(req: RequestWithUser, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  const parseResult = generateBirthdayRemindersSchema.safeParse(req.body)
  if (!parseResult.success) {
    res.status(400).json({ success: false, message: 'Validation failed', details: parseResult.error.flatten() })
    return
  }

  try {
    const daysAhead = parseResult.data.daysAhead ?? 7
    const notifications = await birthdayService.generateBirthdayReminders(daysAhead)
    res.status(201).json({
      success: true,
      data: notifications,
      message: `Generated ${notifications.length} birthday reminders`,
    })
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message })
  }
}

export default withAuth(handler, 'admin')
