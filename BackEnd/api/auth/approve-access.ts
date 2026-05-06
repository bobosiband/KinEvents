import { z } from 'zod'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import jwt from 'jsonwebtoken'

import { env } from '../../src/config/env'
import { authService } from '../../src/services/auth.service'

const approveAccessSchema = z.object({
  accessRequestId: z.string().uuid(),
})

/**
 * Approves a pending access request.
 * @param req Incoming request object.
 * @param res Vercel response object.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  const parseResult = approveAccessSchema.safeParse(req.body)
  if (!parseResult.success) {
    res.status(400).json({ success: false, message: 'Validation failed', details: parseResult.error.flatten() })
    return
  }

  try {
    const { request, user } = authService.approveAccess(parseResult.data.accessRequestId)
    const token = jwt.sign(user, env.JWT_SECRET, { expiresIn: '7d' })

    res.status(200).json({
      success: true,
      data: { request, user, token },
      message: 'Access approved successfully',
    })
  } catch (error) {
    res.status(404).json({ success: false, message: (error as Error).message })
  }
}