import { randomUUID } from 'crypto'

import { EVENT_TYPES } from '../constants/events'
import type { IEvent, RSVPStatus } from '../interfaces/event.interface'
import { eventRepository } from '../repositories/event.repository'

export interface CreateEventInput {
  title: string
  description: string
  date: string
  createdBy: string
  location?: string
  onlineLink?: string
  imageUrl?: string
  type?: IEvent['type']
}

export class EventService {
  /**
   * Returns every stored event.
    * @returns All events.
   */
  listEvents(): IEvent[] {
    return eventRepository.findAll()
  }

  /**
   * Looks up a single event by id.
    * @param id Event identifier.
    * @returns The matching event, or undefined when no match exists.
   */
  getEvent(id: string): IEvent | undefined {
    return eventRepository.findById(id)
  }

  /**
   * Creates a new event record.
    * @param input Event payload.
    * @returns The created event.
   */
  createEvent(input: CreateEventInput): IEvent {
    const now = new Date().toISOString()
    const event: IEvent = {
      id: randomUUID(),
      title: input.title,
      description: input.description,
      date: input.date,
      location: input.location,
      onlineLink: input.onlineLink,
      imageUrl: input.imageUrl,
      type: input.type ?? EVENT_TYPES.CUSTOM,
      locked: false,
      createdBy: input.createdBy,
      rsvps: {},
      createdAt: now,
      updatedAt: now,
    }

    return eventRepository.insert(event)
  }

  /**
   * Applies a partial update to an event.
    * @param id Event identifier.
    * @param patch Fields to update.
    * @returns The updated event, or null when no event exists.
   */
  updateEvent(id: string, patch: Partial<Omit<IEvent, 'id' | 'createdAt' | 'createdBy'>>): IEvent | null {
    return eventRepository.update(id, {
      ...patch,
      updatedAt: new Date().toISOString(),
    })
  }

  /**
   * Deletes an event by id.
    * @param id Event identifier.
    * @returns True when an event was removed, otherwise false.
   */
  deleteEvent(id: string): boolean {
    return eventRepository.remove(id)
  }

  /**
   * Stores an RSVP response for a user on a specific event.
    * @param eventId Event identifier.
    * @param userId User identifier.
    * @param status RSVP response value.
    * @returns The updated event.
   */
  setRsvp(eventId: string, userId: string, status: RSVPStatus): IEvent {
    const event = eventRepository.findById(eventId)

    if (!event) {
      throw new Error('Event not found')
    }

    const updatedEvent = eventRepository.update(eventId, {
      rsvps: {
        ...event.rsvps,
        [userId]: status,
      },
      updatedAt: new Date().toISOString(),
    })

    if (!updatedEvent) {
      throw new Error('Event RSVP could not be updated')
    }

    return updatedEvent
  }
}

export const eventService = new EventService()