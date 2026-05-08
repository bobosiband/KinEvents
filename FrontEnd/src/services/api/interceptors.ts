import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import toast from 'react-hot-toast'
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
      if (status === 401) {
        useAuthStore.getState().clearAuth()
        toast.error('Session expired')
        window.location.assign('/login')
      } else if (status === 403) {
        toast.error("You don't have permission to do that")
      } else if (status !== 404) {
        toast.error(extractMessage(error))
      }
      return Promise.reject(new Error(extractMessage(error)))
    },
  )
}
