import { randomUUID } from 'crypto'

import { getData, persistData } from '../config/db'
import { EVENT_TYPES } from '../constants/events'
import type { IEvent, RSVPStatus } from '../interfaces/event.interface'

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
  async listEvents(): Promise<IEvent[]> {
    return getData().events
  }

  async getEvent(id: string): Promise<IEvent | undefined> {
    return getData().events.find((event) => event.id === id)
  }

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
    getData().events.push(event)
    await persistData()
    return event
  }

  async updateEvent(id: string, patch: Partial<Omit<IEvent, 'id' | 'createdAt' | 'createdBy'>>): Promise<IEvent | null> {
    const event = getData().events.find((item) => item.id === id)
    if (!event) return null
    Object.assign(event, patch, { updatedAt: new Date().toISOString() })
    await persistData()
    return event
  }

  async deleteEvent(id: string): Promise<boolean> {
    const db = getData()
    const index = db.events.findIndex((event) => event.id === id)
    if (index < 0) return false
    db.events.splice(index, 1)
    await persistData()
    return true
  }

  async setRsvp(eventId: string, userId: string, status: RSVPStatus): Promise<IEvent> {
    const event = getData().events.find((item) => item.id === eventId)
    if (!event) throw new Error('Event not found')
    event.rsvps[userId] = status
    event.updatedAt = new Date().toISOString()
    await persistData()
    return event
  }
}

export const eventService = new EventService()