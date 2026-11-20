import { IcsBuilder } from '../src/services/calendarSync/IcsBuilder'
import type { IUser } from '../src/interfaces/user.interface'
import type { IEvent } from '../src/interfaces/event.interface'
import icsFeedHandler from '../api/ics/feed'
import type { VercelRequest, VercelResponse } from '@vercel/node'

function makeRes() {
  const res: Partial<VercelResponse> & { statusCode: number; body: unknown; headers: Record<string, string> } = {
    statusCode: 0,
    body: null,
    headers: {},
    status(code: number) {
      this.statusCode = code
      return this as VercelResponse
    },
    json(payload: unknown) {
      this.body = payload
      return this as VercelResponse
    },
    send(payload: unknown) {
      this.body = payload
      return this as VercelResponse
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value
      return this as unknown as VercelResponse
    },
  }
  return res as VercelResponse & { statusCode: number; body: any; headers: Record<string, string> }
}

describe('Calendar sync', () => {
  const previous = process.env.FEATURE_CALENDAR_SYNC

  afterEach(() => {
    if (previous) process.env.FEATURE_CALENDAR_SYNC = previous
    else delete process.env.FEATURE_CALENDAR_SYNC
  })

  describe('IcsBuilder', () => {
    const user: IUser = {
      id: 'u1',
      name: 'Alex, Jr.',
      email: 'alex@example.com',
      role: 'member',
      accessStatus: 'approved',
      capabilities: [],
      notificationPrefs: { level: 'all', channels: ['email'] },
      birthday: '1990-06-15',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }
    const event: IEvent = {
      id: 'e1',
      title: 'Family Reunion',
      description: 'Lunch at Nana\'s',
      date: '2026-12-25T13:30:00Z',
      location: 'Durban',
      type: 'custom',
      locked: false,
      createdBy: 'u1',
      rsvps: { u1: 'yes' },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }

    it('produces a well-formed VCALENDAR with birthday and event', () => {
      const ics = new IcsBuilder().build(user, [event])
      expect(ics).toContain('BEGIN:VCALENDAR')
      expect(ics).toContain('END:VCALENDAR')
      expect(ics).toContain('UID:birthday-u1@kinevents')
      expect(ics).toContain('RRULE:FREQ=YEARLY;COUNT=10')
      expect(ics).toContain('UID:event-e1@kinevents')
      expect(ics).toContain('SUMMARY:Family Reunion')
      expect(ics).toContain('LOCATION:Durban')
    })

    it('escapes special ICS characters (comma, semicolon)', () => {
      const ics = new IcsBuilder().build(user, [])
      expect(ics).toContain(`X-WR-CALNAME:KinEvents — Alex\\, Jr.`)
    })
  })

  describe('feed handler', () => {
    it('returns 404 when calendarSync flag is off', async () => {
      delete process.env.FEATURE_CALENDAR_SYNC
      jest.resetModules()
      const { default: handler } = await import('../api/ics/feed')
      const req = { method: 'GET', query: { token: 'anything' } } as unknown as VercelRequest
      const res = makeRes()
      await handler(req, res)
      expect(res.statusCode).toBe(404)
    })

    it('returns 400 when token is missing', async () => {
      process.env.FEATURE_CALENDAR_SYNC = 'true'
      jest.resetModules()
      const { default: handler } = await import('../api/ics/feed')
      const req = { method: 'GET', query: {} } as unknown as VercelRequest
      const res = makeRes()
      await handler(req, res)
      expect(res.statusCode).toBe(400)
    })
  })
})
