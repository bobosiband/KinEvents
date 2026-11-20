import type { UserRole } from '../../interfaces/user.interface'
import { PermissionPolicy, type IRequestContext } from './PermissionPolicy'

export class RolePolicy extends PermissionPolicy {
  public readonly description: string

  public constructor(private readonly allowedRoles: readonly UserRole[]) {
    super()
    this.description = `role in [${allowedRoles.join(', ')}]`
  }

  public check(context: IRequestContext): boolean {
    return this.allowedRoles.includes(context.user.role)
  }
}
