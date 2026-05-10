import jwt from 'jsonwebtoken'
import type { IUser } from '../src/interfaces/user.interface'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Ensure JWT_SECRET is available (set in setup.ts)
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-testing-purposes-only'

// Mock users
const mockMember: IUser = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Member User',
  email: 'member@example.com',
  role: 'member',
  accessStatus: 'approved',
  capabilities: ['read:events', 'write:rsvp'],
  notificationPrefs: { level: 'all', channels: ['email'] },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const mockAdmin: IUser = {
  id: '22222222-2222-2222-2222-222222222222',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin',
  accessStatus: 'approved',
  capabilities: ['*'],
  notificationPrefs: { level: 'all', channels: ['email'] },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const createMockRequest = (overrides: Partial<VercelRequest> = {}): VercelRequest => {
  return {
    method: 'GET',
    headers: {},
    query: {},
    ...overrides,
  } as VercelRequest
}

const createMockResponse = (): VercelResponse => {
  const response: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    end: jest.fn(),
    statusCode: 200,
    setHeader: jest.fn(),
  }
  return response
}

describe('API Handler Authentication & Authorization Tests', () => {
  describe('Events API Protection', () => {
    it('GET /api/events should require authentication', async () => {
      // Import the handler
      const eventsHandler = require('../api/events/index').default
      
      const req = createMockRequest({
        method: 'GET',
        headers: {}, // No auth header
      })
      
      const res = createMockResponse()
      
      await eventsHandler(req, res)
      
      // Should be rejected due to withAuth wrapper
      expect(res.status).toHaveBeenCalledWith(401)
    })

    it('GET /api/events should work with valid token', async () => {
      const eventsHandler = require('../api/events/index').default
      const token = jwt.sign(mockMember, JWT_SECRET, { expiresIn: '7d' })
      
      const req = createMockRequest({
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`,
        },
      })
      
      const res = createMockResponse()
      
      await eventsHandler(req, res)
      
      // Should succeed (not 401)
      expect(res.status).not.toHaveBeenCalledWith(401)
    })

    it('POST /api/events should validate URL fields', async () => {
      const eventsHandler = require('../api/events/index').default
      const token = jwt.sign(mockMember, JWT_SECRET, { expiresIn: '7d' })
      
      const req = createMockRequest({
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: {
          title: 'Test Event',
          description: 'A test event',
          date: '2024-12-25T10:00:00Z',
          createdBy: mockMember.id,
          onlineLink: 'not-a-url', // Invalid URL
        },
      })
      
      const res = createMockResponse()
      
      await eventsHandler(req, res)
      
      // Should reject invalid URL
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Validation failed',
        })
      )
    })

    it('POST /api/events should validate date format', async () => {
      const eventsHandler = require('../api/events/index').default
      const token = jwt.sign(mockMember, JWT_SECRET, { expiresIn: '7d' })
      
      const req = createMockRequest({
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: {
          title: 'Test Event',
          description: 'A test event',
          date: 'not-a-date', // Invalid datetime
          createdBy: mockMember.id,
        },
      })
      
      const res = createMockResponse()
      
      await eventsHandler(req, res)
      
      // Should reject invalid date
      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('Users API Protection', () => {
    it('GET /api/users should require authentication', async () => {
      const usersHandler = require('../api/users/index').default
      
      const req = createMockRequest({
        method: 'GET',
        headers: {}, // No auth
      })
      
      const res = createMockResponse()
      
      await usersHandler(req, res)
      
      expect(res.status).toHaveBeenCalledWith(401)
    })

    it('POST /api/users/promote should require admin role', async () => {
      const promoteHandler = require('../api/users/promote').default
      const token = jwt.sign(mockMember, JWT_SECRET, { expiresIn: '7d' })
      
      const req = createMockRequest({
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: {
          userId: '33333333-3333-3333-3333-333333333333',
          role: 'admin',
        },
      })
      
      const res = createMockResponse()
      
      await promoteHandler(req, res)
      
      // Should be forbidden (member, not admin)
      expect(res.status).toHaveBeenCalledWith(403)
    })

    it('POST /api/users/promote should work with admin token', async () => {
      const promoteHandler = require('../api/users/promote').default
      const token = jwt.sign(mockAdmin, JWT_SECRET, { expiresIn: '7d' })
      
      const req = createMockRequest({
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: {
          userId: '33333333-3333-3333-3333-333333333333',
          role: 'admin',
        },
      })
      
      const res = createMockResponse()
      
      await promoteHandler(req, res)
      
      // Should not be 403 (authorization should pass)
      expect(res.status).not.toHaveBeenCalledWith(403)
    })

    it('PATCH /api/users/:id should validate birthday format', async () => {
      const userByIdHandler = require('../api/users/[id]').default
      const token = jwt.sign(mockMember, JWT_SECRET, { expiresIn: '7d' })
      
      const req = createMockRequest({
        method: 'PATCH',
        headers: {
          authorization: `Bearer ${token}`,
        },
        query: {
          id: mockMember.id,
        },
        body: {
          birthday: 'invalid-date', // Should be YYYY-MM-DD format
        },
      })
      
      const res = createMockResponse()
      
      await userByIdHandler(req, res)
      
      // Should reject invalid birthday format
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('PATCH /api/users/:id should accept valid birthday format', async () => {
      const userByIdHandler = require('../api/users/[id]').default
      const token = jwt.sign(mockMember, JWT_SECRET, { expiresIn: '7d' })
      
      const req = createMockRequest({
        method: 'PATCH',
        headers: {
          authorization: `Bearer ${token}`,
        },
        query: {
          id: mockMember.id,
        },
        body: {
          birthday: '1990-05-15', // Valid YYYY-MM-DD format
        },
      })
      
      const res = createMockResponse()
      
      await userByIdHandler(req, res)
      
      // Should not reject for format (may fail for other reasons like user not found)
      const statusCalls = (res.status as any).mock.calls
      const hasValidationError = statusCalls.some((call: number[]) => {
        if (call[0] === 400) {
          const jsonCalls = (res.json as any).mock.calls
          return jsonCalls.some((jCall: any[]) =>
            jCall[0]?.message?.includes('Validation failed')
          )
        }
        return false
      })
      expect(hasValidationError).toBeFalsy()
    })

    it('PATCH /api/users/:id should accept email update for own account', async () => {
      const userByIdHandler = require('../api/users/[id]').default
      const token = jwt.sign(mockMember, JWT_SECRET, { expiresIn: '7d' })

      const req = createMockRequest({
        method: 'PATCH',
        headers: {
          authorization: `Bearer ${token}`,
        },
        query: {
          id: mockMember.id,
        },
        body: {
          email: 'newemail@example.com',
        },
      })

      const res = createMockResponse()

      await userByIdHandler(req, res)

      const statusCalls = (res.status as any).mock.calls
      const hasValidationError = statusCalls.some((call: number[]) =>
        call[0] === 400 &&
        (res.json as any).mock.calls.some((j: any[]) => j[0]?.message?.includes('Validation failed')),
      )

      expect(hasValidationError).toBeFalsy()
    })

    it('PATCH /api/users/:id should reject invalid email', async () => {
      const userByIdHandler = require('../api/users/[id]').default
      const token = jwt.sign(mockMember, JWT_SECRET, { expiresIn: '7d' })

      const req = createMockRequest({
        method: 'PATCH',
        headers: {
          authorization: `Bearer ${token}`,
        },
        query: {
          id: mockMember.id,
        },
        body: {
          email: 'not-an-email',
        },
      })

      const res = createMockResponse()

      await userByIdHandler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('Admin API Protection', () => {
    it('GET /api/admin/dashboard should require admin role', async () => {
      const dashboardHandler = require('../api/admin/dashboard').default
      const token = jwt.sign(mockMember, JWT_SECRET, { expiresIn: '7d' })
      
      const req = createMockRequest({
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`,
        },
      })
      
      const res = createMockResponse()
      
      await dashboardHandler(req, res)
      
      expect(res.status).toHaveBeenCalledWith(403)
    })

    it('GET /api/admin/dashboard should work with admin token', async () => {
      const dashboardHandler = require('../api/admin/dashboard').default
      const token = jwt.sign(mockAdmin, JWT_SECRET, { expiresIn: '7d' })
      
      const req = createMockRequest({
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`,
        },
      })
      
      const res = createMockResponse()
      
      await dashboardHandler(req, res)
      
      expect(res.status).not.toHaveBeenCalledWith(403)
    })

    it('POST /api/admin/content should require admin role', async () => {
      const contentHandler = require('../api/admin/content').default
      const token = jwt.sign(mockMember, JWT_SECRET, { expiresIn: '7d' })
      
      const req = createMockRequest({
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: {
          key: 'homepage_title',
          value: 'Welcome',
          updatedBy: mockAdmin.id,
        },
      })
      
      const res = createMockResponse()
      
      await contentHandler(req, res)
      
      expect(res.status).toHaveBeenCalledWith(403)
    })
  })

  describe('Public Auth Endpoints', () => {
    it('POST /api/auth/request-access should work without token', async () => {
      const requestAccessHandler = require('../api/auth/request-access').default
      
      const req = createMockRequest({
        method: 'POST',
        headers: {},
        body: {
          name: 'New User',
          email: 'newuser@example.com',
          message: 'I want to join',
        },
      })
      
      const res = createMockResponse()
      
      await requestAccessHandler(req, res)
      
      // Should not require auth (status should not be 401)
      expect(res.status).not.toHaveBeenCalledWith(401)
    })

    it('POST /api/auth/login should work without token', async () => {
      const loginHandler = require('../api/auth/login').default
      
      const req = createMockRequest({
        method: 'POST',
        headers: {},
        body: {
          email: 'member@example.com',
        },
      })
      
      const res = createMockResponse()
      
      await loginHandler(req, res)
      
      // Should not require auth
      expect(res.status).not.toHaveBeenCalledWith(401)
    })

    it('POST /api/auth/approve-access should require admin role', async () => {
      const approveHandler = require('../api/auth/approve-access').default
      const token = jwt.sign(mockMember, JWT_SECRET, { expiresIn: '7d' })
      
      const req = createMockRequest({
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: {
          accessRequestId: '44444444-4444-4444-4444-444444444444',
        },
      })
      
      const res = createMockResponse()
      
      await approveHandler(req, res)
      
      // Should be forbidden (member, not admin)
      expect(res.status).toHaveBeenCalledWith(403)
    })

    it('POST /api/auth/revoke-access should require admin role', async () => {
      const revokeHandler = require('../api/auth/revoke-access').default
      const token = jwt.sign(mockMember, JWT_SECRET, { expiresIn: '7d' })
      
      const req = createMockRequest({
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: {
          accessRequestId: '44444444-4444-4444-4444-444444444444',
        },
      })
      
      const res = createMockResponse()
      
      await revokeHandler(req, res)
      
      expect(res.status).toHaveBeenCalledWith(403)
    })
  })

  describe('Birthdays API Protection', () => {
    it('GET /api/birthdays/upcoming should require authentication', async () => {
      const upcomingHandler = require('../api/birthdays/upcoming').default
      
      const req = createMockRequest({
        method: 'GET',
        headers: {},
      })
      
      const res = createMockResponse()
      
      await upcomingHandler(req, res)
      
      expect(res.status).toHaveBeenCalledWith(401)
    })

    it('POST /api/birthdays/generate should require admin role', async () => {
      const generateHandler = require('../api/birthdays/generate').default
      const token = jwt.sign(mockMember, JWT_SECRET, { expiresIn: '7d' })
      
      const req = createMockRequest({
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: {},
      })
      
      const res = createMockResponse()
      
      await generateHandler(req, res)
      
      expect(res.status).toHaveBeenCalledWith(403)
    })
  })
})
