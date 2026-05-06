import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Revokes an access request or approved user access.
 * @param req Incoming request object.
 * @param res Vercel response object.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(501).json({ success: false, message: 'Not implemented' })
}