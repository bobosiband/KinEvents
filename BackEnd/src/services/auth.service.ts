import { randomUUID } from 'crypto'

import { getData, persistData } from '../config/db'
import { ROLE_CAPABILITIES, USER_ROLES } from '../constants/roles'
import type { IAccessRequest } from '../interfaces/auth.interface'
import type { IUser } from '../interfaces/user.interface'

export interface RequestAccessInput {
  name: string
  email: string
  message?: string
}

function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase()
}

export class AuthService {
  getApprovedUser(email: string): IUser | null {
    return getData().users.find(
      (user) => normalizeEmail(user.email) === normalizeEmail(email) && user.accessStatus === 'approved'
    ) ?? null
  }

  async requestAccess(input: RequestAccessInput): Promise<IAccessRequest> {
    const { accessRequests } = getData()
    const existing = accessRequests.find(
      (request) => normalizeEmail(request.email) === normalizeEmail(input.email) && request.status === 'pending'
    )
    if (existing) return existing

    const now = new Date().toISOString()
    const request: IAccessRequest = {
      id: randomUUID(),
      name: input.name,
      email: input.email,
      message: input.message,
      status: 'pending',
      requestedAt: now,
    }
    getData().accessRequests.push(request)
    await persistData()
    return request
  }

  async approveAccess(accessRequestId: string, resolvedBy = 'system'): Promise<{ request: IAccessRequest; user: IUser }> {
    const db = getData()
    const request = db.accessRequests.find((item) => item.id === accessRequestId)
    if (!request) throw new Error('Access request not found')

    const now = new Date().toISOString()
    request.status = 'approved'
    request.resolvedAt = now
    request.resolvedBy = resolvedBy

    const existingUser = db.users.find((user) => normalizeEmail(user.email) === normalizeEmail(request.email))
    let user: IUser

    if (existingUser) {
      existingUser.name = request.name
      existingUser.accessStatus = 'approved'
      existingUser.role = USER_ROLES.MEMBER
      existingUser.capabilities = [...ROLE_CAPABILITIES.member]
      existingUser.updatedAt = now
      user = existingUser
    } else {
      user = {
        id: randomUUID(),
        name: request.name,
        email: request.email,
        role: USER_ROLES.MEMBER,
        accessStatus: 'approved',
        capabilities: [...ROLE_CAPABILITIES.member],
        notificationPrefs: { level: 'all', channels: ['email'] },
        createdAt: now,
        updatedAt: now,
      }
      db.users.push(user)
    }

    await persistData()
    return { request, user }
  }

  async revokeAccess(accessRequestId: string, resolvedBy = 'system'): Promise<IAccessRequest> {
    const db = getData()
    const request = db.accessRequests.find((item) => item.id === accessRequestId)
    if (!request) throw new Error('Access request not found')

    const now = new Date().toISOString()
    const previousState = {
      status: request.status,
      resolvedAt: request.resolvedAt,
      resolvedBy: request.resolvedBy,
    }

    request.status = 'rejected'
    request.resolvedAt = now
    request.resolvedBy = resolvedBy

    try {
      await persistData()
    } catch (error) {
      Object.assign(request, previousState)
      throw error
    }

    return request
  }

  async listAccessRequests(): Promise<IAccessRequest[]> {
    return getData().accessRequests
  }

  async listApprovedUsers(): Promise<IUser[]> {
    return getData().users.filter((user) => user.accessStatus === 'approved')
  }
}

export const authService = new AuthService()