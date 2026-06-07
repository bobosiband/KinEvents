import { randomUUID } from 'crypto'

import { z } from 'zod'
import type { VercelResponse } from '@vercel/node'

import { readData, persistData } from '../../src/config/db'
import { withAuth, type RequestWithUser } from '../../src/middleware/withAuth'
import { bumpTokenVersion } from '../../src/services/auth.service'
import type { IAdminAuditEntry } from '../../src/interfaces/auth.interface'

const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/).optional(),
  phoneNumber: z.string().regex(/^\+[1-9]\d{7,14}$/).optional(),
  notificationPrefs: z.object({
    level: z.enum(['all', 'important', 'none']).optional(),
    channels: z.array(z.enum(['email', 'whatsapp', 'push'])).optional(),
  }).optional(),
  notificationPreferences: z.object({
    email: z.boolean().optional(),
    whatsapp: z.boolean().optional(),
    push: z.boolean().optional(),
  }).optional(),
  // Admin-only revoke/reinstate path for *approved* users — `pending`/`rejected`
  // remain owned by the access-request flow (`POST /api/auth/revoke-access`).
  accessStatus: z.enum(['approved', 'revoked']).optional(),
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
    const db = await readData()
    const user = db.users.find((item) => item.id === id)
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

    const nextAccessStatus = parseResult.data.accessStatus

    // Revoking/reinstating is an admin-only action — stricter than the
    // "admin or self" gate above, which still applies to the rest of this
    // endpoint (profile edits, etc).
    if (nextAccessStatus !== undefined && currentUser.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Only admins can change a user\'s access status' })
      return
    }

    const db = await readData()

    // Single lookup — fail fast if user not found
    const user = db.users.find((item) => item.id === id)
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    if (nextAccessStatus !== undefined) {
      // Guard the floor first: refuse anything that would leave zero approved
      // admins able to administer the system — including a sole admin trying
      // to revoke themselves (caught here before the self-lockout check below
      // so the more specific "last admin" message wins).
      if (nextAccessStatus === 'revoked' && user.role === 'admin' && user.accessStatus === 'approved') {
        const approvedAdminCount = db.users.filter((u) => u.role === 'admin' && u.accessStatus === 'approved').length
        if (approvedAdminCount <= 1) {
          res.status(400).json({ success: false, message: 'Cannot revoke the last approved admin' })
          return
        }
      }

      // No self-revoke / self-lockout — an admin can't strand themselves.
      if (currentUser.id === id) {
        res.status(400).json({ success: false, message: 'You cannot change your own access status' })
        return
      }
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() }
    let emailChanged = false
    let accessStatusChanged = false

    if (parseResult.data.name) updateData.name = parseResult.data.name

    if (parseResult.data.email) {
      const normalizedEmail = parseResult.data.email.trim().toLowerCase()
      const conflict = db.users.find(
        (u) => u.email.trim().toLowerCase() === normalizedEmail && u.id !== id,
      )
      if (conflict) {
        res.status(409).json({ success: false, message: 'Email already in use' })
        return
      }
      emailChanged = normalizedEmail !== user.email.trim().toLowerCase()
      updateData.email = normalizedEmail
    }

    if (parseResult.data.birthday) updateData.birthday = parseResult.data.birthday

    if (parseResult.data.phone !== undefined || parseResult.data.phoneNumber !== undefined) {
      const normalizedPhone = parseResult.data.phone ?? parseResult.data.phoneNumber
      updateData.phone = normalizedPhone
      updateData.phoneNumber = normalizedPhone
      updateData.phoneVerified = false
    }

    if (parseResult.data.notificationPrefs) {
      // Use the already-found `user` — no second lookup needed
      updateData.notificationPrefs = {
        level: parseResult.data.notificationPrefs.level ?? user.notificationPrefs.level,
        channels: parseResult.data.notificationPrefs.channels ?? user.notificationPrefs.channels,
      }
    }

    if (parseResult.data.notificationPreferences) {
      updateData.notificationPreferences = {
        ...user.notificationPreferences,
        ...parseResult.data.notificationPreferences,
      }
    }

    if (nextAccessStatus !== undefined && nextAccessStatus !== user.accessStatus) {
      updateData.accessStatus = nextAccessStatus
      accessStatusChanged = true
    }

    Object.assign(user, updateData)

    // Email changes are an intended invalidation point (the Profile page
    // tells users this refreshes their session token) — force re-auth.
    if (emailChanged) bumpTokenVersion(user)

    if (accessStatusChanged) {
      // Kill any live sessions immediately — revoking relies on this plus the
      // existing `withAuth` accessStatus check and the login 403; reinstating
      // bumps too, which is harmless and just forces a fresh token.
      bumpTokenVersion(user)

      db.auditLogs = db.auditLogs ?? []
      const adminAuditEntry: IAdminAuditEntry = {
        id: randomUUID(),
        action: nextAccessStatus === 'revoked' ? 'user.access_revoked' : 'user.access_reinstated',
        actorId: currentUser.id,
        targetUserId: user.id,
        timestamp: new Date().toISOString(),
      }
      db.auditLogs.push(adminAuditEntry)
    }

    await persistData()

    res.status(200).json({ success: true, data: { user } })
  } else if (req.method === 'DELETE') {
    // Only admins or the user themselves may delete the user record
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.id !== id)) {
      res.status(403).json({ success: false, message: 'Insufficient permissions' })
      return
    }

    const db = await readData()
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
