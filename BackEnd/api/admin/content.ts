import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Returns or updates the site content blocks used by the admin area.
 * @param req Incoming request object.
 * @param res Vercel response object.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(501).json({ success: false, message: 'Not implemented' })
}