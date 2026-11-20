import { BaseEmailTemplate } from './BaseEmailTemplate'
import { Layout } from './Layout'
import type { RenderedEmail } from '../types/EmailTypes'

interface RsvpConfirmationData {
  readonly recipientName: string
  readonly eventTitle: string
  readonly rsvpStatus: string
}

export class RsvpConfirmationTemplate extends BaseEmailTemplate {
  public readonly name: string = 'rsvp-confirmation'

  public render(data: Record<string, unknown>): RenderedEmail {
    return this.renderInternal(this.validate(data))
  }

  private validate(data: Record<string, unknown>): RsvpConfirmationData {
    return {
      recipientName: this.requireString(data, 'recipientName'),
      eventTitle: this.requireString(data, 'eventTitle'),
      rsvpStatus: this.requireString(data, 'rsvpStatus'),
    }
  }

  private renderInternal(data: RsvpConfirmationData): RenderedEmail {
    const body = `<p>Hi ${Layout.escapeHtml(data.recipientName)},</p>
<p>Your RSVP of <strong>${Layout.escapeHtml(data.rsvpStatus)}</strong> for <strong>${Layout.escapeHtml(data.eventTitle)}</strong> has been recorded.</p>`
    return {
      subject: `RSVP confirmed: ${data.eventTitle}`,
      html: Layout.renderHtml({ title: 'RSVP confirmed', body }),
      text: Layout.renderPlain({ title: `RSVP confirmed: ${data.eventTitle}`, body: `Status: ${data.rsvpStatus}` }),
    }
  }
}
