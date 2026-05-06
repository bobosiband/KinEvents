import type { IEvent } from '../interfaces/event.interface'
import { BaseRepository } from './base.repository'

export class EventRepository extends BaseRepository<'events', IEvent> {
  constructor() {
    super('events')
  }

  /**
   * Returns every event created by the given user.
    * @param userId User identifier.
    * @returns Every event created by the user.
   */
  findByOwner(userId: string): IEvent[] {
    return this.findWhere((event) => event.createdBy === userId)
  }

  /**
   * Returns every event that falls on the supplied date.
    * @param date ISO date string to match.
    * @returns Every event that matches the date.
   */
  findByDate(date: string): IEvent[] {
    return this.findWhere((event) => event.date === date)
  }
}

export const eventRepository = new EventRepository()