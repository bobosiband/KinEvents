import { randomUUID } from 'crypto'

import { EVENT_TYPES } from '../constants/events'
import type { IEvent } from '../interfaces/event.interface'
import type { IUser } from '../interfaces/user.interface'
import { eventRepository } from '../repositories/event.repository'
import { userRepository } from '../repositories/user.repository'

export interface BirthdayPreview {
  user: IUser
  birthdayThisYear: string
}

export class BirthdayService {
  /**
   * Returns a sorted list of users with birthdays coming up soon.
    * @param referenceDate Date used as the comparison point.
    * @param limit Maximum number of records to return.
    * @returns Upcoming birthday previews.
   */
  getUpcomingBirthdays(referenceDate = new Date(), limit = 10): BirthdayPreview[] {
    const currentYear = referenceDate.getFullYear()

    return userRepository
      .findAll()
      .filter((user) => Boolean(user.birthday))
      .map((user) => {
        const [month, day] = (user.birthday ?? '').split('-')
        return {
          user,
          birthdayThisYear: `${currentYear}-${month}-${day}`,
        }
      })
      .sort((left, right) => left.birthdayThisYear.localeCompare(right.birthdayThisYear))
      .slice(0, limit)
  }

  /**
   * Creates birthday event records for every user with a birthday.
    * @param year Calendar year to generate events for.
    * @returns The created birthday events.
   */
  generateBirthdayEvents(year = new Date().getFullYear()): IEvent[] {
    const now = new Date().toISOString()
    const createdEvents: IEvent[] = []

    for (const user of userRepository.findAll()) {
      if (!user.birthday) {
        continue
      }

      const [month, day] = user.birthday.split('-')
      const eventDate = `${year}-${month}-${day}`
      const event = eventRepository.insert({
        id: randomUUID(),
        title: `${user.name}'s Birthday`,
        description: `Birthday celebration for ${user.name}`,
        date: eventDate,
        location: undefined,
        onlineLink: undefined,
        imageUrl: undefined,
        type: EVENT_TYPES.BIRTHDAY,
        locked: true,
        createdBy: user.id,
        rsvps: {},
        createdAt: now,
        updatedAt: now,
      })

      createdEvents.push(event)
    }

    return createdEvents
  }
}

export const birthdayService = new BirthdayService()