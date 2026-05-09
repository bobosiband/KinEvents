import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/authStore'
import { AuthLoading } from './AuthLoading'

export function AdminRoute() {
  const isHydrated = useAuthStore(state => state.isHydrated)
  const user = useAuthStore(state => state.user)
  const token = useAuthStore(state => state.token)
  const isAuthenticated = Boolean(user && token)
  const isAdmin = user?.role === 'admin'

  if (!isHydrated) return <AuthLoading />

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/home" replace />

  return <Outlet />
}
