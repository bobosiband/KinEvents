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

function extractMonthDay(birthday: string): { month: string; day: string } | null {
  const parts = birthday.split('-')

  if (parts.length === 3) {
    const [, month, day] = parts
    return { month, day }
  }

  if (parts.length === 2) {
    const [month, day] = parts
    return { month, day }
  }

  return null
}

export class BirthdayService {
  /**
   * Returns a sorted list of users with birthdays coming up soon.
    * @param referenceDate Date used as the comparison point.
    * @param limit Maximum number of records to return.
    * @returns Upcoming birthday previews.
   */
  async getUpcomingBirthdays(referenceDate = new Date(), limit = 10): Promise<BirthdayPreview[]> {
    const currentYear = referenceDate.getFullYear()

    return userRepository
      .findAll()
      .filter((user) => Boolean(user.birthday))
      .map((user) => {
        const birthdayParts = extractMonthDay(user.birthday ?? '')

        if (!birthdayParts) {
          return null
        }

        return {
          user,
          birthdayThisYear: `${currentYear}-${birthdayParts.month}-${birthdayParts.day}`,
        }
      })
      .filter((item): item is BirthdayPreview => item !== null)
      .sort((left, right) => left.birthdayThisYear.localeCompare(right.birthdayThisYear))
      .slice(0, limit)
  }

  /**
   * Creates birthday event records for every user with a birthday.
    * @param year Calendar year to generate events for.
    * @returns The created birthday events.
   */
  async generateBirthdayEvents(year = new Date().getFullYear()): Promise<IEvent[]> {
    const now = new Date().toISOString()
    const createdEvents: IEvent[] = []

    for (const user of userRepository.findAll()) {
      if (!user.birthday) {
        continue
      }

      const birthdayParts = extractMonthDay(user.birthday)

      if (!birthdayParts) {
        continue
      }

      const eventDate = `${year}-${birthdayParts.month}-${birthdayParts.day}`
      const event = await eventRepository.insert({
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