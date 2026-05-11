import { randomUUID } from 'crypto'

import { readData, persistData } from '../config/db'
import { EVENT_TYPES } from '../constants/events'
import type { IEvent, RSVPStatus } from '../interfaces/event.interface'
import type { INotification } from '../interfaces/notification.interface'
import { notificationService } from './notification.service'
import { emailDispatcher } from './email-dispatcher.service'

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
    const db = await readData()
    return db.events
  }

  async getEvent(id: string): Promise<IEvent | undefined> {
    const db = await readData()
    return db.events.find((event) => event.id === id)
  }

  async createEvent(input: CreateEventInput): Promise<IEvent> {
    const db = await readData()
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
    db.events.push(event)
    await persistData()

    // Auto-trigger notification
    await notificationService.createNotification({
      type: 'event_created',
      recipientId: event.createdBy,
      payload: {
        eventId: event.id,
        title: event.title,
        date: event.date,
      },
    })

    // Send emails to all approved users (non-blocking)
    try {
      const allApprovedUsers = db.users.filter((user) => user.accessStatus === 'approved')
      await emailDispatcher.onEventCreated(event, allApprovedUsers)
    } catch (error) {
      console.error('[EventService] Email dispatch failed:', error)
      // Don't throw - email failures don't affect the primary operation
    }

    return event
  }

  async updateEvent(id: string, patch: Partial<Omit<IEvent, 'id' | 'createdAt' | 'createdBy'>>): Promise<IEvent | null> {
    const db = await readData()
    const event = db.events.find((item) => item.id === id)
    if (!event) return null
    Object.assign(event, patch, { updatedAt: new Date().toISOString() })
    await persistData()

    // Auto-trigger notification
    await notificationService.createNotification({
      type: 'event_updated',
      recipientId: event.createdBy,
      payload: {
        eventId: event.id,
        title: event.title,
        date: event.date,
      },
    })

    // Send emails to users who have RSVP'd 'yes' (non-blocking)
    try {
      const rsvpYesUserIds = Object.entries(event.rsvps)
        .filter(([, status]) => status === 'yes')
        .map(([userId]) => userId)
      const rsvpYesUsers = db.users.filter((user) => rsvpYesUserIds.includes(user.id))
      const changes = Object.keys(patch).filter((key) => key !== 'updatedAt')
      await emailDispatcher.onEventUpdated(event, rsvpYesUsers, changes)
    } catch (error) {
      console.error('[EventService] Email dispatch failed:', error)
      // Don't throw - email failures don't affect the primary operation
    }

    return event
  }

  async deleteEvent(id: string): Promise<boolean> {
    const db = await readData()
    const index = db.events.findIndex((event) => event.id === id)
    if (index < 0) return false
    const [removedEvent] = db.events.splice(index, 1)

    try {
      console.log('[DB] Persisting after event deletion:', id)
      await persistData()
    } catch (error) {
      db.events.splice(index, 0, removedEvent)
      console.error('[EventService] Failed to persist event deletion:', error)
      throw error
    }

    return true
  }

  async setRsvp(eventId: string, userId: string, status: RSVPStatus): Promise<IEvent> {
    const db = await readData()
    const event = db.events.find((item) => item.id === eventId)
    if (!event) throw new Error('Event not found')
    event.rsvps[userId] = status
    event.updatedAt = new Date().toISOString()
    await persistData()

    if (userId !== event.createdBy) {
      await notificationService.createNotification({
        type: 'event_reminder',
        recipientId: event.createdBy,
        payload: {
          eventId: event.id,
          title: event.title,
          userId,
          status,
        },
      })
    }

    // Send RSVP confirmation email (non-blocking)
    try {
      const user = db.users.find((u) => u.id === userId)
      if (user) {
        await emailDispatcher.onRsvpConfirmed(event, user, status)
      }
    } catch (error) {
      console.error('[EventService] Email dispatch failed:', error)
      // Don't throw - email failures don't affect the primary operation
    }

    return event
  }

  async generateEventReminders(daysAhead = 3): Promise<INotification[]> {
    const db = await readData()
    const now = new Date()
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const created: INotification[] = []

    for (const event of db.events) {
      const eventDate = new Date(`${event.date.split('T')[0]}T00:00:00Z`)
      const daysUntil = Math.floor((eventDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24))

      if (daysUntil < 0 || daysUntil > daysAhead) {
        continue
      }

      const yesRsvpUserIds = Object.entries(event.rsvps)
        .filter(([, rsvpStatus]) => rsvpStatus === 'yes')
        .map(([rsvpUserId]) => rsvpUserId)

      for (const rsvpUserId of yesRsvpUserIds) {
        const notification = await notificationService.createNotification({
          type: 'event_reminder',
          recipientId: rsvpUserId,
          payload: {
            eventId: event.id,
            title: event.title,
            date: event.date,
            daysUntil: String(daysUntil),
          },
        })
        created.push(notification)
      }

      if (!yesRsvpUserIds.includes(event.createdBy)) {
        const notification = await notificationService.createNotification({
          type: 'event_reminder',
          recipientId: event.createdBy,
          payload: {
            eventId: event.id,
            title: event.title,
            date: event.date,
            daysUntil: String(daysUntil),
          },
        })
        created.push(notification)
      }
    }

    return created
  }
}

export const eventService = new EventService()