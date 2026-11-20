import { BaseEmailTemplate } from './BaseEmailTemplate'
import { Layout } from './Layout'
import type { RenderedEmail } from '../types/EmailTypes'

interface EventUpdatedData {
  readonly recipientName: string
  readonly eventTitle: string
  readonly eventUrl: string
}

export class EventUpdatedTemplate extends BaseEmailTemplate {
  public readonly name: string = 'event-updated'

  public render(data: Record<string, unknown>): RenderedEmail {
    return this.renderInternal(this.validate(data))
  }

  private validate(data: Record<string, unknown>): EventUpdatedData {
    return {
      recipientName: this.requireString(data, 'recipientName'),
      eventTitle: this.requireString(data, 'eventTitle'),
      eventUrl: this.requireString(data, 'eventUrl'),
    }
  }

  private renderInternal(data: EventUpdatedData): RenderedEmail {
    const body = `<p>Hi ${Layout.escapeHtml(data.recipientName)},</p>
<p>The event <strong>${Layout.escapeHtml(data.eventTitle)}</strong> has been updated.</p>
<p><a href="${Layout.escapeHtml(data.eventUrl)}" style="color:#EF6C6C;font-weight:600;">View changes</a></p>`
    return {
      subject: `Event updated: ${data.eventTitle}`,
      html: Layout.renderHtml({ title: 'Event updated', body }),
      text: Layout.renderPlain({ title: `Event updated: ${data.eventTitle}`, body: data.eventUrl }),
    }
  }
}
