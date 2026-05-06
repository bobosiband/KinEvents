import type { VercelResponse } from '@vercel/node'

import { authService } from '../../src/services/auth.service'
import { withAuth, type RequestWithUser } from '../../src/middleware/withAuth'

/**
 * Lists users or creates a new user record.
 * @param req Incoming request object with authenticated user.
 * @param res Vercel response object.
 */
function handler(req: RequestWithUser, res: VercelResponse) {
  if (req.method === 'GET') {
    const users = authService.listApprovedUsers()
    res.status(200).json({ success: true, data: users })
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' })
  }
}

export default withAuth(handler)