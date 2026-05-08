import type { User } from '@/features/auth/types/auth.types'

export const can = {
  createEvent: (user: User | null) =>
    user?.capabilities.includes('create_event') || user?.role === 'admin' || user?.role === 'manager',
  editAnyEvent: (user: User | null) =>
    user?.capabilities.includes('edit_any_event') || user?.role === 'admin',
  editOwnEvent: (user: User | null, createdBy?: string) =>
    (user?.id === createdBy && (user?.capabilities.includes('edit_own_event') || user?.role === 'manager')) || 
    user?.capabilities.includes('edit_any_event') || 
    user?.role === 'admin',
  deleteAnyEvent: (user: User | null) =>
    user?.capabilities.includes('delete_any_event') || user?.role === 'admin',
  deleteOwnEvent: (user: User | null, createdBy?: string) =>
    (user?.id === createdBy && (user?.capabilities.includes('delete_own_event') || user?.role === 'manager')) ||
    user?.capabilities.includes('delete_any_event') ||
    user?.role === 'admin',
  manageUsers: (user: User | null) =>
    user?.capabilities.includes('manage_users') || user?.role === 'admin',
  accessAdmin: (user: User | null) => user?.role === 'admin',
  editLockedEvent: (user: User | null) =>
    user?.capabilities.includes('edit_locked_event') || user?.role === 'admin',
}
