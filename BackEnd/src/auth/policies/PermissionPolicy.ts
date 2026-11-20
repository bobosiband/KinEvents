import type { IUser } from '../../interfaces/user.interface'

export interface IRequestContext {
  readonly user: IUser
  readonly resource?: { readonly ownerId?: string }
}

export abstract class PermissionPolicy {
  public abstract check(context: IRequestContext): boolean
  public abstract readonly description: string
}

export class ForbiddenActionError extends Error {
  public readonly statusCode: number = 403
  public constructor(policy: PermissionPolicy) {
    super(`Forbidden: fails policy "${policy.description}"`)
    this.name = 'ForbiddenActionError'
  }
}
