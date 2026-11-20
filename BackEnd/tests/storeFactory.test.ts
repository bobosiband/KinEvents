describe('StoreFactory (useCollections off)', () => {
  const previous = process.env.FEATURE_USE_COLLECTIONS

  beforeAll(() => {
    delete process.env.FEATURE_USE_COLLECTIONS
  })
  afterAll(() => {
    if (previous) process.env.FEATURE_USE_COLLECTIONS = previous
  })

  it('returns a LegacyDocumentUserStore when the flag is off', async () => {
    jest.resetModules()
    const { StoreFactory } = await import('../src/stores/StoreFactory')
    const { LegacyDocumentUserStore } = await import('../src/stores/LegacyDocumentUserStore')
    StoreFactory.resetForTesting()
    const users = StoreFactory.users()
    expect(users).toBeInstanceOf(LegacyDocumentUserStore)
  })

  it('returns a LegacyDocumentEventStore when the flag is off', async () => {
    jest.resetModules()
    const { StoreFactory } = await import('../src/stores/StoreFactory')
    const { LegacyDocumentEventStore } = await import('../src/stores/LegacyDocumentEventStore')
    StoreFactory.resetForTesting()
    const events = StoreFactory.events()
    expect(events).toBeInstanceOf(LegacyDocumentEventStore)
  })
})
