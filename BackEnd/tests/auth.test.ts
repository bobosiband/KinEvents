import { authService } from '../src/services/auth.service'
import { resetDb } from './helpers/db.helper'

describe('Authentication Routes', () => {
  beforeEach(() => {
    resetDb()
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


      const allRequests = (await authService.listAccessRequests())
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
