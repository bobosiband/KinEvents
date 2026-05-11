import { z } from 'zod'
import type { VercelResponse } from '@vercel/node'

import { emailService } from '../../src/services/email.service'
import { withAuth, type RequestWithUser } from '../../src/middleware/withAuth'

const emailResendSchema = z.object({
  logEntryId: z.string().uuid(),
})

/**
 * POST /api/admin/email-resend - Retry sending a failed email (admin only).
 */
async function handler(req: RequestWithUser, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  try {
    const parseResult = emailResendSchema.safeParse(req.body)
    if (!parseResult.success) {
      res.status(400).json({ success: false, message: 'Validation failed', details: parseResult.error.flatten() })
      return
    }

    const success = await emailService.resend(parseResult.data.logEntryId)

    if (!success) {
      res.status(404).json({ success: false, message: 'Email log entry not found or resend failed' })
      return
    }

    res.status(200).json({
      success: true,
      data: { logEntryId: parseResult.data.logEntryId },
      message: 'Email resend queued',
    })
  } catch (error) {
    console.error('[POST /api/admin/email-resend] Error resending email:', error)
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' })
  }
}

export default withAuth(handler, 'admin')
