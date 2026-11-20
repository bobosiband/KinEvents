import { PinAuthService, type IPinAccountState } from '../src/auth/PinAuthService'
import { OwnerPolicy, OwnerProtectedError } from '../src/auth/OwnerPolicy'

describe('PinAuthService', () => {
  const service = new PinAuthService()

  it('rejects non-6-digit PINs on hash', async () => {
    await expect(service.hashPin('abc')).rejects.toThrow()
    await expect(service.hashPin('12345')).rejects.toThrow()
    await expect(service.hashPin('1234567')).rejects.toThrow()
  })

  it('accepts a valid PIN and verifies it', async () => {
    const hash = await service.hashPin('123456')
    const result = await service.verify('123456', { pinHash: hash })
    expect(result.accepted).toBe(true)
    expect(result.nextState.failedPinAttempts).toBe(0)
  })

  it('rejects wrong PIN and increments failure counter', async () => {
    const hash = await service.hashPin('123456')
    const first = await service.verify('999999', { pinHash: hash })
    expect(first.accepted).toBe(false)
    expect(first.reason).toBe('wrong-pin')
    expect(first.nextState.failedPinAttempts).toBe(1)
  })

  it('locks the account after 5 wrong attempts in the window', async () => {
    const hash = await service.hashPin('123456')
    let state: IPinAccountState = { pinHash: hash }
    const start = new Date('2026-11-20T12:00:00Z')
    for (let i = 0; i < 4; i++) {
      const r = await service.verify('999999', state, new Date(start.getTime() + i * 1000))
      state = r.nextState
    }
    const fifth = await service.verify('999999', state, new Date(start.getTime() + 5000))
    expect(fifth.accepted).toBe(false)
    expect(fifth.nextState.lockedUntil).toBeDefined()
    expect(service.isLocked(fifth.nextState, new Date(start.getTime() + 5000))).toBe(true)
  })

  it('rejects any PIN while locked, even the correct one', async () => {
    const hash = await service.hashPin('123456')
    const lockedState: IPinAccountState = {
      pinHash: hash,
      lockedUntil: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    }
    const result = await service.verify('123456', lockedState)
    expect(result.accepted).toBe(false)
    expect(result.reason).toBe('locked')
  })

  it('a successful login resets the counter', async () => {
    const hash = await service.hashPin('123456')
    const state: IPinAccountState = {
      pinHash: hash,
      failedPinAttempts: 3,
      firstFailedPinAttemptAt: new Date().toISOString(),
    }
    const result = await service.verify('123456', state)
    expect(result.accepted).toBe(true)
    expect(result.nextState.failedPinAttempts).toBe(0)
    expect(result.nextState.firstFailedPinAttemptAt).toBeUndefined()
  })

  it('failures outside the window start a fresh counter', async () => {
    const hash = await service.hashPin('123456')
    const state: IPinAccountState = {
      pinHash: hash,
      failedPinAttempts: 4,
      firstFailedPinAttemptAt: new Date('2026-11-20T12:00:00Z').toISOString(),
    }
    // 20 minutes later → window expired → counter resets to 1
    const later = new Date('2026-11-20T12:20:00Z')
    const result = await service.verify('999999', state, later)
    expect(result.accepted).toBe(false)
    expect(result.nextState.failedPinAttempts).toBe(1)
  })
})

describe('OwnerPolicy', () => {
  const originalOwnerEmail = process.env.OWNER_EMAIL

  afterEach(() => {
    if (originalOwnerEmail === undefined) delete process.env.OWNER_EMAIL
    else process.env.OWNER_EMAIL = originalOwnerEmail
  })

  it('isOwner returns true when the user email matches OWNER_EMAIL', () => {
    process.env.OWNER_EMAIL = 'owner@kinevents.test'
    expect(OwnerPolicy.isOwner({ email: 'owner@kinevents.test' })).toBe(true)
    expect(OwnerPolicy.isOwner({ email: 'Owner@KinEvents.Test' })).toBe(true)
  })

  it('isOwner returns false for other emails', () => {
    process.env.OWNER_EMAIL = 'owner@kinevents.test'
    expect(OwnerPolicy.isOwner({ email: 'someone@else.test' })).toBe(false)
  })

  it('isOwner returns false when OWNER_EMAIL is unset', () => {
    delete process.env.OWNER_EMAIL
    expect(OwnerPolicy.isOwner({ email: 'owner@kinevents.test' })).toBe(false)
  })

  it('enforceNotTargetingOwner throws for the owner', () => {
    process.env.OWNER_EMAIL = 'owner@kinevents.test'
    expect(() => OwnerPolicy.enforceNotTargetingOwner({ email: 'owner@kinevents.test' }, 'delete')).toThrow(OwnerProtectedError)
    expect(() => OwnerPolicy.enforceNotTargetingOwner({ email: 'owner@kinevents.test' }, 'demote')).toThrow(OwnerProtectedError)
  })

  it('enforceNotTargetingOwner is a no-op for non-owner', () => {
    process.env.OWNER_EMAIL = 'owner@kinevents.test'
    expect(() => OwnerPolicy.enforceNotTargetingOwner({ email: 'someone@else.test' }, 'delete')).not.toThrow()
  })
})
