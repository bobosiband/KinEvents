import type { VercelRequest } from '@vercel/node'

import type { IUser } from './user.interface'

export type AccessRequestStatus = 'pending' | 'approved' | 'rejected'

export interface IAccessRequest {
  id: string
  name: string
  email: string
  message?: string
  status: AccessRequestStatus
  requestedAt: string
  resolvedAt?: string
  resolvedBy?: string
}

export interface IAuthenticatedRequest extends VercelRequest {
  user: IUser
}