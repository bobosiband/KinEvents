import { randomUUID } from 'crypto'

import { getData, persistData } from '../config/db'
import { ROLE_CAPABILITIES, USER_ROLES } from '../constants/roles'
import type { IAccessRequest } from '../interfaces/auth.interface'
import type { IUser } from '../interfaces/user.interface'
import { emailDispatcher } from './email-dispatcher.service'
import { emailService } from './email.service'
import { env } from '../config/env'

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
    const requestIndex = db.accessRequests.findIndex((item) => item.id === accessRequestId)
    if (requestIndex < 0) throw new Error('Access request not found')

    const request = db.accessRequests[requestIndex]
    const now = new Date().toISOString()
    request.status = 'approved'
    request.resolvedAt = now
    request.resolvedBy = resolvedBy

    const existingUser = db.users.find((user) => normalizeEmail(user.email) === normalizeEmail(request.email))
    let user: IUser
    const isNewUser = !existingUser

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

    // Move resolved request from active to history
    db.accessRequests.splice(requestIndex, 1)
    db.accessRequestHistory.push(request)

    await persistData()

    // Send notification emails (non-blocking)
    try {
      emailDispatcher.onAccessApproved(user).catch((err) => console.error('[AuthService] emailDispatcher.onAccessApproved failed:', err))
      if (isNewUser) {
        emailDispatcher.onWelcome(user).catch((err) => console.error('[AuthService] emailDispatcher.onWelcome failed:', err))
      }
    } catch (error) {
      console.error('[AuthService] Email dispatch failed:', error)
    }

    // Also send a simple approval email (fire-and-forget)
    emailService
      .send(
        {
          to: { name: user.name, email: user.email },
          subject: 'Your KinEvents access has been approved',
          text: `Welcome ${user.name}! Your access to KinEvents has been approved. Sign in at ${env.APP_URL}/login`,
          html: `<h2>Welcome to KinEvents! 🏠</h2><p>Hi <strong>${user.name}</strong>, your access has been approved.</p><p><a href="${env.APP_URL}/login">Sign In Now</a></p>`,
        },
        { templateName: 'access-approved', recipientId: user.id }
      )
      .catch((err) => console.error('[AUTH] Approval email error:', err))

    return { request, user }
  }

  async revokeAccess(accessRequestId: string, resolvedBy = 'system'): Promise<IAccessRequest> {
    const db = getData()
    const requestIndex = db.accessRequests.findIndex((item) => item.id === accessRequestId)
    if (requestIndex < 0) throw new Error('Access request not found')

    const request = db.accessRequests[requestIndex]
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
      // Move resolved request from active to history
      db.accessRequests.splice(requestIndex, 1)
      db.accessRequestHistory.push(request)

      await persistData()
    } catch (error) {
      Object.assign(request, previousState)
      throw error
    }

    // Send notification email (non-blocking)
    try {
      await emailDispatcher.onAccessRejected(request)
    } catch (error) {
      console.error('[AuthService] Email dispatch failed:', error)
      // Don't throw - email failures don't affect the primary operation
    }

    return request
  }

  async listAccessRequests(): Promise<IAccessRequest[]> {
    return getData().accessRequests.filter((request) => request.status === 'pending')
  }

  async listAccessRequestHistory(): Promise<IAccessRequest[]> {
    return getData().accessRequestHistory
  }

  async listApprovedUsers(): Promise<IUser[]> {
    return getData().users.filter((user) => user.accessStatus === 'approved')
  }
}

export const authService = new AuthService()