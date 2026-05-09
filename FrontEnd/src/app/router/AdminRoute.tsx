import { useEffect, useRef } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/features/auth/store/authStore'

export function AdminRoute() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated())
  const isAdmin = useAuthStore(state => state.isAdmin())
  const warned = useRef(false)

  useEffect(() => {
    if (!isAuthenticated || isAdmin || warned.current) return
    warned.current = true
    toast.error('Access denied')
  }, [isAuthenticated, isAdmin])

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />

  return <Outlet />
}
