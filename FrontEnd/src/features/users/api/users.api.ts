import { deleteData, getData, patchData, postData } from '@/services/api/apiClient'
import { ENDPOINTS } from '@/services/api/endpoints'
import type { NotificationPrefs, User, UserRole } from '../types/user.types'

export interface ProfilePayload {
  name?: string
  email?: string
  birthday?: string
  notificationPrefs: NotificationPrefs
}

export interface UpdateUserResponse {
  user: User
  token?: string
}

export function getUsers(params?: { role?: string; status?: string }): Promise<User[]> {
  return getData<User[]>(ENDPOINTS.USERS, params)
}

export function getUser(id: string): Promise<User> {
  return getData<User>(ENDPOINTS.USER_BY_ID(id))
}

export function updateUser(id: string, payload: ProfilePayload): Promise<UpdateUserResponse> {
  return patchData<UpdateUserResponse, ProfilePayload>(ENDPOINTS.USER_BY_ID(id), payload)
}

export function promoteUser(userId: string, role: UserRole): Promise<User> {
  return postData<User, { userId: string; role: UserRole }>(ENDPOINTS.USER_PROMOTE, { userId, role })
}

export function deleteUser(id: string): Promise<{ message: string }> {
  return deleteData<{ message: string }>(ENDPOINTS.USER_BY_ID(id))
}
