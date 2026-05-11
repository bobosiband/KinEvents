import type { VercelRequest, VercelResponse } from '@vercel/node'
import jwt from 'jsonwebtoken'

import { env } from '../config/env'
import { readData, waitForDb } from '../config/db'
import type { IUser, UserRole } from '../interfaces/user.interface'
import { ROLE_CAPABILITIES } from '../constants/roles'

export type RequestWithUser = VercelRequest & { user?: IUser }
export type VercelHandler = (req: VercelRequest, res: VercelResponse) => void | Promise<void>

type AuthorizationRequirement = UserRole | string

function hasCapability(user: IUser, requirement: AuthorizationRequirement): boolean {
  if (requirement in ROLE_CAPABILITIES) {
    return user.role === requirement
  }
  return user.capabilities.includes(requirement)
}

/**
 * Wraps a Vercel handler with authentication and authorization.
 * Verifies JWT token, attaches user to request, and checks authorization.
 * @param handler The Vercel handler to wrap
 * @param requirements Optional role or capability requirements. If undefined, only authentication is required.
 * @returns Wrapped handler that enforces auth before calling the original handler
 */
export function withAuth(
  handler: (req: RequestWithUser, res: VercelResponse) => void | Promise<void>,
  requirements?: AuthorizationRequirement | AuthorizationRequirement[]
): VercelHandler {
  return async (req: VercelRequest, res: VercelResponse) => {
    const authorizationHeader = req.headers.authorization

    if (!authorizationHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Missing authorization token' })
      return
    }

    const token = authorizationHeader.slice('Bearer '.length)

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as IUser

      // Wait for DB init if it's currently initialising. If no init is in progress
      // this resolves immediately; then perform the live lookup against the database
      // to get the latest user data, ensuring we catch role changes immediately.
      await waitForDb()

      const db = await readData()
      const liveUser = db.users.find((user) => user.id === decoded.id)

      if (!liveUser) {
        res.status(401).json({ success: false, message: 'User no longer exists' })
        return
      }

      if (liveUser.accessStatus !== 'approved') {
        res.status(401).json({ success: false, message: 'User account is not approved' })
        return
      }

      const requestWithUser = req as RequestWithUser
      const user = liveUser

      requestWithUser.user = user

      if (requirements) {
        const requirementsList = Array.isArray(requirements) ? requirements : [requirements]
        const allowed = requirementsList.some((item) => hasCapability(user, item))

        if (!allowed) {
          res.status(403).json({ success: false, message: 'Insufficient permissions' })
          return
        }
      }

      await handler(requestWithUser, res)
    } catch (err) {
      // Log verification failures for debugging token issues in deployed environments
      try {
        const prefix = token?.toString?.().slice?.(0, 20) || 'no-token'
        console.warn('[AUTH] Token verification failed. tokenPrefix=', prefix, 'error=', err instanceof Error ? err.message : err)
      } catch (ignore) {}

      res.status(401).json({ success: false, message: 'Invalid or expired token' })
    }
  }
}
