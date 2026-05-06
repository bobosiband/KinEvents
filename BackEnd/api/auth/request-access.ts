import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Creates a new access request for an unauthenticated user.
 * @param req Incoming request object.
 * @param res Vercel response object.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(501).json({ success: false, message: 'Not implemented' })
}