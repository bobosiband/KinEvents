import { FeatureFlags } from '../src/config/FeatureFlags'

describe('FeatureFlags', () => {
  it('defaults every flag to false when env is empty', () => {
    const flags = FeatureFlags.fromEnv({} as NodeJS.ProcessEnv)
    const json = flags.toJSON()
    expect(json).toEqual({
      useCollections: false,
      shadowWrites: false,
      adminPin: false,
      calendarSync: false,
      eventComments: false,
      wishesWall: false,
      sharedLists: false,
      paymentsLedger: false,
    })
  })

  it('treats "true", "1", "yes", "on" (case-insensitive) as truthy', () => {
    const truthyValues = ['true', 'TRUE', 'True', '1', 'yes', 'YES', 'on', 'ON']
    for (const value of truthyValues) {
      const flags = FeatureFlags.fromEnv({ FEATURE_USE_COLLECTIONS: value } as NodeJS.ProcessEnv)
      expect(flags.useCollections).toBe(true)
    }
  })

  it('treats "false", "0", "", whitespace, random strings as false', () => {
    const falsyValues = ['false', 'FALSE', '0', '', '  ', 'nope', 'disabled']
    for (const value of falsyValues) {
      const flags = FeatureFlags.fromEnv({ FEATURE_USE_COLLECTIONS: value } as NodeJS.ProcessEnv)
      expect(flags.useCollections).toBe(false)
    }
  })

  it('exposes each flag independently', () => {
    const flags = FeatureFlags.fromEnv({
      FEATURE_USE_COLLECTIONS: 'true',
      FEATURE_SHADOW_WRITES: 'false',
      FEATURE_ADMIN_PIN: 'true',
      FEATURE_CALENDAR_SYNC: 'false',
      FEATURE_EVENT_COMMENTS: 'true',
      FEATURE_WISHES_WALL: 'false',
      FEATURE_SHARED_LISTS: 'true',
      FEATURE_PAYMENTS_LEDGER: 'false',
    } as NodeJS.ProcessEnv)
    expect(flags.useCollections).toBe(true)
    expect(flags.shadowWrites).toBe(false)
    expect(flags.adminPin).toBe(true)
    expect(flags.calendarSync).toBe(false)
    expect(flags.eventComments).toBe(true)
    expect(flags.wishesWall).toBe(false)
    expect(flags.sharedLists).toBe(true)
    expect(flags.paymentsLedger).toBe(false)
  })
})
