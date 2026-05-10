import { renderLayout } from './layout'
import { renderPlainText } from './plain-text-layout'

export interface AccessApprovedContext {
  recipientName: string
  loginUrl: string
}

/**
 * Email sent when access request is approved.
 */
export function render(context: AccessApprovedContext) {
  const body = `<p>Hi ${escapeHtml(context.recipientName)},</p>

<p>Great news! Your access request to KinEvents has been <strong>approved</strong>. You now have full access to the platform.</p>

<p>You can start using KinEvents immediately:</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
  <tr>
    <td style="background-color: #B45309; border-radius: 6px; text-align: center; padding: 0;">
      <a href="${escapeHtml(context.loginUrl)}" style="display: inline-block; color: #ffffff; text-decoration: none; font-weight: 600; padding: 12px 28px; border-radius: 6px;">Access KinEvents</a>
    </td>
  </tr>
</table>

<p>Your account is ready, and you can begin creating events and managing your family gatherings right away.</p>

<p>Thanks for joining us!</p>

<p>Warm regards,<br/>
The KinEvents Team</p>`

  const plainText = `Hi ${context.recipientName},

Great news! Your access request to KinEvents has been approved. You now have full access to the platform.

You can start using KinEvents immediately:
${context.loginUrl}

Your account is ready, and you can begin creating events and managing your family gatherings right away.

Thanks for joining us!

Warm regards,
The KinEvents Team`

  return {
    subject: 'Your KinEvents Access Has Been Approved',
    html: renderLayout({
      title: 'Access Approved',
      preheader: 'Your KinEvents access has been approved!',
      body,
    }),
    text: renderPlainText({
      title: 'Your KinEvents Access Has Been Approved',
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
