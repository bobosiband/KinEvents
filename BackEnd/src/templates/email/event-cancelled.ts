import { renderLayout } from './layout'
import { renderPlainText } from './plain-text-layout'

export interface EventCancelledContext {
  recipientName: string
  eventTitle: string
  reason?: string
}

/**
 * Email sent when an event is cancelled.
 */
export function render(context: EventCancelledContext) {
  const reasonLine = context.reason ? `<p><strong>Reason:</strong> ${escapeHtml(context.reason)}</p>` : ''

  const body = `<p>Hi ${escapeHtml(context.recipientName)},</p>

<p>We regret to inform you that the following event has been <strong>cancelled</strong>:</p>

<div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
  <p style="margin-top: 0; font-weight: 600; font-size: 18px;">${escapeHtml(context.eventTitle)}</p>
  ${reasonLine}
</div>

<p>We apologize for any inconvenience this may cause. Thank you for your understanding.</p>

<p>Best regards,<br/>
The KinEvents Team</p>`

  const plainText = `Hi ${context.recipientName},

We regret to inform you that the following event has been cancelled:

${context.eventTitle}${context.reason ? `\nReason: ${context.reason}` : ''}

We apologize for any inconvenience this may cause. Thank you for your understanding.

Best regards,
The KinEvents Team`

  return {
    subject: `Event Cancelled: ${context.eventTitle}`,
    html: renderLayout({
      title: `Event Cancelled: ${context.eventTitle}`,
      preheader: `${context.eventTitle} has been cancelled`,
      body,
    }),
    text: renderPlainText({
      title: `Event Cancelled: ${context.eventTitle}`,
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
