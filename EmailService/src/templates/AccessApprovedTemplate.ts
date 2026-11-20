import { BaseEmailTemplate } from './BaseEmailTemplate'
import { Layout } from './Layout'
import type { RenderedEmail } from '../types/EmailTypes'

interface AccessApprovedData {
  readonly recipientName: string
  readonly loginUrl: string
}

export class AccessApprovedTemplate extends BaseEmailTemplate {
  public readonly name: string = 'access-approved'

  public render(data: Record<string, unknown>): RenderedEmail {
    return this.renderInternal(this.validate(data))
  }

  private validate(data: Record<string, unknown>): AccessApprovedData {
    return {
      recipientName: this.requireString(data, 'recipientName'),
      loginUrl: this.requireString(data, 'loginUrl'),
    }
  }

  private renderInternal(data: AccessApprovedData): RenderedEmail {
    const name = Layout.escapeHtml(data.recipientName)
    const url = Layout.escapeHtml(data.loginUrl)
    const body = `<p>Hi ${name},</p>
<p>Great news! Your access request to KinEvents has been <strong>approved</strong>. You now have full access to the platform.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
  <tr><td style="background-color:#EF6C6C;border-radius:6px;padding:0;">
    <a href="${url}" style="display:inline-block;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:6px;">Access KinEvents</a>
  </td></tr>
</table>
<p>Your account is ready, and you can begin creating events and managing your family gatherings right away.</p>
<p>Warm regards,<br/>The KinEvents Team</p>`
    return {
      subject: 'Your KinEvents Access Has Been Approved',
      html: Layout.renderHtml({ title: 'Access Approved', preheader: 'Your KinEvents access has been approved!', body }),
      text: Layout.renderPlain({
        title: 'Your KinEvents Access Has Been Approved',
        body: `Hi ${data.recipientName},\n\nYour access has been approved.\n\n${data.loginUrl}\n\nWarm regards,\nThe KinEvents Team`,
      }),
    }
  }
}
