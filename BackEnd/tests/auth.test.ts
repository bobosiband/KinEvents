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

  describe('Access Request Archival', () => {
    it('should move approved request to history and remove from pending', async () => {
      const accessRequest = await authService.requestAccess({
        name: 'Jane Doe',
        email: 'jane@example.com',
      })

      await authService.approveAccess(accessRequest.id)

      const pendingRequests = await authService.listAccessRequests()
      const history = await authService.listAccessRequestHistory()

      expect(pendingRequests.find((r) => r.id === accessRequest.id)).toBeUndefined()
      expect(history.find((r) => r.id === accessRequest.id)).toBeDefined()
    })

    it('should move rejected request to history and remove from pending', async () => {
      const accessRequest = await authService.requestAccess({
        name: 'Bob Smith',
        email: 'bob@example.com',
      })

      await authService.revokeAccess(accessRequest.id)

      const pendingRequests = await authService.listAccessRequests()
      const history = await authService.listAccessRequestHistory()

      expect(pendingRequests.find((r) => r.id === accessRequest.id)).toBeUndefined()
      expect(history.find((r) => r.id === accessRequest.id)).toBeDefined()
    })

    it('should preserve request data when archiving', async () => {
      const accessRequest = await authService.requestAccess({
        name: 'Charlie Jones',
        email: 'charlie@example.com',
      })

      const originalId = accessRequest.id

      await authService.approveAccess(accessRequest.id)

      const history = await authService.listAccessRequestHistory()
      const archivedRequest = history.find((r) => r.id === originalId)

      expect(archivedRequest).toBeDefined()
      expect(archivedRequest?.name).toBe('Charlie Jones')
      expect(archivedRequest?.email).toBe('charlie@example.com')
    })

    it('should keep rejected requests in history', async () => {
      const request1 = await authService.requestAccess({
        name: 'User One',
        email: 'one@example.com',
      })

      const request2 = await authService.requestAccess({
        name: 'User Two',
        email: 'two@example.com',
      })

      await authService.approveAccess(request1.id)
      await authService.revokeAccess(request2.id)

      const history = await authService.listAccessRequestHistory()

      expect(history).toHaveLength(2)
      expect(history.find((r) => r.id === request1.id)?.status).toBe('approved')
      expect(history.find((r) => r.id === request2.id)?.status).toBe('rejected')
    })

    it('listAccessRequests should only return pending requests', async () => {
      const req1 = await authService.requestAccess({
        name: 'User One',
        email: 'one@example.com',
      })

      const req2 = await authService.requestAccess({
        name: 'User Two',
        email: 'two@example.com',
      })

      await authService.approveAccess(req1.id)

      const pending = await authService.listAccessRequests()

      expect(pending.every((r) => r.status === 'pending')).toBe(true)
      expect(pending).toHaveLength(1)
      expect(pending[0].id).toBe(req2.id)
    })
  })
})
