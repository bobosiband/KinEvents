import { z } from 'zod'
import type { VercelResponse } from '@vercel/node'

import { emailService } from '../../src/services/email.service'
import { withAuth, type RequestWithUser } from '../../src/middleware/withAuth'

const emailLogsSchema = z.object({
  recipientId: z.string().uuid().optional(),
})

/**
 * GET /api/admin/email-logs - Retrieve email logs (admin only).
 * Supports optional ?recipientId= query filter.
 */
async function handler(req: RequestWithUser, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  try {
    const parseResult = emailLogsSchema.safeParse(req.query)
    if (!parseResult.success) {
      res.status(400).json({ success: false, message: 'Invalid query parameters', details: parseResult.error.flatten() })
      return
    }

    const logs = await emailService.getEmailLogs(parseResult.data.recipientId)

    res.status(200).json({
      success: true,
      data: logs,
      message: `Retrieved ${logs.length} email logs`,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message })
  }
}

export default withAuth(handler, 'admin')
