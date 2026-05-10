import { renderLayout } from './layout'
import { renderPlainText } from './plain-text-layout'

export interface EventCreatedContext {
  recipientName: string
  eventTitle: string
  eventDate: string
  eventLocation?: string
  eventUrl: string
}

/**
 * Email sent when a new event is created.
 */
export function render(context: EventCreatedContext) {
  const locationLine = context.eventLocation ? `<p><strong>📍 Location:</strong> ${escapeHtml(context.eventLocation)}</p>` : ''

  const body = `<p>Hi ${escapeHtml(context.recipientName)},</p>

<p>A new event has been created on KinEvents:</p>

<div style="background-color: #fef3c7; border-left: 4px solid #B45309; padding: 16px; margin: 20px 0;">
  <p style="margin-top: 0; font-weight: 600; font-size: 18px;">${escapeHtml(context.eventTitle)}</p>
  <p><strong>📅 Date:</strong> ${escapeHtml(context.eventDate)}</p>
  ${locationLine}
</div>

<p>View the event and RSVP:</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
  <tr>
    <td style="background-color: #B45309; border-radius: 6px; text-align: center; padding: 0;">
      <a href="${escapeHtml(context.eventUrl)}" style="display: inline-block; color: #ffffff; text-decoration: none; font-weight: 600; padding: 12px 28px; border-radius: 6px;">View Event</a>
    </td>
  </tr>
</table>

<p>Best regards,<br/>
The KinEvents Team</p>`

  const plainText = `Hi ${context.recipientName},

A new event has been created on KinEvents:

${escapeHtml(context.eventTitle)}
📅 Date: ${context.eventDate}${context.eventLocation ? `\n📍 Location: ${context.eventLocation}` : ''}

View the event and RSVP:
${context.eventUrl}

Best regards,
The KinEvents Team`

  return {
    subject: `New Event: ${context.eventTitle}`,
    html: renderLayout({
      title: `New Event: ${context.eventTitle}`,
      preheader: `${context.eventTitle} has been created`,
      body,
    }),
    text: renderPlainText({
      title: `New Event: ${context.eventTitle}`,
      body: plainText,
    }),
  }
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}
