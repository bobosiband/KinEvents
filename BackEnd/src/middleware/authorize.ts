import type { NextFunction, Response } from 'express'

import { ROLE_CAPABILITIES } from '../constants/roles'
import type { IUser, UserRole } from '../interfaces/user.interface'
import type { RequestWithUser } from './authenticate'

type AuthorizationRequirement = UserRole | string

function hasCapability(user: IUser, requirement: AuthorizationRequirement): boolean {
  if (requirement in ROLE_CAPABILITIES) {
    return user.role === requirement
  }

  return user.capabilities.includes(requirement)
}

/**
 * Requires the current user to match one of the provided roles or capabilities.
 * @param requirement A single role/capability or a list of acceptable values.
 */
export function authorize(requirement: AuthorizationRequirement | AuthorizationRequirement[]) {
  const requirements = Array.isArray(requirement) ? requirement : [requirement]

  return (request: RequestWithUser, response: Response, next: NextFunction) => {
    if (!request.user) {
      response.status(401).json({ success: false, message: 'Authentication required' })
      return
    }

    const allowed = requirements.some((item) => hasCapability(request.user as IUser, item))

    if (!allowed) {
      response.status(403).json({ success: false, message: 'Insufficient permissions' })
      return
    }

    next()
  }
}