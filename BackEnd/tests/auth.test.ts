import { userRepository } from '../src/repositories/user.repository'
import { accessRequestRepository } from '../src/repositories/accessRequest.repository'
import { authService } from '../src/services/auth.service'

describe('Authentication Routes', () => {
  afterEach(async () => {
    // Clear repositories after each test
    for (const user of userRepository.findAll()) {
      await userRepository.remove(user.id)
    }
    for (const req of accessRequestRepository.findAll()) {
      await accessRequestRepository.remove(req.id)
    }
  })

  describe('POST /api/auth/request-access', () => {
    it('should create a new access request', async () => {
      const accessRequest = await authService.requestAccess({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'I want to join',
      })

      expect(accessRequest.status).toBe('pending')
      expect(accessRequest.email).toBe('john@example.com')
    })

    it('should not create duplicate pending requests', async () => {
      await authService.requestAccess({
        name: 'John Doe',
        email: 'john@example.com',
      })


      const allRequests = accessRequestRepository.findAll()
      expect(allRequests.filter((r) => r.email === 'john@example.com')).toHaveLength(1)
    })
  })

  describe('POST /api/auth/approve-access', () => {
    it('should approve access request and create user', async () => {
      const accessRequest = await authService.requestAccess({
        name: 'Jane Doe',
        email: 'jane@example.com',
      })

      const { request: approved, user } = await authService.approveAccess(accessRequest.id)

      expect(approved.status).toBe('approved')
      expect(user.accessStatus).toBe('approved')
      expect(user.role).toBe('member')
    })

    it('should return 404 for non-existent access request', async () => {
      await expect(authService.approveAccess('00000000-0000-0000-0000-000000000000')).rejects.toThrow()
    })
  })

  describe('POST /api/auth/revoke-access', () => {
    it('should revoke access request', async () => {
      const accessRequest = await authService.requestAccess({
        name: 'Bob Smith',
        email: 'bob@example.com',
      })

      const revoked = await authService.revokeAccess(accessRequest.id)

      expect(revoked.status).toBe('rejected')
    })
  })
})
