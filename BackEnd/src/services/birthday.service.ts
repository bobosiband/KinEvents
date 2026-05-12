import { randomUUID } from 'crypto'

import { readData, persistData } from '../config/db'
import { EVENT_TYPES } from '../constants/events'
import type { IEvent } from '../interfaces/event.interface'
import type { IUser } from '../interfaces/user.interface'
import { notificationService } from './notification.service'
import { emailDispatcher } from './email-dispatcher.service'
import type { INotification } from '../interfaces/notification.interface'

export interface BirthdayPreview {
  user: IUser
  birthdayThisYear: string
}

export interface BirthdayGenerationResult {
  events: IEvent[]
  skipped: number
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
    const db = await readData()
    const currentYear = referenceDate.getUTCFullYear()

    // Build birthday dates in UTC and ensure returned `birthdayThisYear` is
    // always the next upcoming occurrence (this year or next year).
    return db.users
      .filter((user) => Boolean(user.birthday))
      .map((user) => {
        const parts = extractMonthDay(user.birthday ?? '')
        if (!parts) return null

        const month = parseInt(parts.month, 10)
        const day = parseInt(parts.day, 10)

        // Build the birthday date in UTC for this year
        let birthdayDate = new Date(Date.UTC(currentYear, month - 1, day))

        // Build today at UTC midnight for a clean date-only comparison
        const todayUTC = new Date(
          Date.UTC(
            referenceDate.getUTCFullYear(),
            referenceDate.getUTCMonth(),
            referenceDate.getUTCDate()
          )
        )

        // If this year's birthday has already passed, advance to next year
        if (birthdayDate < todayUTC) {
          birthdayDate = new Date(Date.UTC(currentYear + 1, month - 1, day))
        }

        const birthdayThisYear = birthdayDate.toISOString().split('T')[0]
        return { user, birthdayThisYear }
      })
      .filter((item): item is BirthdayPreview => item !== null)
      .sort((a, b) => a.birthdayThisYear.localeCompare(b.birthdayThisYear))
      .slice(0, limit)
  }

  async generateBirthdayEvents(year = new Date().getFullYear()): Promise<BirthdayGenerationResult> {
    const db = await readData()
    const now = new Date().toISOString()
    const created: IEvent[] = []
    let skipped = 0
    const targetYear = String(year)

    for (const user of db.users) {
      if (!user.birthday) continue
      const parts = extractMonthDay(user.birthday)
      if (!parts) continue

      const title = `${user.name}'s Birthday`
      const duplicateExists = db.events.some(
        (event) => event.type === EVENT_TYPES.BIRTHDAY && event.title === title && event.date.startsWith(targetYear)
      )

      if (duplicateExists) {
        skipped += 1
        continue
      }

      const event: IEvent = {
        id: randomUUID(),
        title,
        description: `Birthday celebration for ${user.name}`,
        date: `${targetYear}-${parts.month}-${parts.day}`,
        type: EVENT_TYPES.BIRTHDAY,
        locked: true,
        createdBy: user.id,
        rsvps: {},
        createdAt: now,
        updatedAt: now,
      }
      db.events.push(event)
      created.push(event)
    }

    if (created.length > 0) {
      await persistData()
    }
    return { events: created, skipped }
  }

  async generateBirthdayReminders(daysAhead: number = 7, referenceDate = new Date()): Promise<INotification[]> {
    const db = await readData()
    const created: INotification[] = []
    const currentYear = referenceDate.getFullYear()

    // Get all users with birthdays
    const usersWithBirthdays = db.users.filter((user) => Boolean(user.birthday))
    const allUsers = db.users

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

        // Send emails (non-blocking)
        try {
          if (daysUntilBirthday === 0) {
            // Birthday today - send to the birthday user
            await emailDispatcher.onBirthdayToday(user)
          } else {
            // Birthday reminder - send to all other approved users
            const otherApprovedUsers = allUsers.filter(
              (u) => u.id !== user.id && u.accessStatus === 'approved'
            )
            for (const notifyUser of otherApprovedUsers) {
              await emailDispatcher.onBirthdayReminder(user, notifyUser, daysUntilBirthday)
            }
          }
        } catch (error) {
          console.error('[BirthdayService] Email dispatch failed:', error)
          // Don't throw - email failures don't affect the primary operation
        }
      }
    }

    return created
  }
}

export const birthdayService = new BirthdayService()