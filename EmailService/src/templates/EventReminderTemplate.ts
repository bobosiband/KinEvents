import { BaseEmailTemplate } from './BaseEmailTemplate'
import { Layout } from './Layout'
import type { RenderedEmail } from '../types/EmailTypes'

interface EventReminderData {
  readonly recipientName: string
  readonly eventTitle: string
  readonly daysUntil: string
  readonly eventUrl: string
}

export class EventReminderTemplate extends BaseEmailTemplate {
  public readonly name: string = 'event-reminder'

  public render(data: Record<string, unknown>): RenderedEmail {
    return this.renderInternal(this.validate(data))
  }

  private validate(data: Record<string, unknown>): EventReminderData {
    return {
      recipientName: this.requireString(data, 'recipientName'),
      eventTitle: this.requireString(data, 'eventTitle'),
      daysUntil: this.requireString(data, 'daysUntil'),
      eventUrl: this.requireString(data, 'eventUrl'),
    }
  }

  private renderInternal(data: EventReminderData): RenderedEmail {
    const body = `<p>Hi ${Layout.escapeHtml(data.recipientName)},</p>
<p>Reminder: <strong>${Layout.escapeHtml(data.eventTitle)}</strong> is in <strong>${Layout.escapeHtml(data.daysUntil)}</strong> day(s).</p>
<p><a href="${Layout.escapeHtml(data.eventUrl)}" style="color:#EF6C6C;font-weight:600;">View event</a></p>`
    return {
      subject: `Reminder: ${data.eventTitle} in ${data.daysUntil} day(s)`,
      html: Layout.renderHtml({ title: 'Event reminder', body }),
      text: Layout.renderPlain({ title: `Reminder: ${data.eventTitle}`, body: `In ${data.daysUntil} day(s)\n${data.eventUrl}` }),
    }
  }
}
