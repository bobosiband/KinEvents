import type { UserRole } from '../interfaces/user.interface'

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  MEMBER: 'member',
} as const

export const ROLE_CAPABILITIES: Record<UserRole, string[]> = {
  admin: [
    'create_event',
    'edit_any_event',
    'delete_any_event',
    'edit_locked_event',
    'manage_users',
    'edit_content',
  ],
  manager: ['create_event', 'edit_own_event', 'delete_own_event'],
  member: [],
}