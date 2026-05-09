import { getData, patchData } from '@/services/api/apiClient'
import { ENDPOINTS } from '@/services/api/endpoints'
import type { NotificationItem } from '@/types/common.types'

export function getNotifications(): Promise<NotificationItem[]> {
  return getData<NotificationItem[]>(ENDPOINTS.NOTIFICATIONS)
}

export function markNotificationAsRead(notificationId: string): Promise<NotificationItem> {
  return patchData<NotificationItem, Record<string, never>>(ENDPOINTS.NOTIFICATIONS_MARK_READ(notificationId), {})
}
