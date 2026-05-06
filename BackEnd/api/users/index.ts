import type { VercelRequest, VercelResponse } from '@vercel/node'

import { authService } from '../../src/services/auth.service'

/**
 * Lists users or creates a new user record.
 * @param req Incoming request object.
 * @param res Vercel response object.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const users = authService.listApprovedUsers()
    res.status(200).json({ success: true, data: users })
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' })
  }
}