describe('db persistence guard', () => {
  const originalEnv = process.env.NODE_ENV

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  it('rejects persistData() before initData() completes in production mode', async () => {
    process.env.NODE_ENV = 'production'

    const { persistData, resetInitForTesting } = await import('../src/config/db')
    resetInitForTesting()

    await expect(persistData()).rejects.toThrow('Database not initialized - cannot persist data safely')
  })
})