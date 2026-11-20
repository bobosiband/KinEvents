import { ScheduledJob } from '../src/scheduler/ScheduledJob'
import { ScheduledJobRunner } from '../src/scheduler/ScheduledJobRunner'
import { BirthdayEventJob } from '../src/scheduler/jobs/BirthdayEventJob'
import { resetDb } from './helpers/db.helper'
import { getData } from '../src/config/db'
import { randomUUID } from 'crypto'

class OkJob extends ScheduledJob {
  public readonly name: string = 'OkJob'
  protected async runInternal(): Promise<Record<string, number>> {
    return { ran: 1 }
  }
}

class FailJob extends ScheduledJob {
  public readonly name: string = 'FailJob'
  protected async runInternal(): Promise<Record<string, number>> {
    throw new Error('boom')
  }
}

describe('ScheduledJobRunner', () => {
  beforeEach(() => resetDb())

  it('runs every job and collects results', async () => {
    const runner = new ScheduledJobRunner([new OkJob(), new FailJob(), new OkJob()])
    const results = await runner.runAll()
    expect(results).toHaveLength(3)
    expect(results[0]?.success).toBe(true)
    expect(results[1]?.success).toBe(false)
    expect(results[1]?.error).toContain('boom')
    expect(results[2]?.success).toBe(true)
  })
})

describe('BirthdayEventJob', () => {
  beforeEach(() => {
    resetDb()
    jest.useFakeTimers({ doNotFake: ['nextTick'] })
    jest.setSystemTime(new Date('2026-05-10T12:00:00.000Z'))
  })
  afterEach(() => jest.useRealTimers())

  it('only creates events for birthdays within the next 30 days', async () => {
    getData().users.push(
      {
        id: randomUUID(),
        name: 'Near Birthday',
        email: 'near@example.com',
        role: 'member',
        accessStatus: 'approved',
        capabilities: [],
        notificationPrefs: { level: 'all', channels: ['email'] },
        birthday: '1990-05-20',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: randomUUID(),
        name: 'Far Birthday',
        email: 'far@example.com',
        role: 'member',
        accessStatus: 'approved',
        capabilities: [],
        notificationPrefs: { level: 'all', channels: ['email'] },
        birthday: '1990-11-20',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    )

    const job = new BirthdayEventJob()
    const result = await job.run()
    expect(result.success).toBe(true)
    expect(result.counts.created).toBe(1)
    expect(getData().events).toHaveLength(1)
    expect(getData().events[0]?.title).toBe('Near Birthday\'s Birthday')
  })

  it('is idempotent — second run creates nothing new', async () => {
    getData().users.push({
      id: randomUUID(),
      name: 'Near Birthday',
      email: 'near@example.com',
      role: 'member',
      accessStatus: 'approved',
      capabilities: [],
      notificationPrefs: { level: 'all', channels: ['email'] },
      birthday: '1990-05-20',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const job = new BirthdayEventJob()
    const first = await job.run()
    const second = await job.run()
    expect(first.counts.created).toBe(1)
    expect(second.counts.created).toBe(0)
    expect(getData().events).toHaveLength(1)
  })
})
