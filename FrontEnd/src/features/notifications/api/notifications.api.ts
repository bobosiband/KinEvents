import { getData } from '@/services/api/apiClient'
import { ENDPOINTS } from '@/services/api/endpoints'
import type { NotificationItem } from '@/types/common.types'

export function getNotifications(): Promise<NotificationItem[]> {
  return getData<NotificationItem[]>(ENDPOINTS.NOTIFICATIONS)
}
