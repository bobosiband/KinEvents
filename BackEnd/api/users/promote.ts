import { z } from 'zod'
import type { VercelResponse } from '@vercel/node'

import { userRepository } from '../../src/repositories/user.repository'
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

  const parseResult = promoteUserSchema.safeParse(req.body)
  if (!parseResult.success) {
    res.status(400).json({ success: false, message: 'Validation failed', details: parseResult.error.flatten() })
    return
  }

  try {
    const user = userRepository.findById(parseResult.data.userId)
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    const updatedUser = await userRepository.update(parseResult.data.userId, {
      role: parseResult.data.role,
      capabilities: ROLE_CAPABILITIES[parseResult.data.role],
      updatedAt: new Date().toISOString(),
    })

    if (!updatedUser) {
      res.status(400).json({ success: false, message: 'Could not update user role' })
      return
    }

    res.status(200).json({
      success: true,
      data: updatedUser,
      message: `User promoted to ${parseResult.data.role}`,
    })
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message })
  }
}

export default withAuth(handler, 'admin')
