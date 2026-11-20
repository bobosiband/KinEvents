import { BaseEmailTemplate } from './BaseEmailTemplate'
import { Layout } from './Layout'
import type { RenderedEmail } from '../types/EmailTypes'

interface EventCancelledData {
  readonly recipientName: string
  readonly eventTitle: string
}

export class EventCancelledTemplate extends BaseEmailTemplate {
  public readonly name: string = 'event-cancelled'

  public render(data: Record<string, unknown>): RenderedEmail {
    return this.renderInternal(this.validate(data))
  }

  private validate(data: Record<string, unknown>): EventCancelledData {
    return {
      recipientName: this.requireString(data, 'recipientName'),
      eventTitle: this.requireString(data, 'eventTitle'),
    }
  }

  private renderInternal(data: EventCancelledData): RenderedEmail {
    const body = `<p>Hi ${Layout.escapeHtml(data.recipientName)},</p>
<p>The event <strong>${Layout.escapeHtml(data.eventTitle)}</strong> has been cancelled.</p>`
    return {
      subject: `Event cancelled: ${data.eventTitle}`,
      html: Layout.renderHtml({ title: 'Event cancelled', body }),
      text: Layout.renderPlain({ title: `Event cancelled: ${data.eventTitle}`, body: '' }),
    }
  }
}
