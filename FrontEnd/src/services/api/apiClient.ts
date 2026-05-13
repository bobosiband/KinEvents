import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'
import { env } from '@/config/env'
import { attachInterceptors, unwrapResponse } from './interceptors'

export const apiClient = axios.create({
  baseURL: env.apiUrl || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
})

attachInterceptors(apiClient)

export async function getData<T>(url: string, params?: Record<string, string | number | boolean>): Promise<T> {
  const response = await apiClient.get(url, { params })
  return unwrapResponse<T>(response)
}

export async function postData<TResponse, TPayload>(
  url: string,
  payload: TPayload,
  config?: AxiosRequestConfig,
): Promise<TResponse> {
  const response = await apiClient.post(url, payload, config)
  return unwrapResponse<TResponse>(response)
}

export async function patchData<TResponse, TPayload>(url: string, payload: TPayload): Promise<TResponse> {
  const response = await apiClient.patch(url, payload)
  return unwrapResponse<TResponse>(response)
}

export async function deleteData<TResponse>(url: string): Promise<TResponse> {
  const response = await apiClient.delete(url)
  return unwrapResponse<TResponse>(response)
}
