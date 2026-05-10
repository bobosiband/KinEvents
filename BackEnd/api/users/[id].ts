import { z } from 'zod'
import type { VercelResponse } from '@vercel/node'

import { getData, persistData } from '../../src/config/db'
import { withAuth, type RequestWithUser } from '../../src/middleware/withAuth'

const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notificationPrefs: z.object({
    level: z.enum(['all', 'important', 'none']).optional(),
    channels: z.array(z.enum(['email', 'push'])).optional(),
  }).optional(),
})

/**
 * Retrieves, updates, or deletes a single user by id.
 * @param req Incoming request object with authenticated user.
 * @param res Vercel response object.
 */
async function handler(req: RequestWithUser, res: VercelResponse) {
  const queryId = req.query?.id
  const paramsId = (req as unknown as { params?: Record<string, unknown> }).params?.id
  // Prefer route params over query string for the id to avoid accidental mismatches
  const id = typeof paramsId === 'string' ? paramsId : typeof queryId === 'string' ? queryId : undefined

  if (!id) {
    res.status(400).json({ success: false, message: 'Invalid user ID' })
    return
  }

  const currentUser = req.user

  if (req.method === 'GET') {
    const user = getData().users.find((item) => item.id === id)
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }
    res.status(200).json({ success: true, data: user })
  } else if (req.method === 'PUT' || req.method === 'PATCH') {
    // Only admins or the user themselves may update the user record
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.id !== id)) {
      res.status(403).json({ success: false, message: 'Insufficient permissions' })
      return
    }
    const parseResult = updateUserSchema.safeParse(req.body)
    if (!parseResult.success) {
      res.status(400).json({ success: false, message: 'Validation failed', details: parseResult.error.flatten() })
      return
    }

    const updateData: any = { updatedAt: new Date().toISOString() }
    if (parseResult.data.name) updateData.name = parseResult.data.name
    if (parseResult.data.email) {
      const normalizedEmail = parseResult.data.email.trim().toLowerCase()
      // Prevent duplicate email assignment across users.
      const conflict = getData().users.find(
        (u) => u.email.trim().toLowerCase() === normalizedEmail && u.id !== id,
      )
      if (conflict) {
        res.status(409).json({ success: false, message: 'Email already in use' })
        return
      }
      updateData.email = normalizedEmail
    }
    if (parseResult.data.birthday) updateData.birthday = parseResult.data.birthday
    if (parseResult.data.notificationPrefs) {
      const existing = getData().users.find((item) => item.id === id)
      updateData.notificationPrefs = {
        level: parseResult.data.notificationPrefs.level ?? existing?.notificationPrefs.level,
        channels: parseResult.data.notificationPrefs.channels ?? existing?.notificationPrefs.channels,
      }
    }

    const user = getData().users.find((item) => item.id === id)
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    Object.assign(user, updateData)
    await persistData()

    res.status(200).json({ success: true, data: { user } })
  } else if (req.method === 'DELETE') {
    // Only admins or the user themselves may delete the user record
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.id !== id)) {
      res.status(403).json({ success: false, message: 'Insufficient permissions' })
      return
    }

    const db = getData()
    const index = db.users.findIndex((item) => item.id === id)
    if (index < 0) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    const [removedUser] = db.users.splice(index, 1)

    try {
      console.log('[DB] Persisting after user deletion:', id)
      await persistData()
    } catch (persistError) {
      db.users.splice(index, 0, removedUser)
      console.error('[DELETE /api/users/:id] Failed to persist deletion:', persistError)
      res.status(500).json({ success: false, message: 'Failed to persist user deletion' })
      return
    }

    res.status(200).json({ success: true, message: 'User deleted successfully' })
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' })
  }
}

export default withAuth(handler)
