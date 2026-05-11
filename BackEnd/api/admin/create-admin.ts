import { z } from 'zod'
import { randomUUID } from 'crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import jwt from 'jsonwebtoken'

import { env } from '../../src/config/env'
import { readData, persistData } from '../../src/config/db'
import { ROLE_CAPABILITIES } from '../../src/constants/roles'
import type { IUser } from '../../src/interfaces/user.interface'

const createAdminSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  secret: z.string(),
})

/**
 * Creates an admin user (requires admin secret for security)
 * @param req Incoming request object.
 * @param res Vercel response object.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  const parseResult = createAdminSchema.safeParse(req.body)
  if (!parseResult.success) {
    res.status(400).json({ success: false, message: 'Validation failed', details: parseResult.error.flatten() })
    return
  }

  // Simple security check using a shared secret
  if (parseResult.data.secret !== process.env.ADMIN_SECRET) {
    res.status(403).json({ success: false, message: 'Invalid admin secret' })
    return
  }

  try {
    const db = await readData()
    const existingAdmin = db.users.find((user) => user.role === 'admin')
    if (existingAdmin) {
      res.status(400).json({ success: false, message: 'An admin user already exists' })
      return
    }

    const normalizedEmail = parseResult.data.email.trim().toLowerCase()
    const existingUser = db.users.find((user) => user.email.trim().toLowerCase() === normalizedEmail)
    if (existingUser) {
      res.status(400).json({ success: false, message: 'User with this email already exists' })
      return
    }

    const now = new Date().toISOString()
    const admin: IUser = {
      id: randomUUID(),
      name: parseResult.data.name,
      email: parseResult.data.email,
      role: 'admin',
      accessStatus: 'approved',
      capabilities: [...ROLE_CAPABILITIES.admin],
      notificationPrefs: {
        level: 'all',
        channels: ['email'],
      },
      createdAt: now,
      updatedAt: now,
    }
    db.users.push(admin)
    await persistData()

    const token = jwt.sign(admin, env.JWT_SECRET, { expiresIn: '7d' })

    res.status(201).json({
      success: true,
      data: { admin, token },
      message: 'Admin user created successfully',
    })
  } catch (error) {
    console.error('[POST /api/admin/create-admin] Error creating admin:', error)
    res.status(500).json({ success: false, message: 'An internal error occurred. Please try again.' })
  }
}
