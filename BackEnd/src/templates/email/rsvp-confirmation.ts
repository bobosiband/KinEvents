import { renderLayout } from './layout'
import { renderPlainText } from './plain-text-layout'

export interface RSVPConfirmationContext {
  recipientName: string
  eventTitle: string
  rsvpStatus: string
  eventDate: string
}

/**
 * Email sent to confirm an attendance response.
 */
export function render(context: RSVPConfirmationContext) {
  const statusEmoji = context.rsvpStatus === 'yes' ? '✅' : context.rsvpStatus === 'no' ? '❌' : '❓'
  const formattedDate = formatDate(context.eventDate)

  const body = `<p>Hi ${escapeHtml(context.recipientName)},</p>

<p>Your attendance has been recorded for the following event:</p>

<div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 20px 0;">
  <p style="margin-top: 0; font-weight: 600; font-size: 18px;">${escapeHtml(context.eventTitle)}</p>
  <p><strong>📅 Date:</strong> ${formattedDate}</p>
  <p><strong>Your response:</strong> ${statusEmoji} ${escapeHtml(context.rsvpStatus)}</p>
</div>

<p>Thank you for letting us know! We look forward to seeing you.</p>

<p>Best regards,<br/>
The KinEvents Team</p>`

  const plainText = `Hi ${context.recipientName},

Your attendance has been recorded for the following event:

${context.eventTitle}
📅 Date: ${formattedDate}
Your response: ${statusEmoji} ${context.rsvpStatus}

Thank you for letting us know! We look forward to seeing you.

Best regards,
The KinEvents Team`

  return {
    subject: `You're all set for: ${context.eventTitle}`,
    html: renderLayout({
      title: 'Attendance Confirmed',
      preheader: 'Your attendance has been recorded',
      body,
    }),
    text: renderPlainText({
      title: 'Attendance Confirmed',
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
