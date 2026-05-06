import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Stores an RSVP response for a user and event.
 * @param req Incoming request object.
 * @param res Vercel response object.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(501).json({ success: false, message: 'Not implemented' })
}