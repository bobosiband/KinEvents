import { useAuthStore } from '@/features/auth/store/authStore'
import { can } from '@/utils/permissions'

export function usePermissions() {
  const user = useAuthStore(state => state.user)
  return {
    canCreateEvent: can.createEvent(user),
    canEditAnyEvent: can.editAnyEvent(user),
    canEditOwnEvent: (createdBy?: string) => can.editOwnEvent(user, createdBy),
    canDeleteAnyEvent: can.deleteAnyEvent(user),
    canDeleteOwnEvent: (createdBy?: string) => can.deleteOwnEvent(user, createdBy),
    canManageUsers: can.manageUsers(user),
    canAccessAdmin: can.accessAdmin(user),
    canEditLockedEvent: can.editLockedEvent(user),
  }
}
