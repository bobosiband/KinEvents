import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNotifications, markNotificationAsRead } from '../api/notifications.api'
import type { NotificationItem } from '@/types/common.types'

export function useNotifications() {
  return useQuery({ queryKey: ['notifications'], queryFn: getNotifications })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (notificationId: string) => markNotificationAsRead(notificationId),
    onMutate: async (notificationId: string) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] })
      const previous = queryClient.getQueryData<NotificationItem[]>(['notifications'])
      queryClient.setQueryData<NotificationItem[]>(['notifications'], (old) =>
        (old ?? []).map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
      )
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications'], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
