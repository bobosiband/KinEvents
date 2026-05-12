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
 * This renderer uses the `approvalUrl` and `rejectionUrl` provided in the
 * template context instead of any hardcoded admin URL so links point to the
 * live frontend (from `process.env.APP_URL` as provided by the dispatcher).
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

<p>Log in to the admin panel to review and take action on this request:</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
  <tr>
    <td style="padding: 0 8px 0 0;">
      <a href="${escapeHtml(context.approvalUrl)}" style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; font-weight: 600; padding: 12px 20px; border-radius: 6px;">Approve</a>
    </td>
    <td style="padding: 0;">
      <a href="${escapeHtml(context.rejectionUrl)}" style="display: inline-block; background-color: #EF6C6C; color: #ffffff; text-decoration: none; font-weight: 600; padding: 12px 20px; border-radius: 6px;">Reject</a>
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

Log in to the admin panel to review and take action on this request:
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