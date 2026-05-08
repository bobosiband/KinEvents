import { deleteData, getData, patchData, postData } from '@/services/api/apiClient'
import { ENDPOINTS } from '@/services/api/endpoints'
import type { CreateEventPayload, Event, EventPayload, RSVPStatus } from '../types/event.types'

export function getEvents(params?: { type?: string; search?: string }): Promise<Event[]> {
  return getData<Event[]>(ENDPOINTS.EVENTS, params)
}

export function getEvent(id: string): Promise<Event> {
  return getData<Event>(ENDPOINTS.EVENT_BY_ID(id))
}

export function createEvent(payload: CreateEventPayload): Promise<Event> {
  return postData<Event, CreateEventPayload>(ENDPOINTS.EVENTS, payload)
}

export function updateEvent(id: string, payload: EventPayload): Promise<Event> {
  return patchData<Event, EventPayload>(ENDPOINTS.EVENT_BY_ID(id), payload)
}

export function deleteEvent(id: string): Promise<{ message: string }> {
  return deleteData<{ message: string }>(ENDPOINTS.EVENT_BY_ID(id))
}

export function rsvp(eventId: string, userId: string, status: RSVPStatus): Promise<Event> {
  return postData<Event, { eventId: string; userId: string; status: RSVPStatus }>(ENDPOINTS.EVENT_RSVP, { eventId, userId, status })
}
