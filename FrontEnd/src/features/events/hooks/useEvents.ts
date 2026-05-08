import { useQuery } from '@tanstack/react-query'
import { getEvent, getEvents } from '../api/events.api'

export function useEvents(params?: { type?: string; search?: string }) {
  return useQuery({ queryKey: ['events', params], queryFn: () => getEvents(params) })
}

export function useEvent(id: string) {
  return useQuery({ queryKey: ['event', id], queryFn: () => getEvent(id), enabled: Boolean(id) })
}
