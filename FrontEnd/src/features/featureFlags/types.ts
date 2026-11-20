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

export const DEFAULT_FEATURE_FLAGS: IFeatureFlags = {
  useCollections: false,
  shadowWrites: false,
  adminPin: false,
  calendarSync: false,
  eventComments: false,
  wishesWall: false,
  sharedLists: false,
  paymentsLedger: false,
}

export const FEATURE_FLAG_LABELS: Record<keyof IFeatureFlags, string> = {
  useCollections: 'Use new collections',
  shadowWrites: 'Shadow writes to new collections',
  adminPin: 'Admin / manager PIN login',
  calendarSync: 'Per-user calendar (ICS) sync',
  eventComments: 'Event comments',
  wishesWall: 'Wishes wall',
  sharedLists: 'Shared lists & potluck',
  paymentsLedger: 'Payments ledger',
}
