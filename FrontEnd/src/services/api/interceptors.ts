import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import toast from 'react-hot-toast'
import { ENDPOINTS } from '@/services/api/endpoints'
import { useAuthStore } from '@/features/auth/store/authStore'
import type { ApiError, ApiResponse } from '@/types/api.types'

function extractMessage(error: AxiosError<ApiError>): string {
  if (!error.response) return 'Something went wrong. Check your connection.'
  return error.response.data?.message || error.message || 'Something went wrong.'
}

export function unwrapResponse<T>(response: AxiosResponse<ApiResponse<T> | T>): T {
  const body = response.data
  if (typeof body === 'object' && body !== null && 'success' in body) {
    if (body.success) return body.data as T
    throw new Error(body.message)
  }
  return body as T
}

async function silentlyReauthenticate(client: AxiosInstance): Promise<boolean> {
  const { user, setAuth } = useAuthStore.getState()

  if (!user?.email) {
    return false
  }

  const loginUrl = new URL(ENDPOINTS.AUTH_LOGIN, client.defaults.baseURL || window.location.origin).toString()
  const response = await fetch(loginUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: user.email }),
  })

  if (!response.ok) {
    return false
  }

  const body = (await response.json()) as ApiResponse<{ user: typeof user; token: string }>

  if (!body?.success || !body.data?.user || !body.data?.token) {
    return false
  }

  setAuth(body.data.user, body.data.token)
  return true
}

export function attachInterceptors(client: AxiosInstance): void {
  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  client.interceptors.response.use(
    response => response,
    (error: AxiosError<ApiError>) => {
      const status = error.response?.status
      const message = error.response?.data?.message || error.message || 'Something went wrong.'

      if (status === 401) {
        // Permanent failures — do NOT retry. Clear auth and redirect immediately.
        if (
          message === 'User no longer exists' ||
          message === 'User account is not approved' ||
          message === 'Missing authorization token'
        ) {
          useAuthStore.getState().clearAuth()
          toast.error(
            message === 'User no longer exists'
              ? 'Your account no longer exists'
              : message === 'User account is not approved'
              ? 'Your account access has been revoked'
              : 'Missing authorization token'
          )
          window.location.assign('/login')
          return Promise.reject(new Error(message))
        }

        // Token expiry / transient 401 — attempt one silent re-auth then retry.
        const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
        if (originalRequest && !originalRequest._retry) {
          originalRequest._retry = true

          return silentlyReauthenticate(client)
            .then((reauthed) => {
              if (reauthed) {
                const token = useAuthStore.getState().token
                if (token) {
                  originalRequest.headers.Authorization = `Bearer ${token}`
                }
                return client.request(originalRequest)
              }

              useAuthStore.getState().clearAuth()
              toast.error('Session expired. Please sign in again.')
              window.location.assign('/login')
              return Promise.reject(new Error(message))
            })
        }

        // Already retried or cannot retry — clear and redirect.
        useAuthStore.getState().clearAuth()
        toast.error('Session expired. Please sign in again.')
        window.location.assign('/login')
      } else if (status === 403) {
        toast.error("You don't have permission to do that")
      } else if (status !== 404) {
        toast.error(message)
      }
      return Promise.reject(new Error(message))
    },
  )
}
