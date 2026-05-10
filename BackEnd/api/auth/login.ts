import { z } from 'zod'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import jwt from 'jsonwebtoken'

import { env } from '../../src/config/env'
import { getData } from '../../src/config/db'
import { authService } from '../../src/services/auth.service'

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
    console.log(`[LOGIN] Looking up user with email: ${inputEmail}`)

    const existingUser = getData().users.find((item) => item.email.trim().toLowerCase() === inputEmail)

    if (!existingUser) {
      console.warn(`[LOGIN] User not found: ${inputEmail}`)
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    if (existingUser.accessStatus !== 'approved') {
      console.warn(
        `[LOGIN] User not approved: ${existingUser.id} (status: ${existingUser.accessStatus})`
      )
      res.status(403).json({ success: false, message: 'User account is not approved' })
      return
    }

    const user = authService.getApprovedUser(inputEmail) ?? existingUser

    console.log(`[LOGIN] User found: ${user.id} (${user.email})`)

    console.log(`[LOGIN] User approved. Generating JWT token for ${user.id}`)

    const token = jwt.sign(user, env.JWT_SECRET, { expiresIn: '7d' })

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
