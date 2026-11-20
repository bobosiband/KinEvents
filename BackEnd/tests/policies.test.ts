import { RolePolicy } from '../src/auth/policies/RolePolicy'
import { SelfOrRolePolicy } from '../src/auth/policies/SelfOrRolePolicy'
import { OwnerOnlyPolicy } from '../src/auth/policies/OwnerOnlyPolicy'
import { AndPolicy, OrPolicy } from '../src/auth/policies/OrPolicy'
import type { IUser } from '../src/interfaces/user.interface'

const baseUser: IUser = {
  id: 'u1',
  name: 'Alex',
  email: 'alex@test.com',
  role: 'member',
  accessStatus: 'approved',
  capabilities: [],
  notificationPrefs: { level: 'all', channels: ['email'] },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe('PermissionPolicy', () => {
  describe('RolePolicy', () => {
    const policy = new RolePolicy(['admin', 'manager'])

    it('allows configured roles', () => {
      expect(policy.check({ user: { ...baseUser, role: 'admin' } })).toBe(true)
      expect(policy.check({ user: { ...baseUser, role: 'manager' } })).toBe(true)
    })
    it('denies other roles', () => {
      expect(policy.check({ user: { ...baseUser, role: 'member' } })).toBe(false)
    })
  })

  describe('SelfOrRolePolicy', () => {
    const policy = new SelfOrRolePolicy(['admin'])

    it('allows an admin regardless of resource owner', () => {
      expect(policy.check({ user: { ...baseUser, role: 'admin' }, resource: { ownerId: 'other-user' } })).toBe(true)
    })
    it('allows self when owner matches', () => {
      expect(policy.check({ user: { ...baseUser, role: 'member' }, resource: { ownerId: baseUser.id } })).toBe(true)
    })
    it('denies when neither self nor allowed role', () => {
      expect(policy.check({ user: { ...baseUser, role: 'member' }, resource: { ownerId: 'other-user' } })).toBe(false)
    })
    it('denies with no resource and no matching role', () => {
      expect(policy.check({ user: { ...baseUser, role: 'member' } })).toBe(false)
    })
  })

  describe('OwnerOnlyPolicy', () => {
    const policy = new OwnerOnlyPolicy()

    it('allows isOwner admin', () => {
      const owner = { ...baseUser, role: 'admin' as const }
      Object.assign(owner, { isOwner: true })
      expect(policy.check({ user: owner })).toBe(true)
    })
    it('denies non-owner admin', () => {
      expect(policy.check({ user: { ...baseUser, role: 'admin' } })).toBe(false)
    })
    it('denies manager even if isOwner flag is set', () => {
      const mgr = { ...baseUser, role: 'manager' as const }
      Object.assign(mgr, { isOwner: true })
      expect(policy.check({ user: mgr })).toBe(false)
    })
  })

  describe('OrPolicy / AndPolicy', () => {
    it('OR allows when any policy passes', () => {
      const policy = new OrPolicy([new RolePolicy(['admin']), new SelfOrRolePolicy(['manager'])])
      expect(policy.check({ user: { ...baseUser, role: 'admin' } })).toBe(true)
      expect(policy.check({ user: { ...baseUser, role: 'member' }, resource: { ownerId: baseUser.id } })).toBe(true)
      expect(policy.check({ user: { ...baseUser, role: 'member' }, resource: { ownerId: 'other' } })).toBe(false)
      expect(policy.check({ user: { ...baseUser, role: 'manager' } })).toBe(true)
    })
    it('AND requires all policies to pass', () => {
      const policy = new AndPolicy([new RolePolicy(['admin', 'manager']), new SelfOrRolePolicy(['admin'])])
      expect(policy.check({ user: { ...baseUser, role: 'admin' } })).toBe(true)
      expect(policy.check({ user: { ...baseUser, role: 'manager' } })).toBe(false)
      expect(policy.check({ user: { ...baseUser, role: 'manager' }, resource: { ownerId: baseUser.id } })).toBe(true)
    })
  })
})
