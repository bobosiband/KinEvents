import { PermissionPolicy, type IRequestContext } from './PermissionPolicy'

/**
 * Allows only the configured "isOwner" admin. Used for mutations that are
 * reserved to the one owner account (handover, demoting the owner, etc).
 */
export class OwnerOnlyPolicy extends PermissionPolicy {
  public readonly description: string = 'is the configured owner admin'

  public check(context: IRequestContext): boolean {
    return context.user.role === 'admin' && Boolean((context.user as { isOwner?: boolean }).isOwner)
  }
}
