import { renderLayout } from './layout'
import { renderPlainText } from './plain-text-layout'

export interface AccessRejectedContext {
  recipientName: string
  supportEmail: string
}

/**
 * Email sent when access request is rejected.
 */
export function render(context: AccessRejectedContext) {
  const body = `<p>Hi ${escapeHtml(context.recipientName)},</p>

<p>Thank you for your interest in KinEvents. Unfortunately, your access request has been <strong>declined</strong> at this time.</p>

<p>If you believe this is an error or would like more information, please contact us:</p>

<p><a href="mailto:${escapeHtml(context.supportEmail)}" style="color: #B45309; text-decoration: none; font-weight: 600;">${escapeHtml(context.supportEmail)}</a></p>

<p>We appreciate your understanding.</p>

<p>Best regards,<br/>
The KinEvents Team</p>`

  const plainText = `Hi ${context.recipientName},

Thank you for your interest in KinEvents. Unfortunately, your access request has been declined at this time.

If you believe this is an error or would like more information, please contact us:
${context.supportEmail}

We appreciate your understanding.

Best regards,
The KinEvents Team`

  return {
    subject: 'Your KinEvents Access Request Update',
    html: renderLayout({
      title: 'Access Request Update',
      preheader: 'Update on your KinEvents access request',
      body,
    }),
    text: renderPlainText({
      title: 'Your KinEvents Access Request Update',
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
