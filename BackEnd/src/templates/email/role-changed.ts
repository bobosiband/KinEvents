import { renderLayout } from './layout'
import { renderPlainText } from './plain-text-layout'

export interface RoleChangedContext {
  recipientName: string
  newRole: string
  capabilities: string[]
}

/**
 * Email sent when user role is changed.
 */
export function render(context: RoleChangedContext) {
  const capsList = context.capabilities.map((c) => `<li>${escapeHtml(c)}</li>`).join('')

  const body = `<p>Hi ${escapeHtml(context.recipientName)},</p>

<p>Your role on KinEvents has been updated to <strong>${escapeHtml(context.newRole)}</strong>.</p>

<p>Your new capabilities include:</p>

<ul style="margin: 12px 0; padding-left: 20px;">
  ${capsList}
</ul>

<p>If you have any questions about your new role, please reach out to an administrator.</p>

<p>Best regards,<br/>
The KinEvents Team</p>`

  const plainText = `Hi ${context.recipientName},

Your role on KinEvents has been updated to ${context.newRole}.

Your new capabilities include:

${context.capabilities.map((c) => `- ${c}`).join('\n')}

If you have any questions about your new role, please reach out to an administrator.

Best regards,
The KinEvents Team`

  return {
    subject: 'Your KinEvents Role Has Changed',
    html: renderLayout({
      title: 'Role Updated',
      preheader: 'Your KinEvents role has been updated',
      body,
    }),
    text: renderPlainText({
      title: 'Your KinEvents Role Has Changed',
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
