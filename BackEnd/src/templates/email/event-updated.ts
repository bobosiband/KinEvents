import { renderLayout } from './layout'
import { renderPlainText } from './plain-text-layout'

export interface EventUpdatedContext {
  recipientName: string
  eventTitle: string
  eventDate: string
  changes: string[]
  eventUrl: string
}

/**
 * Email sent when an event is updated.
 */
export function render(context: EventUpdatedContext) {
  const changesList = context.changes.map((c) => `<li>${escapeHtml(c)}</li>`).join('')

  const body = `<p>Hi ${escapeHtml(context.recipientName)},</p>

<p>An event you're interested in has been updated:</p>

<div style="background-color: #fef3c7; border-left: 4px solid #B45309; padding: 16px; margin: 20px 0;">
  <p style="margin-top: 0; font-weight: 600; font-size: 18px;">${escapeHtml(context.eventTitle)}</p>
  <p><strong>📅 Date:</strong> ${escapeHtml(context.eventDate)}</p>
</div>

<p><strong>Changes made:</strong></p>

<ul style="margin: 12px 0; padding-left: 20px;">
  ${changesList}
</ul>

<p>View the updated event:</p>

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

An event you're interested in has been updated:

${context.eventTitle}
📅 Date: ${context.eventDate}

Changes made:
${context.changes.map((c) => `- ${c}`).join('\n')}

View the updated event:
${context.eventUrl}

Best regards,
The KinEvents Team`

  return {
    subject: `Event Updated: ${context.eventTitle}`,
    html: renderLayout({
      title: `Event Updated: ${context.eventTitle}`,
      preheader: `${context.eventTitle} has been updated`,
      body,
    }),
    text: renderPlainText({
      title: `Event Updated: ${context.eventTitle}`,
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
