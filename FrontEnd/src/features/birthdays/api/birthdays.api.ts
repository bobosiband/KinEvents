import { getData, postData } from '@/services/api/apiClient'
import { ENDPOINTS } from '@/services/api/endpoints'
import type { User } from '@/features/auth/types/auth.types'

type BirthdayUser = Pick<User, 'id' | 'name'>

export interface Birthday {
  user: BirthdayUser
  birthdayThisYear: string
}

export function getUpcomingBirthdays(limit?: number): Promise<Birthday[]> {
  return getData<Birthday[]>(ENDPOINTS.BIRTHDAYS_UPCOMING, limit ? { limit } : undefined)
}

export function generateBirthdayEvents(): Promise<{ message: string }> {
  return postData<{ message: string }, Record<string, never>>(ENDPOINTS.BIRTHDAYS_GENERATE, {})
}
