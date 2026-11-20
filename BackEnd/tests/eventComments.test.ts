import type { VercelRequest, VercelResponse } from '@vercel/node'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'

import type { IUser } from '../src/interfaces/user.interface'

function makeRes() {
  const res: Partial<VercelResponse> & { statusCode: number; body: unknown } = {
    statusCode: 0,
    body: null,
    status(code: number) {
      this.statusCode = code
      return this as VercelResponse
    },
    json(payload: unknown) {
      this.body = payload
      return this as VercelResponse
    },
  }
  return res as VercelResponse & { statusCode: number; body: any }
}

function tokenFor(user: IUser): string {
  return jwt.sign(user, process.env.JWT_SECRET || 'test-secret-key-for-testing-purposes-only')
}

function makeUser(role: IUser['role'] = 'member'): IUser {
  return {
    id: randomUUID(),
    name: 'Alex',
    email: `${randomUUID()}@example.com`,
    role,
    accessStatus: 'approved',
    capabilities: [],
    notificationPrefs: { level: 'all', channels: ['email'] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

describe('Event comments handler', () => {
  const previous = process.env.FEATURE_EVENT_COMMENTS

  afterAll(() => {
    if (previous) process.env.FEATURE_EVENT_COMMENTS = previous
    else delete process.env.FEATURE_EVENT_COMMENTS
  })

  it('returns 404 when flag is off', async () => {
    delete process.env.FEATURE_EVENT_COMMENTS
    jest.resetModules()
    const { default: handler } = await import('../api/events/[eventId]/comments')
    const { getData } = await import('../src/config/db')
    const { resetDb } = await import('./helpers/db.helper')
    resetDb()
    const user = makeUser()
    getData().users.push(user)

    const req = {
      method: 'GET',
      headers: { authorization: `Bearer ${tokenFor(user)}` },
      query: { eventId: 'evt-1' },
    } as unknown as VercelRequest
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(404)
  })

  it('creates and lists comments when flag is on', async () => {
    process.env.FEATURE_EVENT_COMMENTS = 'true'
    jest.resetModules()
    const { default: handler } = await import('../api/events/[eventId]/comments')
    const { getData } = await import('../src/config/db')
    const { resetDb } = await import('./helpers/db.helper')
    resetDb()
    const user = makeUser()
    getData().users.push(user)

    const create = {
      method: 'POST',
      headers: { authorization: `Bearer ${tokenFor(user)}` },
      query: { eventId: 'evt-1' },
      body: { body: 'What time does it start?' },
    } as unknown as VercelRequest
    const createRes = makeRes()
    await handler(create, createRes)
    expect(createRes.statusCode).toBe(201)
    expect(createRes.body.data.body).toBe('What time does it start?')

    const list = {
      method: 'GET',
      headers: { authorization: `Bearer ${tokenFor(user)}` },
      query: { eventId: 'evt-1' },
    } as unknown as VercelRequest
    const listRes = makeRes()
    await handler(list, listRes)
    expect(listRes.statusCode).toBe(200)
    expect(listRes.body.data.length).toBeGreaterThanOrEqual(1)
  })
})
