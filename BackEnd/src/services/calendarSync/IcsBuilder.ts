import type { IEvent } from '../../interfaces/event.interface'
import type { IUser } from '../../interfaces/user.interface'

/**
 * Builds a RFC 5545-compatible .ics feed for a single user: the user's
 * birthday (yearly recurring) plus every family event they have RSVP'd
 * "yes" to. Cancelled events ship as STATUS:CANCELLED so subscribers
 * remove them cleanly.
 */
export class IcsBuilder {
  private static readonly ProductId: string = '-//KinEvents//Calendar Sync//EN'

  public build(user: IUser, events: readonly IEvent[]): string {
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      `PRODID:${IcsBuilder.ProductId}`,
      'VERSION:2.0',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:KinEvents — ${this.escape(user.name)}`,
      'X-WR-TIMEZONE:UTC',
    ]

    if (user.birthday) {
      const birthday = this.formatBirthday(user.birthday)
      if (birthday) {
        lines.push(
          'BEGIN:VEVENT',
          `UID:birthday-${user.id}@kinevents`,
          `SUMMARY:${this.escape(user.name)}'s birthday`,
          `DTSTART;VALUE=DATE:${birthday}`,
          'DURATION:P1D',
          'RRULE:FREQ=YEARLY;COUNT=10',
          `DTSTAMP:${this.nowUtc()}`,
          'TRANSP:TRANSPARENT',
          'END:VEVENT',
        )
      }
    }

    for (const event of events) {
      lines.push(
        'BEGIN:VEVENT',
        `UID:event-${event.id}@kinevents`,
        `SUMMARY:${this.escape(event.title)}`,
      )
      if (event.description) {
        lines.push(`DESCRIPTION:${this.escape(event.description)}`)
      }
      if (event.location) {
        lines.push(`LOCATION:${this.escape(event.location)}`)
      }
      const stamp = this.toIcsDateTime(event.date)
      if (stamp) lines.push(`DTSTART:${stamp}`)
      if ((event as unknown as { cancelled?: boolean }).cancelled) lines.push('STATUS:CANCELLED')
      lines.push(`DTSTAMP:${this.nowUtc()}`, 'END:VEVENT')
    }

    lines.push('END:VCALENDAR')
    return lines.join('\r\n') + '\r\n'
  }

  private formatBirthday(raw: string): string | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw)
    if (!match) return null
    const [, year, month, day] = match
    return `${year}${month}${day}`
  }

  private toIcsDateTime(raw: string): string | null {
    const date = new Date(raw)
    if (Number.isNaN(date.getTime())) return null
    const pad = (n: number): string => String(n).padStart(2, '0')
    return (
      `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
      `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
    )
  }

  private nowUtc(): string {
    return this.toIcsDateTime(new Date().toISOString()) ?? ''
  }

  private escape(text: string): string {
    return text.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
  }
}
