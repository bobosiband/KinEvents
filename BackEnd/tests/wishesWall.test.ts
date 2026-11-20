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

function makeUser(): IUser {
  return {
    id: randomUUID(),
    name: 'Alex',
    email: `${randomUUID()}@example.com`,
    role: 'member',
    accessStatus: 'approved',
    capabilities: [],
    notificationPrefs: { level: 'all', channels: ['email'] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

describe('Wishes wall', () => {
  const previous = process.env.FEATURE_WISHES_WALL

  afterAll(() => {
    if (previous) process.env.FEATURE_WISHES_WALL = previous
    else delete process.env.FEATURE_WISHES_WALL
  })

  it('celebration page returns 404 when flag is off', async () => {
    delete process.env.FEATURE_WISHES_WALL
    jest.resetModules()
    const { default: handler } = await import('../api/celebrate/[eventId]')
    const { resetDb } = await import('./helpers/db.helper')
    const { getData } = await import('../src/config/db')
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

  it('upserting a wish is idempotent per (recipient, year, author)', async () => {
    process.env.FEATURE_WISHES_WALL = 'true'
    jest.resetModules()
    const { wishesStore } = await import('../src/services/wishesStore')
    wishesStore.resetForTesting()

    const first = wishesStore.upsertOwn({
      recipientUserId: 'r1', eventId: 'e1', year: 2026,
      authorId: 'a1', authorName: 'A', message: 'Happy birthday',
    })
    const second = wishesStore.upsertOwn({
      recipientUserId: 'r1', eventId: 'e1', year: 2026,
      authorId: 'a1', authorName: 'A', message: 'Updated wish',
    })
    expect(first.id).toBe(second.id)
    expect(second.message).toBe('Updated wish')
    expect(wishesStore.listApprovedFor('e1')).toHaveLength(1)
  })

  it('moderate(id, "hidden") drops the wish from approved listing', async () => {
    jest.resetModules()
    const { wishesStore } = await import('../src/services/wishesStore')
    wishesStore.resetForTesting()
    const wish = wishesStore.upsertOwn({
      recipientUserId: 'r1', eventId: 'e1', year: 2026,
      authorId: 'a1', authorName: 'A', message: 'hi',
    })
    wishesStore.moderate(wish.id, 'hidden')
    expect(wishesStore.listApprovedFor('e1')).toHaveLength(0)
  })
})
