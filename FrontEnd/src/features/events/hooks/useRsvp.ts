import { useMutation, useQueryClient } from '@tanstack/react-query'
import { rsvp } from '../api/events.api'
import type { RSVPStatus } from '../types/event.types'

export function useRsvp(eventId: string, userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (status: RSVPStatus) => rsvp(eventId, userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}
