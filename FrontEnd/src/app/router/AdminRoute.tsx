import { Navigate, Outlet } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/features/auth/store/authStore'

export function AdminRoute() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated())
  const isAdmin = useAuthStore(state => state.isAdmin())

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin) {
    toast.error('Access denied')
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
