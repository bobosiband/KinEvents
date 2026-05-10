import { z } from 'zod'
import type { VercelResponse } from '@vercel/node'

import { birthdayService } from '../../src/services/birthday.service'
import { withAuth, type RequestWithUser } from '../../src/middleware/withAuth'

const generateBirthdaysSchema = z.object({
  year: z.number().int().optional(),
})

/**
 * Generates birthday events from users with stored birthdays.
 * @param req Incoming request object with authenticated user.
 * @param res Vercel response object.
 */
async function handler(req: RequestWithUser, res: VercelResponse) {
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
    const result = await birthdayService.generateBirthdayEvents(parseResult.data.year)
    res.status(201).json({
      success: true,
      data: result.events,
      message: `Generated ${result.events.length} birthday events (${result.skipped} skipped as duplicates)`,
    })
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message })
  }
}

export default withAuth(handler, 'admin')
