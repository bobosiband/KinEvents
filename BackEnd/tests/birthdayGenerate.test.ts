import { randomUUID } from 'crypto'

import { resetDb, seedDb } from './helpers/db.helper'
import { getData } from '../src/config/db'
import { birthdayService } from '../src/services/birthday.service'

function addUserWithBirthday(options: { name: string; birthday: string }): string {
  const id = randomUUID()
  getData().users.push({
    id,
    name: options.name,
    email: `${options.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    role: 'member',
    accessStatus: 'approved',
    capabilities: [],
    notificationPrefs: { level: 'all', channels: ['email'] },
    birthday: options.birthday,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
  })
  return id
}

describe('generateUpcomingBirthdayEvents', () => {
  beforeEach(() => {
    resetDb()
    seedDb({})
  })

  it('creates only the events within the next 30 days', async () => {
    const reference = new Date('2026-06-01T00:00:00.000Z')
    // In range (14 days out)
    addUserWithBirthday({ name: 'Alice', birthday: '1990-06-15' })
    // Out of range (60 days out)
    addUserWithBirthday({ name: 'Bob', birthday: '1990-08-01' })

    const result = await birthdayService.generateUpcomingBirthdayEvents(30, reference)

    expect(result.events).toHaveLength(1)
    expect(result.events[0]?.title).toBe("Alice's Birthday")
    expect(result.skipped).toBe(1)
  })

  it('is idempotent: calling twice does not create duplicate events', async () => {
    const reference = new Date('2026-06-01T00:00:00.000Z')
    addUserWithBirthday({ name: 'Alice', birthday: '1990-06-15' })

    const first = await birthdayService.generateUpcomingBirthdayEvents(30, reference)
    const second = await birthdayService.generateUpcomingBirthdayEvents(30, reference)

    expect(first.events).toHaveLength(1)
    expect(second.events).toHaveLength(0)
    expect(second.skipped).toBe(1)
  })

  it('spans the year boundary so late-December runs catch January birthdays', async () => {
    const reference = new Date('2026-12-20T00:00:00.000Z')
    addUserWithBirthday({ name: 'Alice', birthday: '1990-01-02' })

    const result = await birthdayService.generateUpcomingBirthdayEvents(30, reference)

    expect(result.events).toHaveLength(1)
    expect(result.events[0]?.date).toBe('2027-01-02')
  })

  it('skips past birthdays silently', async () => {
    const reference = new Date('2026-06-01T00:00:00.000Z')
    addUserWithBirthday({ name: 'Alice', birthday: '1990-05-01' })

    const result = await birthdayService.generateUpcomingBirthdayEvents(30, reference)

    expect(result.events).toHaveLength(0)
    expect(result.skipped).toBe(1)
  })
})
