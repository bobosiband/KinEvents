import { z } from 'zod'
import type { VercelResponse } from '@vercel/node'

import { authService } from '../../src/services/auth.service'
import { withAuth, type RequestWithUser } from '../../src/middleware/withAuth'

const revokeAccessSchema = z.object({
  accessRequestId: z.string().uuid(),
})

/**
 * Revokes an access request or approved user access.
 * @param req Incoming request object with authenticated user.
 * @param res Vercel response object.
 */
function handler(req: RequestWithUser, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  const parseResult = revokeAccessSchema.safeParse(req.body)
  if (!parseResult.success) {
    res.status(400).json({ success: false, message: 'Validation failed', details: parseResult.error.flatten() })
    return
  }

  try {
    const request = authService.revokeAccess(parseResult.data.accessRequestId)
    res.status(200).json({
      success: true,
      data: request,
      message: 'Access revoked successfully',
    })
  } catch (error) {
    res.status(404).json({ success: false, message: (error as Error).message })
  }
}

export default withAuth(handler, 'admin')