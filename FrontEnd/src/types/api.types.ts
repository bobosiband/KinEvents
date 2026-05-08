export interface ApiSuccess<T = unknown> {
  success: true
  data: T
  message?: string
}

export interface ApiError {
  success: false
  message: string
  details?: unknown
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError
