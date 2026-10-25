import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useAuthStore } from '@/features/auth/store/authStore'

const AUTH_FAILURE_MESSAGES = new Set([
  'User no longer exists',
  'User account is not approved',
  'Missing authorization token',
  'Session expired',
  'Invalid or expired token',
  'Session expired. Please sign in again.',
])

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const message = error instanceof Error ? error.message : ''
        if (AUTH_FAILURE_MESSAGES.has(message)) return false
        if (!useAuthStore.getState().token) return false
        return failureCount < 1
      },
      staleTime: 30_000,
    },
  },
})

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
