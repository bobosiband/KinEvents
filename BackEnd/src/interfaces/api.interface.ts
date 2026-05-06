export interface IApiSuccess<T = unknown> {
  success: true
  data: T
  message?: string
}

export interface IApiError {
  success: false
  message: string
  details?: unknown
}

export type ApiResponse<T = unknown> = IApiSuccess<T> | IApiError