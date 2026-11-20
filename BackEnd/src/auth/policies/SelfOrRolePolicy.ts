import type { UserRole } from '../../interfaces/user.interface'
import { PermissionPolicy, type IRequestContext } from './PermissionPolicy'

export class SelfOrRolePolicy extends PermissionPolicy {
  public readonly description: string

  public constructor(private readonly allowedRoles: readonly UserRole[]) {
    super()
    this.description = `self or role in [${allowedRoles.join(', ')}]`
  }

  public check(context: IRequestContext): boolean {
    if (this.allowedRoles.includes(context.user.role)) return true
    const ownerId = context.resource?.ownerId
    return ownerId !== undefined && ownerId === context.user.id
  }
}
