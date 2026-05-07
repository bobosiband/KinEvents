import { z } from 'zod'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import jwt from 'jsonwebtoken'

import { env } from '../../src/config/env'
import { dbReady } from '../../src/config/db'
import { userRepository } from '../../src/repositories/user.repository'

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
    // CRITICAL: Wait for database initialization to complete.
    // This ensures MongoDB is loaded before querying users.
    // Timeout after 10 seconds to prevent hanging.
    console.log('[LOGIN] Waiting for database to be ready...')

    await Promise.race([
      dbReady,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Database initialization timeout')), 10000)
      ),
    ])

    console.log('[LOGIN] Database is ready')

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

    // Query the database
    const user = userRepository.findByEmail(inputEmail)

    if (!user) {
      console.warn(`[LOGIN] User not found: ${inputEmail}`)
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    console.log(`[LOGIN] User found: ${user.id} (${user.email})`)

    if (user.accessStatus !== 'approved') {
      console.warn(
        `[LOGIN] User not approved: ${user.id} (status: ${user.accessStatus})`
      )
      res.status(403).json({ success: false, message: 'User account is not approved' })
      return
    }

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
