import { renderLayout } from './layout'
import { renderPlainText } from './plain-text-layout'

export interface AccessRequestContext {
  requesterName: string
  requesterEmail: string
  message?: string
  approvalUrl: string
  rejectionUrl: string
}

/**
 * Email sent to admins when a user requests access to KinEvents.
 */
export function render(context: AccessRequestContext) {
  const messageSection = context.message
    ? `<div style="background-color: #F5E6E6; border-left: 4px solid #EF6C6C; padding: 16px; margin: 20px 0;">
  <p style="margin-top: 0; font-weight: 600;">Message from requester:</p>
  <p style="margin-bottom: 0; font-style: italic;">"${escapeHtml(context.message)}"</p>
</div>`
    : ''

  const body = `<p>Hi Admin,</p>

<p>A new access request has been submitted to KinEvents:</p>

<div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 20px 0;">
  <p style="margin-top: 0; margin-bottom: 8px;"><strong>Name:</strong> ${escapeHtml(context.requesterName)}</p>
  <p style="margin-top: 0; margin-bottom: 0;"><strong>Email:</strong> ${escapeHtml(context.requesterEmail)}</p>
</div>

${messageSection}

<p>Please review this request and take action:</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
  <tr>
    <td style="background-color: #16a34a; border-radius: 6px; text-align: center; padding: 0; margin-right: 12px;">
      <a href="${escapeHtml(context.approvalUrl)}" style="display: inline-block; color: #ffffff; text-decoration: none; font-weight: 600; padding: 12px 28px; border-radius: 6px;">Approve Access</a>
    </td>
    <td style="background-color: #dc2626; border-radius: 6px; text-align: center; padding: 0;">
      <a href="${escapeHtml(context.rejectionUrl)}" style="display: inline-block; color: #ffffff; text-decoration: none; font-weight: 600; padding: 12px 28px; border-radius: 6px;">Reject Request</a>
    </td>
  </tr>
</table>

<p>Best regards,<br/>
The KinEvents Team</p>`

  const plainText = `Hi Admin,

A new access request has been submitted to KinEvents:

Name: ${context.requesterName}
Email: ${context.requesterEmail}

${context.message ? `Message from requester:\n"${context.message}"\n` : ''}

Please review this request and take action:

Approve: ${context.approvalUrl}
Reject: ${context.rejectionUrl}

Best regards,
The KinEvents Team`

  return {
    subject: `Access Request from ${context.requesterName}`,
    html: renderLayout({
      title: 'New Access Request',
      preheader: `Access request from ${context.requesterName}`,
      body,
    }),
    text: renderPlainText({
      title: `Access Request from ${context.requesterName}`,
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
