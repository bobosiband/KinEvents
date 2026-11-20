import { PermissionPolicy, type IRequestContext } from './PermissionPolicy'

export class OrPolicy extends PermissionPolicy {
  public readonly description: string

  public constructor(private readonly policies: readonly PermissionPolicy[]) {
    super()
    this.description = policies.map((p) => p.description).join(' OR ')
  }

  public check(context: IRequestContext): boolean {
    return this.policies.some((policy) => policy.check(context))
  }
}

export class AndPolicy extends PermissionPolicy {
  public readonly description: string

  public constructor(private readonly policies: readonly PermissionPolicy[]) {
    super()
    this.description = policies.map((p) => p.description).join(' AND ')
  }

  public check(context: IRequestContext): boolean {
    return this.policies.every((policy) => policy.check(context))
  }
}
