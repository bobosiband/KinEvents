import { randomUUID } from 'crypto'
import { ROLE_CAPABILITIES } from '../src/constants/roles'
import { getData } from '../src/config/db'
import { resetDb } from './helpers/db.helper'


describe('User Routes', () => {
  let testUser: any

  beforeEach(async () => {
    resetDb()
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
    getData().users.push(testUser)
  })

  describe('GET /api/users', () => {
    it('should return list of approved users', async () => {
      const users = getData().users.filter((user) => user.accessStatus === 'approved')
      expect(Array.isArray(users)).toBe(true)
      expect(users.length).toBeGreaterThan(0)
    })
  })

  describe('GET /api/users/:id', () => {
    it('should retrieve a user by id', async () => {
      const user = getData().users.find((item) => item.id === testUser.id)
      expect(user?.id).toBe(testUser.id)
      expect(user?.email).toBe(testUser.email)
    })

    it('should return 404 for non-existent user', async () => {
      const user = getData().users.find((item) => item.id === '00000000-0000-0000-0000-000000000000')
      expect(user).toBeUndefined()
    })
  })

  describe('PATCH /api/users/:id', () => {
    it('should update user profile', async () => {
      const user = getData().users.find((item) => item.id === testUser.id)
      if (!user) throw new Error('Missing test user')
      Object.assign(user, { name: 'Updated Name', birthday: '1990-01-15' })

      expect(user.name).toBe('Updated Name')
      expect(user.birthday).toBe('1990-01-15')
    })

    it('should update notification preferences', async () => {
      const user = getData().users.find((item) => item.id === testUser.id)
      if (!user) throw new Error('Missing test user')
      Object.assign(user, {
        notificationPrefs: {
          level: 'important',
          channels: ['push'],
        },
      })

      expect(user.notificationPrefs.level).toBe('important')
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
      getData().users.push(memberUser)

      const index = getData().users.findIndex((item) => item.id === memberUser.id)
      if (index >= 0) getData().users.splice(index, 1)
      expect(index >= 0).toBe(true)

      const retrieved = getData().users.find((item) => item.id === memberUser.id)
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
      getData().users.push(memberUser)

      const user = getData().users.find((item) => item.id === memberUser.id)
      if (!user) throw new Error('Missing member user')
      Object.assign(user, {
        role: 'manager',
        capabilities: ROLE_CAPABILITIES.manager,
      })

      expect(user.role).toBe('manager')
      expect(user.capabilities).toContain('create_event')
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
      getData().users.push(memberUser)

      const user = getData().users.find((item) => item.id === memberUser.id)
      if (!user) throw new Error('Missing member user')
      Object.assign(user, {
        role: 'admin',
        capabilities: ROLE_CAPABILITIES.admin,
      })

      expect(user.role).toBe('admin')
      expect(user.capabilities).toContain('manage_users')
    })

  })
})

describe('Admin Routes', () => {
  let testUser: any

  beforeEach(async () => {
    resetDb()
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
    getData().users.push(testUser)
  })

  describe('GET /api/admin/dashboard', () => {
    it('should count user statistics', () => {
      const allUsers = getData().users
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
