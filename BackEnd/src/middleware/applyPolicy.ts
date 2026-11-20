import type { VercelResponse } from '@vercel/node'
import { ForbiddenActionError, PermissionPolicy, type IRequestContext } from '../auth/policies/PermissionPolicy'
import type { RequestWithUser } from './withAuth'

/**
 * Runs the policy. Writes a 403 to the response and returns false if the
 * policy denies; returns true otherwise. Call after withAuth has attached
 * req.user.
 */
export function applyPolicy(
  req: RequestWithUser,
  res: VercelResponse,
  policy: PermissionPolicy,
  resource?: { ownerId?: string },
): boolean {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' })
    return false
  }
  const context: IRequestContext = { user: req.user, resource }
  if (!policy.check(context)) {
    const error = new ForbiddenActionError(policy)
    res.status(error.statusCode).json({ success: false, message: 'Insufficient permissions', reason: policy.description })
    return false
  }
  return true
}
