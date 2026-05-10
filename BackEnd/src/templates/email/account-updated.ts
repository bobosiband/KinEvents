import { renderLayout } from './layout'
import { renderPlainText } from './plain-text-layout'

export interface AccountUpdatedContext {
  recipientName: string
  changedFields: string[]
}

/**
 * Email sent when user account is updated.
 */
export function render(context: AccountUpdatedContext) {
  const fieldsList = context.changedFields.map((f) => `<li>${escapeHtml(f)}</li>`).join('')

  const body = `<p>Hi ${escapeHtml(context.recipientName)},</p>

<p>Your KinEvents account was recently updated. The following fields were changed:</p>

<ul style="margin: 12px 0; padding-left: 20px;">
  ${fieldsList}
</ul>

<p>If you did not make these changes or have any concerns, please contact us immediately.</p>

<p>Best regards,<br/>
The KinEvents Team</p>`

  const plainText = `Hi ${context.recipientName},

Your KinEvents account was recently updated. The following fields were changed:

${context.changedFields.map((f) => `- ${f}`).join('\n')}

If you did not make these changes or have any concerns, please contact us immediately.

Best regards,
The KinEvents Team`

  return {
    subject: 'Your KinEvents Account Was Updated',
    html: renderLayout({
      title: 'Account Updated',
      preheader: 'Your account has been updated',
      body,
    }),
    text: renderPlainText({
      title: 'Your KinEvents Account Was Updated',
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
