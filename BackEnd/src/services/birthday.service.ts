import { randomUUID } from 'crypto'

import { getData, persistData } from '../config/db'
import { EVENT_TYPES } from '../constants/events'
import type { IEvent } from '../interfaces/event.interface'
import type { IUser } from '../interfaces/user.interface'

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
  async getUpcomingBirthdays(referenceDate = new Date(), limit = 10): Promise<BirthdayPreview[]> {
    const currentYear = referenceDate.getFullYear()
    return getData()
      .users.filter((user) => Boolean(user.birthday))
      .map((user) => {
        const parts = extractMonthDay(user.birthday ?? '')
        if (!parts) return null
        return { user, birthdayThisYear: `${currentYear}-${parts.month}-${parts.day}` }
      })
      .filter((item): item is BirthdayPreview => item !== null)
      .sort((a, b) => a.birthdayThisYear.localeCompare(b.birthdayThisYear))
      .slice(0, limit)
  }

  async generateBirthdayEvents(year = new Date().getFullYear()): Promise<IEvent[]> {
    const now = new Date().toISOString()
    const created: IEvent[] = []

    for (const user of getData().users) {
      if (!user.birthday) continue
      const parts = extractMonthDay(user.birthday)
      if (!parts) continue

      const event: IEvent = {
        id: randomUUID(),
        title: `${user.name}'s Birthday`,
        description: `Birthday celebration for ${user.name}`,
        date: `${year}-${parts.month}-${parts.day}`,
        type: EVENT_TYPES.BIRTHDAY,
        locked: true,
        createdBy: user.id,
        rsvps: {},
        createdAt: now,
        updatedAt: now,
      }
      getData().events.push(event)
      created.push(event)
    }

    if (created.length > 0) {
      await persistData()
    }
    return created
  }
}

export const birthdayService = new BirthdayService()