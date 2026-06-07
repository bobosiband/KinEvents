import { z } from 'zod'
import type { VercelRequest, VercelResponse } from '@vercel/node'

import { readData } from '../../src/config/db'
import { authService } from '../../src/services/auth.service'
import { getClientIp, isRateLimited, maskEmail, recordAuthAttempt } from '../../src/services/authThrottle.service'

const loginSchema = z.object({
  email: z.preprocess(
    (value) => (typeof value === 'string' ? value.trim() : value),
    z.string().email()
  ),
})

/**
 * Normalizes an email for consistent lookups.
 * Trims whitespace, converts to lowercase.
 */
function normalizeEmail(email: unknown): string {
  return String(email || '')
    .trim()
    .toLowerCase()
}

/**
 * Authenticates a user and returns a JWT token.
 * User must be approved to login.
 * @param req Incoming request object.
 * @param res Vercel response object.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  try {
    const parseResult = loginSchema.safeParse(req.body)
    if (!parseResult.success) {
      console.warn('[LOGIN] Validation failed:', parseResult.error.flatten().fieldErrors)
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: parseResult.error.flatten(),
      })
      return
    }

    const inputEmail = normalizeEmail(parseResult.data.email)
    const ip = getClientIp(req)
    console.log(`[LOGIN] Looking up user with email hint: ${maskEmail(inputEmail)}`)

    if (await isRateLimited({ prefix: 'login', email: inputEmail, ip })) {
      await recordAuthAttempt({ action: 'login.blocked', actorId: null, email: inputEmail, ip, reason: 'rate_limited' })
      res.status(429).json({ success: false, message: 'Too many login attempts. Please try again later.' })
      return
    }

    const db = await readData()
    const existingUser = db.users.find((item) => item.email.trim().toLowerCase() === inputEmail)

    if (!existingUser) {
      console.warn(`[LOGIN] User not found for hint: ${maskEmail(inputEmail)}`)
      await recordAuthAttempt({ action: 'login.failure', actorId: null, email: inputEmail, ip, reason: 'unknown_user' })
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    if (existingUser.accessStatus !== 'approved') {
      console.warn(
        `[LOGIN] User not approved: ${existingUser.id} (status: ${existingUser.accessStatus})`
      )
      await recordAuthAttempt({ action: 'login.failure', actorId: existingUser.id, email: inputEmail, ip, reason: 'not_approved' })
      res.status(403).json({ success: false, message: 'User account is not approved' })
      return
    }

    const user = (await authService.getApprovedUser(inputEmail)) ?? existingUser

    console.log(`[LOGIN] User found: ${user.id}`)

    console.log(`[LOGIN] User approved. Generating JWT token for ${user.id}`)

    const token = authService.issueToken(user)

    await recordAuthAttempt({ action: 'login.success', actorId: user.id, email: inputEmail, ip })

    console.log(`[LOGIN] ✓ Login successful for ${user.id}`)

    res.status(200).json({
      success: true,
      data: { user, token },
      message: 'Login successful',
    })
  } catch (error) {
    console.error('[LOGIN] Error during login:', error instanceof Error ? error.message : error)

    res.status(500).json({
      success: false,
      message: (error as Error).message || 'Internal server error',
    })
  }
}
