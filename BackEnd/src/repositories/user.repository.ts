import type { IUser } from '../interfaces/user.interface'
import { BaseRepository } from './base.repository'

export class UserRepository extends BaseRepository<'users', IUser> {
  constructor() {
    super('users')
  }

  /**
   * Finds a user by email address.
    * @param email Email address to search for.
    * @returns The matching user, or undefined when no user exists.
   */
  findByEmail(email: string): IUser | undefined {
    return this.findWhere((user) => user.email.toLowerCase() === email.toLowerCase())[0]
  }

  /**
   * Returns every user with the requested role.
    * @param role Role to match.
    * @returns Every user that matches the role.
   */
  findByRole(role: IUser['role']): IUser[] {
    return this.findWhere((user) => user.role === role)
  }

  /**
   * Returns every user with the requested access status.
    * @param accessStatus Access status to match.
    * @returns Every user that matches the access status.
   */
  findByAccessStatus(accessStatus: IUser['accessStatus']): IUser[] {
    return this.findWhere((user) => user.accessStatus === accessStatus)
  }
}

export const userRepository = new UserRepository()