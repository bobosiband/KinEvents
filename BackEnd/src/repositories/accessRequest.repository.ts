import type { IAccessRequest } from '../interfaces/auth.interface'
import { BaseRepository } from './base.repository'

export class AccessRequestRepository extends BaseRepository<'accessRequests', IAccessRequest> {
  constructor() {
    super('accessRequests')
  }

  /**
   * Finds an access request by email address.
    * @param email Email address to search for.
    * @returns The matching access request, or undefined when no match exists.
   */
  findByEmail(email: string): IAccessRequest | undefined {
    return this.findWhere((request) => request.email.toLowerCase() === email.toLowerCase())[0]
  }

  /**
   * Returns every access request with the requested status.
    * @param status Status to match.
    * @returns Every access request that matches the status.
   */
  findByStatus(status: IAccessRequest['status']): IAccessRequest[] {
    return this.findWhere((request) => request.status === status)
  }
}

export const accessRequestRepository = new AccessRequestRepository()