import { getData, postData } from '@/services/api/apiClient'
import { ENDPOINTS } from '@/services/api/endpoints'
import type { User } from '@/features/auth/types/auth.types'

export const BIRTHDAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function isValidBirthday(value?: string | null): value is string {
  return Boolean(value && BIRTHDAY_PATTERN.test(value))
}

export interface BirthdayPreview {
  user: User
  birthdayThisYear: string
}

export function getUpcomingBirthdays(limit?: number): Promise<BirthdayPreview[]> {
  return getData<BirthdayPreview[]>(ENDPOINTS.BIRTHDAYS_UPCOMING, limit ? { limit } : undefined)
}

export function generateBirthdayEvents(): Promise<{ message: string }> {
  return postData<{ message: string }, Record<string, never>>(ENDPOINTS.BIRTHDAYS_GENERATE, {})
}

export function sendBirthdayReminders(daysAhead = 7): Promise<{ message: string }> {
  return postData<{ message: string }, { daysAhead: number }>(ENDPOINTS.BIRTHDAYS_REMINDERS, { daysAhead })
}
