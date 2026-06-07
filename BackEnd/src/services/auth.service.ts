import { randomUUID } from 'crypto'

import { readData, persistData } from '../config/db'
import { ROLE_CAPABILITIES, USER_ROLES } from '../constants/roles'
import type { IAccessRequest } from '../interfaces/auth.interface'
import type { IUser } from '../interfaces/user.interface'
import { notificationDispatcher } from './notification-dispatcher.service'
import { notificationService } from './notification.service'

export interface RequestAccessInput {
  name: string
  email: string
  message?: string
}

function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase()
}

export class AuthService {
  async getApprovedUser(email: string): Promise<IUser | null> {
    const db = await readData()
    return db.users.find(
      (user) => normalizeEmail(user.email) === normalizeEmail(email) && user.accessStatus === 'approved'
    ) ?? null
  }

  async requestAccess(input: RequestAccessInput): Promise<IAccessRequest> {
    const db = await readData()
    const existing = db.accessRequests.find(
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

    db.accessRequests.push(request)
    await persistData()

    await notificationDispatcher.onAccessRequested(request)
    return request
  }

  async approveAccess(accessRequestId: string, resolvedBy = 'system'): Promise<{ request: IAccessRequest; user: IUser }> {
    const db = await readData()
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
        notificationPrefs: { level: 'all', channels: ['email', 'whatsapp'] },
        createdAt: now,
        updatedAt: now,
      }
      db.users.push(user)
    }

    db.accessRequests.splice(requestIndex, 1)
    db.accessRequestHistory.push(request)
    await persistData()

    try {
      notificationService.createNotification({
        type: 'access_approved',
        recipientId: user.id,
        status: 'sent',
        payload: {
          recipientName: user.name,
        },
      }).catch((error: unknown) => console.error('[AuthService] access_approved notification failed:', error))

      notificationDispatcher.onAccessApproved(user).catch((error: unknown) => console.error('[AuthService] notificationDispatcher.onAccessApproved failed:', error))

      if (isNewUser) {
        notificationDispatcher.onWelcome(user).catch((error: unknown) => console.error('[AuthService] notificationDispatcher.onWelcome failed:', error))
      }
    } catch (error) {
      console.error('[AuthService] Notification dispatch failed:', error)
    }

    return { request, user }
  }

  async revokeAccess(accessRequestId: string, resolvedBy = 'system'): Promise<IAccessRequest> {
    const db = await readData()
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
      db.accessRequests.splice(requestIndex, 1)
      db.accessRequestHistory.push(request)
      await persistData()
    } catch (error) {
      Object.assign(request, previousState)
      throw error
    }

    try {
      await notificationDispatcher.onAccessRejected(request)
    } catch (error) {
      console.error('[AuthService] Notification dispatch failed:', error)
    }

    return request
  }

  async listAccessRequests(): Promise<IAccessRequest[]> {
    const db = await readData()
    return db.accessRequests.filter((request) => request.status === 'pending')
  }

  async listAccessRequestHistory(): Promise<IAccessRequest[]> {
    const db = await readData()
    return db.accessRequestHistory
  }

  async listApprovedUsers(): Promise<IUser[]> {
    const db = await readData()
    return db.users.filter((user) => user.accessStatus === 'approved')
  }
}

export const authService = new AuthService()
