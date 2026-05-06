import type { VercelRequest, VercelResponse } from '@vercel/node'
import jwt from 'jsonwebtoken'

import { env } from '../config/env'
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
  return (req: VercelRequest, res: VercelResponse) => {
    const authorizationHeader = req.headers.authorization

    if (!authorizationHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Missing authorization token' })
      return
    }

    const token = authorizationHeader.slice('Bearer '.length)

    try {
      const user = jwt.verify(token, env.JWT_SECRET) as IUser
      const requestWithUser = req as RequestWithUser
      requestWithUser.user = user

      if (requirements) {
        const requirementsList = Array.isArray(requirements) ? requirements : [requirements]
        const allowed = requirementsList.some((item) => hasCapability(user, item))

        if (!allowed) {
          res.status(403).json({ success: false, message: 'Insufficient permissions' })
          return
        }
      }

      return handler(requestWithUser, res)
    } catch {
      res.status(401).json({ success: false, message: 'Invalid or expired token' })
    }
  }
}
