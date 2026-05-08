import { randomUUID } from 'crypto'

import { eventService } from '../src/services/event.service'
import { resetDb } from './helpers/db.helper'

describe('Event Routes', () => {
  beforeEach(() => {
    resetDb()
  })

  describe('GET /api/events', () => {
    it('should return empty list of events initially', async () => {
      const events = await eventService.listEvents()
      expect(events).toEqual([])
    })
  })

  describe('POST /api/events', () => {
    it('should create a new event', async () => {
      const event = await eventService.createEvent({
        title: 'Family Reunion',
        description: 'Annual family gathering',
        date: new Date().toISOString(),
        createdBy: randomUUID(),
        location: 'Home',
        type: 'custom',
      })

      expect(event.title).toBe('Family Reunion')
      expect(event.locked).toBe(false)
    })
  })

  describe('GET /api/events/:id', () => {
    it('should retrieve an event by id', async () => {
      const event = await eventService.createEvent({
        title: 'Birthday Party',
        description: 'Celebrating a milestone',
        date: new Date().toISOString(),
        createdBy: randomUUID(),
      })

      const retrieved = await eventService.getEvent(event.id)
      expect(retrieved?.id).toBe(event.id)
    })

    it('should return undefined for non-existent event', async () => {
      const retrieved = await eventService.getEvent('00000000-0000-0000-0000-000000000000')
      expect(retrieved).toBeUndefined()
    })
  })

  describe('PATCH /api/events/:id', () => {
    it('should update an event', async () => {
      const event = await eventService.createEvent({
        title: 'Old Title',
        description: 'Old Description',
        date: new Date().toISOString(),
        createdBy: randomUUID(),
      })

      const updated = await eventService.updateEvent(event.id, { title: 'New Title' })
      expect(updated?.title).toBe('New Title')
    })
  })

  describe('DELETE /api/events/:id', () => {
    it('should delete an event', async () => {
      const event = await eventService.createEvent({
        title: 'Event to Delete',
        description: 'Will be deleted',
        date: new Date().toISOString(),
        createdBy: randomUUID(),
      })

      const deleted = await eventService.deleteEvent(event.id)
      expect(deleted).toBe(true)

      const retrieved = await eventService.getEvent(event.id)
      expect(retrieved).toBeUndefined()
    })
  })

  describe('POST /api/events/rsvp', () => {
    it('should record an RSVP', async () => {
      const event = await eventService.createEvent({
        title: 'Party',
        description: 'Fun party',
        date: new Date().toISOString(),
        createdBy: randomUUID(),
      })

      const userId = randomUUID()
      const updated = await eventService.setRsvp(event.id, userId, 'yes')
      expect(updated.rsvps[userId]).toBe('yes')
    })
  })
})
