import { userRepository } from '../src/repositories/user.repository'
import { eventRepository } from '../src/repositories/event.repository'
import { eventService } from '../src/services/event.service'
import { randomUUID } from 'crypto'

describe('Event Routes', () => {
  afterEach(() => {
    userRepository.findAll().forEach((user) => {
      userRepository.remove(user.id)
    })
    eventRepository.findAll().forEach((event) => {
      eventRepository.remove(event.id)
    })
  })

  describe('GET /api/events', () => {
    it('should return empty list of events initially', () => {
      const events = eventService.listEvents()
      expect(events).toEqual([])
    })
  })

  describe('POST /api/events', () => {
    it('should create a new event', () => {
      const event = eventService.createEvent({
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
    it('should retrieve an event by id', () => {
      const event = eventService.createEvent({
        title: 'Birthday Party',
        description: 'Celebrating a milestone',
        date: new Date().toISOString(),
        createdBy: randomUUID(),
      })

      const retrieved = eventService.getEvent(event.id)
      expect(retrieved?.id).toBe(event.id)
    })

    it('should return undefined for non-existent event', () => {
      const retrieved = eventService.getEvent('00000000-0000-0000-0000-000000000000')
      expect(retrieved).toBeUndefined()
    })
  })

  describe('PATCH /api/events/:id', () => {
    it('should update an event', () => {
      const event = eventService.createEvent({
        title: 'Old Title',
        description: 'Old Description',
        date: new Date().toISOString(),
        createdBy: randomUUID(),
      })

      const updated = eventService.updateEvent(event.id, { title: 'New Title' })
      expect(updated?.title).toBe('New Title')
    })
  })

  describe('DELETE /api/events/:id', () => {
    it('should delete an event', () => {
      const event = eventService.createEvent({
        title: 'Event to Delete',
        description: 'Will be deleted',
        date: new Date().toISOString(),
        createdBy: randomUUID(),
      })

      const deleted = eventService.deleteEvent(event.id)
      expect(deleted).toBe(true)

      const retrieved = eventService.getEvent(event.id)
      expect(retrieved).toBeUndefined()
    })
  })

  describe('POST /api/events/rsvp', () => {
    it('should record an RSVP', () => {
      const event = eventService.createEvent({
        title: 'Party',
        description: 'Fun party',
        date: new Date().toISOString(),
        createdBy: randomUUID(),
      })

      const userId = randomUUID()
      const updated = eventService.setRsvp(event.id, userId, 'yes')
      expect(updated.rsvps[userId]).toBe('yes')
    })
  })
})
