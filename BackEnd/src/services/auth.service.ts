import { randomUUID } from 'crypto'

import { ROLE_CAPABILITIES, USER_ROLES } from '../constants/roles'
import type { IAccessRequest } from '../interfaces/auth.interface'
import type { IUser } from '../interfaces/user.interface'
import { accessRequestRepository } from '../repositories/accessRequest.repository'
import { userRepository } from '../repositories/user.repository'

function createDefaultUser(name: string, email: string): IUser {
  const now = new Date().toISOString()

  return {
    id: randomUUID(),
    name,
    email,
    role: USER_ROLES.MEMBER,
    accessStatus: 'approved',
    capabilities: [...ROLE_CAPABILITIES.member],
    notificationPrefs: {
      level: 'all',
      channels: ['email'],
    },
    createdAt: now,
    updatedAt: now,
  }
}

export interface RequestAccessInput {
  name: string
  email: string
  message?: string
}

export class AuthService {
  /**
   * Creates a new pending access request unless an identical pending request already exists.
    * @param input Request data submitted by the user.
    * @returns The existing or newly created access request.
   */
  async requestAccess(input: RequestAccessInput): Promise<IAccessRequest> {
    const existingRequest = accessRequestRepository.findByEmail(input.email)

    if (existingRequest && existingRequest.status === 'pending') {
      return existingRequest
    }

    const now = new Date().toISOString()
    const request: IAccessRequest = {
      id: randomUUID(),
      name: input.name,
      email: input.email,
      message: input.message,
      status: 'pending',
      requestedAt: now,
    }

    await accessRequestRepository.insert(request)
    return request
  }

  /**
   * Marks an access request approved and creates or updates the corresponding user.
    * @param accessRequestId Access request identifier.
    * @param resolvedBy Identifier for the admin or system actor that resolved it.
    * @returns The updated request and user records.
   */
  async approveAccess(accessRequestId: string, resolvedBy = 'system'): Promise<{ request: IAccessRequest; user: IUser }> {
    const request = accessRequestRepository.findById(accessRequestId)

    if (!request) {
      throw new Error('Access request not found')
    }

    const now = new Date().toISOString()
    const updatedRequest = await accessRequestRepository.update(accessRequestId, {
      status: 'approved',
      resolvedAt: now,
      resolvedBy,
    })

    if (!updatedRequest) {
      throw new Error('Access request could not be approved')
    }

    const existingUser = userRepository.findByEmail(request.email)
    const user = existingUser
      ? await userRepository.update(existingUser.id, {
          name: request.name,
          accessStatus: 'approved',
          role: USER_ROLES.MEMBER,
          capabilities: [...ROLE_CAPABILITIES.member],
          updatedAt: now,
        })
      : await userRepository.insert(createDefaultUser(request.name, request.email))

    if (!user) {
      throw new Error('User could not be created or updated')
    }

    return { request: updatedRequest, user }
  }

  /**
   * Marks an access request as rejected.
    * @param accessRequestId Access request identifier.
    * @param resolvedBy Identifier for the admin or system actor that resolved it.
    * @returns The rejected access request.
   */
  async revokeAccess(accessRequestId: string, resolvedBy = 'system'): Promise<IAccessRequest> {
    const now = new Date().toISOString()
    const updatedRequest = await accessRequestRepository.update(accessRequestId, {
      status: 'rejected',
      resolvedAt: now,
      resolvedBy,
    })

    if (!updatedRequest) {
      throw new Error('Access request not found')
    }

    return updatedRequest
  }

  /**
   * Returns every stored access request.
    * @returns All access requests.
   */
  async listAccessRequests(): Promise<IAccessRequest[]> {
    return accessRequestRepository.findAll()
  }

  /**
   * Returns every user whose access has been approved.
    * @returns All approved users.
   */
  async listApprovedUsers(): Promise<IUser[]> {
    return userRepository.findByAccessStatus('approved')
  }
}

export const authService = new AuthService()