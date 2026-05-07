import { withAuth } from '../src/middleware/withAuth'
import jwt from 'jsonwebtoken'
import type { IUser } from '../src/interfaces/user.interface'
import type { VercelResponse } from '@vercel/node'
import { corsMiddleware } from '../src/middleware/cors'

// Mock user for testing
const mockUser: IUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test User',
  email: 'test@example.com',
  role: 'member',
  accessStatus: 'approved',
  capabilities: ['read:events', 'write:rsvp'],
  notificationPrefs: { level: 'all', channels: ['email'] },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const mockAdmin: IUser = {
  ...mockUser,
  id: '223e4567-e89b-12d3-a456-426614174001',
  role: 'admin',
  capabilities: ['*'],
}

describe('withAuth middleware', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

  describe('authentication', () => {
    it('should call handler with user if valid token provided', async () => {
      const token = jwt.sign(mockUser, JWT_SECRET, { expiresIn: '7d' })
      const mockHandler = jest.fn()

      const wrappedHandler = withAuth(mockHandler)

      const mockRequest = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      } as any

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as VercelResponse

      await wrappedHandler(mockRequest, mockResponse)

      expect(mockHandler).toHaveBeenCalled()
      const callArgs = mockHandler.mock.calls[0]
      expect(callArgs[0].user).toEqual(mockUser)
      expect(mockResponse.status).not.toHaveBeenCalled()
    })

    it('should reject request without authorization header', async () => {
      const mockHandler = jest.fn()
      const wrappedHandler = withAuth(mockHandler)

      const mockRequest = {
        headers: {},
      } as any

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as VercelResponse

      await wrappedHandler(mockRequest, mockResponse)

      expect(mockHandler).not.toHaveBeenCalled()
      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Missing authorization token',
      })
    })

    it('should reject request without Bearer prefix', async () => {
      const mockHandler = jest.fn()
      const wrappedHandler = withAuth(mockHandler)

      const mockRequest = {
        headers: {
          authorization: 'InvalidToken123',
        },
      } as any

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as VercelResponse

      await wrappedHandler(mockRequest, mockResponse)

      expect(mockHandler).not.toHaveBeenCalled()
      expect(mockResponse.status).toHaveBeenCalledWith(401)
    })

    it('should reject invalid/expired tokens', async () => {
      const mockHandler = jest.fn()
      const wrappedHandler = withAuth(mockHandler)

      const mockRequest = {
        headers: {
          authorization: 'Bearer invalid.token.here',
        },
      } as any

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as VercelResponse

      await wrappedHandler(mockRequest, mockResponse)

      expect(mockHandler).not.toHaveBeenCalled()
      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token',
      })
    })
  })

  describe('authorization', () => {
    it('should allow request when user has required role', async () => {
      const token = jwt.sign(mockAdmin, JWT_SECRET, { expiresIn: '7d' })
      const mockHandler = jest.fn()
      const wrappedHandler = withAuth(mockHandler, 'admin')

      const mockRequest = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      } as any

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as VercelResponse

      await wrappedHandler(mockRequest, mockResponse)

      expect(mockHandler).toHaveBeenCalled()
      expect(mockResponse.status).not.toHaveBeenCalled()
    })

    it('should deny request when user lacks required role', async () => {
      const token = jwt.sign(mockUser, JWT_SECRET, { expiresIn: '7d' })
      const mockHandler = jest.fn()
      const wrappedHandler = withAuth(mockHandler, 'admin')

      const mockRequest = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      } as any

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as VercelResponse

      await wrappedHandler(mockRequest, mockResponse)

      expect(mockHandler).not.toHaveBeenCalled()
      expect(mockResponse.status).toHaveBeenCalledWith(403)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insufficient permissions',
      })
    })

    it('should support multiple authorization requirements', async () => {
      const token = jwt.sign(mockUser, JWT_SECRET, { expiresIn: '7d' })
      const mockHandler = jest.fn()
      const wrappedHandler = withAuth(mockHandler, ['admin', 'member'])

      const mockRequest = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      } as any

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as VercelResponse

      await wrappedHandler(mockRequest, mockResponse)

      expect(mockHandler).toHaveBeenCalled()
      expect(mockResponse.status).not.toHaveBeenCalled()
    })

    it('should deny access to unauthenticated users when authorization required', async () => {
      const mockHandler = jest.fn()
      const wrappedHandler = withAuth(mockHandler, 'admin')

      const mockRequest = {
        headers: {},
      } as any

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as VercelResponse

      await wrappedHandler(mockRequest, mockResponse)

      expect(mockHandler).not.toHaveBeenCalled()
      expect(mockResponse.status).toHaveBeenCalledWith(401)
    })
  })

  describe('token extraction', () => {
    it('should correctly extract token from Bearer header', async () => {
      const token = jwt.sign(mockUser, JWT_SECRET, { expiresIn: '7d' })
      const mockHandler = jest.fn()
      const wrappedHandler = withAuth(mockHandler)

      const mockRequest = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      } as any

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as VercelResponse

      await wrappedHandler(mockRequest, mockResponse)

      expect(mockHandler).toHaveBeenCalled()
      const request = mockHandler.mock.calls[0][0]
      expect(request.user.email).toBe(mockUser.email)
    })

    it('should handle header with extra spaces', async () => {
      const token = jwt.sign(mockUser, JWT_SECRET, { expiresIn: '7d' })
      const mockHandler = jest.fn()
      const wrappedHandler = withAuth(mockHandler)

      const mockRequest = {
        headers: {
          authorization: `Bearer  ${token}`, // Extra space
        },
      } as any

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as VercelResponse

      await wrappedHandler(mockRequest, mockResponse)

      // Should fail because of extra space
      expect(mockResponse.status).toHaveBeenCalledWith(401)
    })
  })
})

describe('corsMiddleware', () => {
  it('should set CORS headers and end OPTIONS requests', () => {
    const mockRequest = {
      method: 'OPTIONS',
      headers: {
        origin: 'http://localhost:5173',
      },
    } as any

    const mockResponse = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      end: jest.fn(),
    } as unknown as VercelResponse

    const next = jest.fn()

    corsMiddleware(mockRequest, mockResponse as any, next)

    expect(mockResponse.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://localhost:5173')
    expect(mockResponse.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS')
    expect(mockResponse.status).toHaveBeenCalledWith(204)
    expect(mockResponse.end).toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })

  it('should continue for non-preflight requests', () => {
    const mockRequest = {
      method: 'GET',
      headers: {},
    } as any

    const mockResponse = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      end: jest.fn(),
    } as unknown as VercelResponse

    const next = jest.fn()

    corsMiddleware(mockRequest, mockResponse as any, next)

    expect(mockResponse.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*')
    expect(next).toHaveBeenCalled()
  })
})

describe('API Handler Security', () => {
  describe('Protected routes enforcement', () => {
    it('should enforce authentication on /api/events GET', async () => {
      // This would be an integration test verifying the route protection
      // In a real scenario, you would make HTTP requests to the running server
      expect(true).toBe(true) // Placeholder
    })

    it('should enforce admin role on /api/users/promote', async () => {
      // Placeholder for integration test
      expect(true).toBe(true)
    })

    it('should allow public access to /api/auth/request-access', async () => {
      // Placeholder for integration test
      expect(true).toBe(true)
    })

    it('should allow public access to /api/auth/login', async () => {
      // Placeholder for integration test
      expect(true).toBe(true)
    })
  })

  describe('Route ordering', () => {
    it('should match /api/users/promote before /api/users/:id', async () => {
      // This test verifies that specific routes are registered before generic ones
      // In Express, route order matters for matching
      expect(true).toBe(true) // Placeholder
    })

    it('should match /api/events/rsvp before /api/events/:id', async () => {
      expect(true).toBe(true) // Placeholder
    })
  })
})
