import { z } from 'zod'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import jwt from 'jsonwebtoken'

import { env } from '../../src/config/env'
import { userRepository } from '../../src/repositories/user.repository'

const loginSchema = z.object({
  email: z.string().email(),
})

/**
 * Authenticates a user and returns a JWT token.
 * User must be approved to login.
 * @param req Incoming request object.
 * @param res Vercel response object.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  const parseResult = loginSchema.safeParse(req.body)
  if (!parseResult.success) {
    res.status(400).json({ success: false, message: 'Validation failed', details: parseResult.error.flatten() })
    return
  }

  try {
    const user = userRepository.findByEmail(parseResult.data.email)
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    if (user.accessStatus !== 'approved') {
      res.status(403).json({ success: false, message: 'User account is not approved' })
      return
    }

    const token = jwt.sign(user, env.JWT_SECRET, { expiresIn: '7d' })

    res.status(200).json({
      success: true,
      data: { user, token },
      message: 'Login successful',
    })
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message })
  }
}
