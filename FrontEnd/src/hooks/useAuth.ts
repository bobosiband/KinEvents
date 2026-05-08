import { useAuthStore } from '@/features/auth/store/authStore'

export function useAuth() {
  const user = useAuthStore(state => state.user)
  const token = useAuthStore(state => state.token)
  const clearAuth = useAuthStore(state => state.clearAuth)
  return {
    user,
    token,
    clearAuth,
    isAuthenticated: Boolean(user && token),
    isAdmin: user?.role === 'admin',
  }
}
