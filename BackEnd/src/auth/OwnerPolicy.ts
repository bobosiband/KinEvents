import type { IUser } from '../interfaces/user.interface'

/**
 * The configured owner admin is the single account that cannot be demoted,
 * locked, or deleted. Identity is pinned by env OWNER_EMAIL at bootstrap;
 * every mutation that could touch role / accessStatus / deletion first runs
 * through OwnerPolicy.enforce().
 */
export class OwnerPolicy {
  public static ownerEmail(): string {
    return (process.env.OWNER_EMAIL ?? '').trim().toLowerCase()
  }

  public static isOwner(user: Pick<IUser, 'email'>): boolean {
    const configured = OwnerPolicy.ownerEmail()
    if (!configured) return false
    return user.email.trim().toLowerCase() === configured
  }

  public static enforceNotTargetingOwner(target: Pick<IUser, 'email'>, action: 'demote' | 'lock' | 'delete' | 'revoke'): void {
    if (OwnerPolicy.isOwner(target)) {
      throw new OwnerProtectedError(`Cannot ${action} the configured owner admin (${target.email})`)
    }
  }
}

export class OwnerProtectedError extends Error {
  public readonly statusCode: number = 400
  public constructor(message: string) {
    super(message)
    this.name = 'OwnerProtectedError'
  }
}
