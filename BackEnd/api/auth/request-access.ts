import { z } from 'zod'
import type { VercelRequest, VercelResponse } from '@vercel/node'

import { authService } from '../../src/services/auth.service'

const requestAccessSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().optional(),
})

/**
 * Accepts a new access request from a user
 * @param req Incoming request object.
 * @param res Vercel response object.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  const parseResult = requestAccessSchema.safeParse(req.body)
  if (!parseResult.success) {
    res.status(400).json({ success: false, message: 'Validation failed', details: parseResult.error.flatten() })
    return
  }

  const accessRequest = authService.requestAccess(parseResult.data)
  res.status(201).json({ success: true, data: accessRequest })
}