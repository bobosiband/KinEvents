import { z } from 'zod'
import type { VercelResponse } from '@vercel/node'

import { readData, persistData } from '../../src/config/db'
import { ROLE_CAPABILITIES, USER_ROLES } from '../../src/constants/roles'
import { withAuth, type RequestWithUser } from '../../src/middleware/withAuth'

const promoteUserSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['admin', 'manager', 'member']),
})

/**
 * Promotes a user to a higher role or capability set.
 * @param req Incoming request object with authenticated user.
 * @param res Vercel response object.
 */
async function handler(req: RequestWithUser, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  // Backwards-compat: accept `id` field from clients and map to `userId`
  const body = { ...(req.body || {}) } as Record<string, unknown>
  if (!body.userId && body.id && typeof body.id === 'string') {
    body.userId = body.id
  }

  const parseResult = promoteUserSchema.safeParse(body)
  if (!parseResult.success) {
    res.status(400).json({ success: false, message: 'Validation failed', details: parseResult.error.flatten() })
    return
  }

  try {
    const db = await readData()
    const user = db.users.find((item) => item.id === parseResult.data.userId)
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    user.role = parseResult.data.role
    user.capabilities = [...ROLE_CAPABILITIES[parseResult.data.role]]
    user.updatedAt = new Date().toISOString()
    await persistData()

    res.status(200).json({
      success: true,
      data: user,
      message: `User promoted to ${parseResult.data.role}`,
    })
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message })
  }
}

export default withAuth(handler, 'admin')
