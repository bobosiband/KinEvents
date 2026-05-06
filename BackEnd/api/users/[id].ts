import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Retrieves, updates, or deletes a single user by id.
 * @param req Incoming request object.
 * @param res Vercel response object.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(501).json({ success: false, message: 'Not implemented' })
}