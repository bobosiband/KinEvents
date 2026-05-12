import { renderLayout } from './layout'
import { renderPlainText } from './plain-text-layout'

export interface EventReminderContext {
  recipientName: string
  eventTitle: string
  eventDate: string
  daysUntil: number
  eventUrl: string
}

/**
 * Email sent as a reminder for an upcoming event.
 */
export function render(context: EventReminderContext) {
  const daysText =
    context.daysUntil === 0
      ? 'today'
      : context.daysUntil === 1
        ? 'tomorrow'
        : `in ${context.daysUntil} days`

  const formattedDate = formatDate(context.eventDate)

  const body = `<p>Hi ${escapeHtml(context.recipientName)},</p>

<p>Just a reminder that an event you're attending is coming up ${daysText}:</p>

<div style="background-color: #dbeafe; border-left: 4px solid #0284c7; padding: 16px; margin: 20px 0;">
  <p style="margin-top: 0; font-weight: 600; font-size: 18px;">${escapeHtml(context.eventTitle)}</p>
  <p><strong>📅 Date:</strong> ${formattedDate}</p>
</div>

<p>Mark your calendar and we'll see you there!</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
  <tr>
    <td style="background-color: #EF6C6C; border-radius: 6px; text-align: center; padding: 0;">
      <a href="${escapeHtml(context.eventUrl)}" style="display: inline-block; color: #ffffff; text-decoration: none; font-weight: 600; padding: 12px 28px; border-radius: 6px;">View Event</a>
    </td>
  </tr>
</table>

<p>Best regards,<br/>
The KinEvents Team</p>`

  const plainText = `Hi ${context.recipientName},

Just a reminder that an event you're attending is coming up ${daysText}:

${context.eventTitle}
📅 Date: ${formattedDate}

Mark your calendar and we'll see you there!

${context.eventUrl}

Best regards,
The KinEvents Team`

  return {
    subject: `Reminder: ${context.eventTitle} is ${daysText}`,
    html: renderLayout({
      title: `Event Reminder: ${context.eventTitle}`,
      preheader: `${context.eventTitle} is coming up`,
      body,
    }),
    text: renderPlainText({
      title: `Reminder: ${context.eventTitle} is ${daysText}`,
      body: plainText,
    }),
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
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
