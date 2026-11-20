import { z } from 'zod'
import type { VercelResponse } from '@vercel/node'

import { emailService } from '../../src/services/email.service'
import { withAuth, type RequestWithUser } from '../../src/middleware/withAuth'

const emailLogsSchema = z.object({
  recipientId: z.string().uuid().optional(),
})

/**
 * GET /api/admin/email-logs — Proxies to the standalone EmailService's
 * /emails/logs endpoint. The backend no longer stores email logs itself.
 */
async function handler(req: RequestWithUser, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  const parseResult = emailLogsSchema.safeParse(req.query)
  if (!parseResult.success) {
    res.status(400).json({ success: false, message: 'Invalid query parameters', details: parseResult.error.flatten() })
    return
  }

  try {
    const logs = await emailService.getEmailLogs(parseResult.data.recipientId)
    res.status(200).json({
      success: true,
      data: logs,
      message: `Retrieved ${logs.length} email logs`,
    })
  } catch (error) {
    console.error('[GET /api/admin/email-logs] Unexpected error:', error)
    res.status(200).json({ success: true, data: [], message: 'EmailService unreachable; returning empty list.' })
  }
}

export default withAuth(handler, 'admin')
