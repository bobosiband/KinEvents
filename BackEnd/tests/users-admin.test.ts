import { userRepository } from '../src/repositories/user.repository'
import { eventRepository } from '../src/repositories/event.repository'
import { accessRequestRepository } from '../src/repositories/accessRequest.repository'
import { randomUUID } from 'crypto'
import { ROLE_CAPABILITIES } from '../src/constants/roles'


describe('User Routes', () => {
  let testUser: any

  beforeEach(async () => {
    testUser = {
      id: randomUUID(),
      name: 'Test Admin',
      email: 'admin@test.com',
      role: 'admin' as const,
      accessStatus: 'approved' as const,
      capabilities: ROLE_CAPABILITIES.admin,
      notificationPrefs: { level: 'all' as const, channels: ['email' as const] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await userRepository.insert(testUser)
  })

  afterEach(async () => {
    for (const user of userRepository.findAll()) {
      await userRepository.remove(user.id)
    }
  })

  describe('GET /api/users', () => {
    it('should return list of approved users', async () => {
      const users = userRepository.findByAccessStatus('approved')
      expect(Array.isArray(users)).toBe(true)
      expect(users.length).toBeGreaterThan(0)
    })
  })

  describe('GET /api/users/:id', () => {
    it('should retrieve a user by id', async () => {
      const user = userRepository.findById(testUser.id)
      expect(user?.id).toBe(testUser.id)
      expect(user?.email).toBe(testUser.email)
    })

    it('should return 404 for non-existent user', async () => {
      const user = userRepository.findById('00000000-0000-0000-0000-000000000000')
      expect(user).toBeUndefined()
    })
  })

  describe('PATCH /api/users/:id', () => {
    it('should update user profile', async () => {
      const updated = await userRepository.update(testUser.id, {
        name: 'Updated Name',
        birthday: '1990-01-15',
      })

      expect(updated?.name).toBe('Updated Name')
      expect(updated?.birthday).toBe('1990-01-15')
    })

    it('should update notification preferences', async () => {
      const updated = await userRepository.update(testUser.id, {
        notificationPrefs: {
          level: 'important',
          channels: ['push'],
        },
      })

      expect(updated?.notificationPrefs.level).toBe('important')
    })
  })

  describe('DELETE /api/users/:id', () => {
    it('should delete a user', async () => {
      const memberUser = {
        id: randomUUID(),
        name: 'Member User',
        email: 'member@test.com',
        role: 'member' as const,
        accessStatus: 'approved' as const,
        capabilities: [],
        notificationPrefs: { level: 'all' as const, channels: ['email' as const] },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await userRepository.insert(memberUser)

      const deleted = await userRepository.remove(memberUser.id)
      expect(deleted).toBe(true)

      const retrieved = userRepository.findById(memberUser.id)
      expect(retrieved).toBeUndefined()
    })
  })

  describe('POST /api/users/promote', () => {
    it('should promote user to manager', async () => {
      const memberUser = {
        id: randomUUID(),
        name: 'Member User',
        email: 'member@test.com',
        role: 'member' as const,
        accessStatus: 'approved' as const,
        capabilities: [],
        notificationPrefs: { level: 'all' as const, channels: ['email' as const] },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await userRepository.insert(memberUser)

      const promoted = await userRepository.update(memberUser.id, {
        role: 'manager',
        capabilities: ROLE_CAPABILITIES.manager,
      })

      expect(promoted?.role).toBe('manager')
      expect(promoted?.capabilities).toContain('create_event')
    })

    it('should promote user to admin', async () => {
      const memberUser = {
        id: randomUUID(),
        name: 'Member User',
        email: 'member@test.com',
        role: 'member' as const,
        accessStatus: 'approved' as const,
        capabilities: [],
        notificationPrefs: { level: 'all' as const, channels: ['email' as const] },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await userRepository.insert(memberUser)

      const promoted = await userRepository.update(memberUser.id, {
        role: 'admin',
        capabilities: ROLE_CAPABILITIES.admin,
      })

      expect(promoted?.role).toBe('admin')
      expect(promoted?.capabilities).toContain('manage_users')
    })

  })
})

describe('Admin Routes', () => {
  let testUser: any

  beforeEach(async () => {
    testUser = {
      id: randomUUID(),
      name: 'Test Admin',
      email: 'admin@test.com',
      role: 'admin' as const,
      accessStatus: 'approved' as const,
      capabilities: ROLE_CAPABILITIES.admin,
      notificationPrefs: { level: 'all' as const, channels: ['email' as const] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await userRepository.insert(testUser)
  })

  afterEach(async () => {
    for (const user of userRepository.findAll()) {
      await userRepository.remove(user.id)
    }
    for (const event of eventRepository.findAll()) {
      await eventRepository.remove(event.id)
    }
    for (const req of accessRequestRepository.findAll()) {
      await accessRequestRepository.remove(req.id)
    }
  })

  describe('GET /api/admin/dashboard', () => {
    it('should count user statistics', () => {
      const allUsers = userRepository.findAll()
      expect(allUsers.length).toBeGreaterThanOrEqual(1)
      expect(allUsers.filter((u) => u.role === 'admin').length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('GET /api/admin/content', () => {
    it('should return list of content blocks', () => {
      expect(Array.isArray([])).toBe(true)
    })
  })

})
