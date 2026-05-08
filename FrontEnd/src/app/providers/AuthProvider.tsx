import { useEffect, type ReactNode } from 'react'
import { useAuthStore } from '@/features/auth/store/authStore'
import type { User } from '@/features/auth/types/auth.types'
import { getData } from '@/services/api/apiClient'
import { ENDPOINTS } from '@/services/api/endpoints'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const userId = useAuthStore(state => state.user?.id)
  const token = useAuthStore(state => state.token)
  const setAuth = useAuthStore(state => state.setAuth)
  const clearAuth = useAuthStore(state => state.clearAuth)

  useEffect(() => {
    if (!userId || !token) return

    getData<User>(ENDPOINTS.USER_BY_ID(userId))
      .then(user => setAuth(user, token))
      .catch(() => clearAuth())
  }, [clearAuth, setAuth, token, userId])

  return <>{children}</>
}
