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
  async listEvents(): Promise<IEvent[]> {
    return eventRepository.findAll()
  }

  /**
   * Looks up a single event by id.
    * @param id Event identifier.
    * @returns The matching event, or undefined when no match exists.
   */
  async getEvent(id: string): Promise<IEvent | undefined> {
    return eventRepository.findById(id)
  }

  /**
   * Creates a new event record.
    * @param input Event payload.
    * @returns The created event.
   */
  async createEvent(input: CreateEventInput): Promise<IEvent> {
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
  async updateEvent(id: string, patch: Partial<Omit<IEvent, 'id' | 'createdAt' | 'createdBy'>>): Promise<IEvent | null> {
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
  async deleteEvent(id: string): Promise<boolean> {
    return eventRepository.remove(id)
  }

  /**
   * Stores an RSVP response for a user on a specific event.
    * @param eventId Event identifier.
    * @param userId User identifier.
    * @param status RSVP response value.
    * @returns The updated event.
   */
  async setRsvp(eventId: string, userId: string, status: RSVPStatus): Promise<IEvent> {
    const event = eventRepository.findById(eventId)

    if (!event) {
      throw new Error('Event not found')
    }

    const updatedEvent = await eventRepository.update(eventId, {
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