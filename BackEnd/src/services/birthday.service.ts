import { randomUUID } from 'crypto'

import { getData, persistData } from '../config/db'
import { EVENT_TYPES } from '../constants/events'
import type { IEvent } from '../interfaces/event.interface'
import type { IUser } from '../interfaces/user.interface'
import { notificationService } from './notification.service'
import type { INotification } from '../interfaces/notification.interface'

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

  async generateBirthdayReminders(daysAhead: number = 7, referenceDate = new Date()): Promise<INotification[]> {
    const created: INotification[] = []
    const currentYear = referenceDate.getFullYear()

    // Get all users with birthdays
    const usersWithBirthdays = getData().users.filter((user) => Boolean(user.birthday))

    for (const user of usersWithBirthdays) {
      const parts = extractMonthDay(user.birthday ?? '')
      if (!parts) continue

      const birthdayThisYear = `${currentYear}-${parts.month}-${parts.day}`
      const birthdayDate = new Date(`${birthdayThisYear}T00:00:00Z`)
      const daysUntilBirthday = Math.floor((birthdayDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24))

      // Check if birthday falls within the next daysAhead days (inclusive of today)
      if (daysUntilBirthday >= 0 && daysUntilBirthday <= daysAhead) {
        const notificationType = daysUntilBirthday === 0 ? 'birthday_today' : 'birthday_reminder'

        const notification = await notificationService.createNotification({
          type: notificationType,
          recipientId: user.id,
          payload: {
            name: user.name,
            birthdayDate: birthdayThisYear,
            daysUntil: daysUntilBirthday.toString(),
          },
        })
        created.push(notification)
      }
    }

    return created
  }
}

export const birthdayService = new BirthdayService()