import { BaseEmailTemplate } from './BaseEmailTemplate'
import { Layout } from './Layout'
import type { RenderedEmail } from '../types/EmailTypes'

interface EventCreatedData {
  readonly recipientName: string
  readonly eventTitle: string
  readonly eventDate: string
  readonly eventUrl: string
}

export class EventCreatedTemplate extends BaseEmailTemplate {
  public readonly name: string = 'event-created'

  public render(data: Record<string, unknown>): RenderedEmail {
    return this.renderInternal(this.validate(data))
  }

  private validate(data: Record<string, unknown>): EventCreatedData {
    return {
      recipientName: this.requireString(data, 'recipientName'),
      eventTitle: this.requireString(data, 'eventTitle'),
      eventDate: this.requireString(data, 'eventDate'),
      eventUrl: this.requireString(data, 'eventUrl'),
    }
  }

  private renderInternal(data: EventCreatedData): RenderedEmail {
    const body = `<p>Hi ${Layout.escapeHtml(data.recipientName)},</p>
<p>A new family event has been scheduled:</p>
<p><strong>${Layout.escapeHtml(data.eventTitle)}</strong> on ${Layout.escapeHtml(data.eventDate)}.</p>
<p><a href="${Layout.escapeHtml(data.eventUrl)}" style="color:#EF6C6C;font-weight:600;">View event</a></p>`
    return {
      subject: `New event: ${data.eventTitle}`,
      html: Layout.renderHtml({ title: 'New event', body }),
      text: Layout.renderPlain({ title: `New event: ${data.eventTitle}`, body: `On ${data.eventDate}\n${data.eventUrl}` }),
    }
  }
}
