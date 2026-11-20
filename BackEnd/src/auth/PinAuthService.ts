import bcrypt from 'bcryptjs'

export interface IPinAccountState {
  readonly pinHash?: string
  readonly failedPinAttempts?: number
  readonly firstFailedPinAttemptAt?: string
  readonly lockedUntil?: string
}

export interface IPinVerificationResult {
  readonly accepted: boolean
  readonly reason?: 'locked' | 'not-set' | 'invalid-format' | 'wrong-pin'
  readonly nextState: IPinAccountState
}

export class PinAuthService {
  private static readonly BcryptRounds: number = 10
  private static readonly PinLength: number = 6
  private static readonly PinPattern: RegExp = /^\d{6}$/
  private static readonly MaxFailedAttempts: number = 5
  private static readonly AttemptWindowMs: number = 15 * 60 * 1000
  private static readonly LockoutMs: number = 15 * 60 * 1000

  public async hashPin(rawPin: string): Promise<string> {
    if (!PinAuthService.PinPattern.test(rawPin)) {
      throw new Error('PIN must be exactly 6 digits')
    }
    return bcrypt.hash(rawPin, PinAuthService.BcryptRounds)
  }

  public async verify(rawPin: string, state: IPinAccountState, now: Date = new Date()): Promise<IPinVerificationResult> {
    if (state.lockedUntil && new Date(state.lockedUntil).getTime() > now.getTime()) {
      return { accepted: false, reason: 'locked', nextState: state }
    }
    if (!state.pinHash) {
      return { accepted: false, reason: 'not-set', nextState: state }
    }
    if (!PinAuthService.PinPattern.test(rawPin)) {
      return { accepted: false, reason: 'invalid-format', nextState: this.recordFailure(state, now) }
    }
    const matches = await bcrypt.compare(rawPin, state.pinHash)
    if (!matches) {
      return { accepted: false, reason: 'wrong-pin', nextState: this.recordFailure(state, now) }
    }
    return {
      accepted: true,
      nextState: {
        pinHash: state.pinHash,
        failedPinAttempts: 0,
        firstFailedPinAttemptAt: undefined,
        lockedUntil: undefined,
      },
    }
  }

  public isLocked(state: IPinAccountState, now: Date = new Date()): boolean {
    if (!state.lockedUntil) return false
    return new Date(state.lockedUntil).getTime() > now.getTime()
  }

  private recordFailure(state: IPinAccountState, now: Date): IPinAccountState {
    const windowStart = state.firstFailedPinAttemptAt
      ? new Date(state.firstFailedPinAttemptAt).getTime()
      : 0
    const inWindow = windowStart > 0 && now.getTime() - windowStart < PinAuthService.AttemptWindowMs
    const attempts = inWindow ? (state.failedPinAttempts ?? 0) + 1 : 1
    const nextFirstFailed = inWindow && state.firstFailedPinAttemptAt ? state.firstFailedPinAttemptAt : now.toISOString()

    if (attempts >= PinAuthService.MaxFailedAttempts) {
      return {
        pinHash: state.pinHash,
        failedPinAttempts: 0,
        firstFailedPinAttemptAt: undefined,
        lockedUntil: new Date(now.getTime() + PinAuthService.LockoutMs).toISOString(),
      }
    }
    return {
      pinHash: state.pinHash,
      failedPinAttempts: attempts,
      firstFailedPinAttemptAt: nextFirstFailed,
      lockedUntil: state.lockedUntil,
    }
  }
}
