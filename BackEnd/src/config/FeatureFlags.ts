/**
 * Single source of truth for feature flags.
 *
 * Flags are UPPER_SNAKE_CASE env vars (e.g. FEATURE_USE_COLLECTIONS) and
 * re-exposed here as camelCase readonly booleans so nothing downstream needs
 * to know anything about env conventions.
 *
 * Every flag defaults to false. Env values are parsed truthy-ish — "1",
 * "true", "TRUE", "yes" all count as on; anything else, including the empty
 * string, is off.
 */

function readBoolean(raw: string | undefined): boolean {
  if (!raw) return false
  const normalized = raw.trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on'
}

export interface IFeatureFlags {
  readonly useCollections: boolean
  readonly shadowWrites: boolean
  readonly adminPin: boolean
  readonly calendarSync: boolean
  readonly eventComments: boolean
  readonly wishesWall: boolean
  readonly sharedLists: boolean
  readonly paymentsLedger: boolean
}

export class FeatureFlags implements IFeatureFlags {
  public readonly useCollections: boolean
  public readonly shadowWrites: boolean
  public readonly adminPin: boolean
  public readonly calendarSync: boolean
  public readonly eventComments: boolean
  public readonly wishesWall: boolean
  public readonly sharedLists: boolean
  public readonly paymentsLedger: boolean

  private constructor(source: NodeJS.ProcessEnv) {
    this.useCollections = readBoolean(source.FEATURE_USE_COLLECTIONS)
    this.shadowWrites = readBoolean(source.FEATURE_SHADOW_WRITES)
    this.adminPin = readBoolean(source.FEATURE_ADMIN_PIN)
    this.calendarSync = readBoolean(source.FEATURE_CALENDAR_SYNC)
    this.eventComments = readBoolean(source.FEATURE_EVENT_COMMENTS)
    this.wishesWall = readBoolean(source.FEATURE_WISHES_WALL)
    this.sharedLists = readBoolean(source.FEATURE_SHARED_LISTS)
    this.paymentsLedger = readBoolean(source.FEATURE_PAYMENTS_LEDGER)
  }

  public static fromEnv(source: NodeJS.ProcessEnv = process.env): FeatureFlags {
    return new FeatureFlags(source)
  }

  public toJSON(): IFeatureFlags {
    return {
      useCollections: this.useCollections,
      shadowWrites: this.shadowWrites,
      adminPin: this.adminPin,
      calendarSync: this.calendarSync,
      eventComments: this.eventComments,
      wishesWall: this.wishesWall,
      sharedLists: this.sharedLists,
      paymentsLedger: this.paymentsLedger,
    }
  }
}

export const featureFlags: FeatureFlags = FeatureFlags.fromEnv()
