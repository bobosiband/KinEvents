import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Lists users or creates a new user record.
 * @param req Incoming request object.
 * @param res Vercel response object.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(501).json({ success: false, message: 'Not implemented' })
}