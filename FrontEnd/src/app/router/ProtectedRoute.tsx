import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/authStore'
import { AuthLoading } from './AuthLoading'

export function ProtectedRoute() {
  const location = useLocation()
  const isHydrated = useAuthStore(state => state.isHydrated)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated())

  // Prevent redirect loops during zustand persist rehydration.
  if (!isHydrated) return <AuthLoading />

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

