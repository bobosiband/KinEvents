import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Returns admin dashboard metrics and summaries.
 * @param req Incoming request object.
 * @param res Vercel response object.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(501).json({ success: false, message: 'Not implemented' })
}