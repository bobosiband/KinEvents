import axios from 'axios'
import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import toast from 'react-hot-toast'
import { env } from '@/config/env'
import { ENDPOINTS } from '@/services/api/endpoints'
import { queryClient } from '@/app/providers/QueryProvider'
import { useAuthStore } from '@/features/auth/store/authStore'
import type { ApiError, ApiResponse } from '@/types/api.types'

const PERMANENT_AUTH_FAILURES = new Set<string>([
  'User no longer exists',
  'User account is not approved',
  'Missing authorization token',
])

export function unwrapResponse<T>(response: AxiosResponse<ApiResponse<T> | T>): T {
  const body = response.data
  if (typeof body === 'object' && body !== null && 'success' in body) {
    if (body.success) return body.data as T
    throw new Error(body.message)
  }
  return body as T
}

const bareReauthClient = axios.create({
  baseURL: env.apiUrl || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
})

let reauthPromise: Promise<boolean> | null = null
let loggingOut = false

function forceLogout(message: string): void {
  if (loggingOut) return
  loggingOut = true
  useAuthStore.getState().clearAuth()
  queryClient.cancelQueries()
  queryClient.clear()
  toast.error(message)
  if (window.location.pathname !== '/login') {
    window.location.assign('/login')
  }
}

async function silentlyReauthenticate(client: AxiosInstance): Promise<boolean> {
  const { user } = useAuthStore.getState()
  if (!user?.email) return false

  try {
    const resp = await client.post(ENDPOINTS.AUTH_LOGIN, { email: user.email })
    const body = unwrapResponse<{ user: typeof user; token: string }>(resp)
    if (!body?.token || !body?.user) return false
    if (loggingOut) return false
    useAuthStore.getState().setAuth(body.user, body.token)
    return true
  } catch {
    return false
  }
}

function reauthOnce(): Promise<boolean> {
  if (!reauthPromise) {
    reauthPromise = silentlyReauthenticate(bareReauthClient).finally(() => {
      reauthPromise = null
    })
  }
  return reauthPromise
}

function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) return false
  return url.endsWith(ENDPOINTS.AUTH_LOGIN) || url.endsWith(ENDPOINTS.AUTH_REQUEST_ACCESS)
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
        const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

        if (isAuthEndpoint(originalRequest?.url)) {
          return Promise.reject(new Error(message))
        }

        if (loggingOut) {
          return Promise.reject(new Error(message))
        }

        // Stray request from an already-cleared session (e.g. manual logout).
        if (!useAuthStore.getState().token) {
          return Promise.reject(new Error(message))
        }

        if (PERMANENT_AUTH_FAILURES.has(message)) {
          const toastMsg =
            message === 'User no longer exists'
              ? 'Your account no longer exists'
              : message === 'User account is not approved'
              ? 'Your account access has been revoked'
              : 'Missing authorization token'
          forceLogout(toastMsg)
          return Promise.reject(new Error(message))
        }

        if (originalRequest && !originalRequest._retry) {
          originalRequest._retry = true
          return reauthOnce().then((reauthed) => {
            if (reauthed) {
              const freshToken = useAuthStore.getState().token
              if (freshToken) {
                originalRequest.headers.Authorization = `Bearer ${freshToken}`
              }
              return client.request(originalRequest)
            }
            forceLogout('Session expired. Please sign in again.')
            return Promise.reject(new Error(message))
          })
        }

        forceLogout('Session expired. Please sign in again.')
      } else if (status === 403) {
        toast.error("You don't have permission to do that")
      } else if (status !== 404) {
        toast.error(message)
      }
      return Promise.reject(new Error(message))
    },
  )
}
