import { ENDPOINTS } from '@/services/api/endpoints'
import { getData, postData } from '@/services/api/apiClient'
import type { AccessRequest, LoginPayload, LoginResponse, RequestAccessPayload } from '../types/auth.types'

export function login(payload: LoginPayload): Promise<LoginResponse> {
  return postData<LoginResponse, LoginPayload>(ENDPOINTS.AUTH_LOGIN, payload)
}

export function requestAccess(payload: RequestAccessPayload): Promise<AccessRequest> {
  return postData<AccessRequest, RequestAccessPayload>(ENDPOINTS.AUTH_REQUEST_ACCESS, payload)
}

export function listAccessRequests(): Promise<AccessRequest[]> {
  return getData<AccessRequest[]>(ENDPOINTS.AUTH_REQUEST_ACCESS)
}

export function approveAccess(accessRequestId: string): Promise<{ request: AccessRequest; user: any; token: string }> {
  return postData<{ request: AccessRequest; user: any; token: string }, { accessRequestId: string }>(
    ENDPOINTS.AUTH_APPROVE,
    { accessRequestId }
  )
}

export function revokeAccess(accessRequestId: string): Promise<{ request: AccessRequest }> {
  return postData<{ request: AccessRequest }, { accessRequestId: string }>(
    ENDPOINTS.AUTH_REVOKE,
    { accessRequestId }
  )
}
