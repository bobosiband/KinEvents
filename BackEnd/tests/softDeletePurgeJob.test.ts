import { SoftDeletePurgeJob } from '../src/scheduler/jobs/SoftDeletePurgeJob'

describe('SoftDeletePurgeJob', () => {
  const previous = process.env.FEATURE_USE_COLLECTIONS

  afterEach(() => {
    if (previous) process.env.FEATURE_USE_COLLECTIONS = previous
    else delete process.env.FEATURE_USE_COLLECTIONS
  })

  it('is a no-op when FEATURE_USE_COLLECTIONS is off', async () => {
    delete process.env.FEATURE_USE_COLLECTIONS
    jest.resetModules()
    const { SoftDeletePurgeJob: Job } = await import('../src/scheduler/jobs/SoftDeletePurgeJob')
    const job = new Job()
    const result = await job.run()
    expect(result.success).toBe(true)
    expect(result.counts).toMatchObject({ archived: 0, hardDeleted: 0 })
  })

  it('returns zero counts (no-op stub) when the flag is on', async () => {
    process.env.FEATURE_USE_COLLECTIONS = 'true'
    jest.resetModules()
    const { SoftDeletePurgeJob: Job } = await import('../src/scheduler/jobs/SoftDeletePurgeJob')
    const job = new Job()
    const result = await job.run()
    expect(result.success).toBe(true)
    expect(result.counts.archived).toBeGreaterThanOrEqual(0)
    expect(result.counts.hardDeleted).toBeGreaterThanOrEqual(0)
  })

  it('reports its name', () => {
    const job = new SoftDeletePurgeJob()
    expect(job.name).toBe('SoftDeletePurgeJob')
  })
})
