import { BaseEmailTemplate } from './BaseEmailTemplate'
import { Layout } from './Layout'
import type { RenderedEmail } from '../types/EmailTypes'

interface AccessRequestData {
  readonly requesterName: string
  readonly requesterEmail: string
  readonly adminUrl: string
  readonly message?: string
}

export class AccessRequestTemplate extends BaseEmailTemplate {
  public readonly name: string = 'access-request'

  public render(data: Record<string, unknown>): RenderedEmail {
    return this.renderInternal(this.validate(data))
  }

  private validate(data: Record<string, unknown>): AccessRequestData {
    return {
      requesterName: this.requireString(data, 'requesterName'),
      requesterEmail: this.requireString(data, 'requesterEmail'),
      adminUrl: this.requireString(data, 'adminUrl'),
      message: this.optionalString(data, 'message'),
    }
  }

  private renderInternal(data: AccessRequestData): RenderedEmail {
    const requesterName = Layout.escapeHtml(data.requesterName)
    const requesterEmail = Layout.escapeHtml(data.requesterEmail)
    const adminUrl = Layout.escapeHtml(data.adminUrl)
    const messageBlock = data.message
      ? `<div style="background-color:#F5E6E6;border-left:4px solid #EF6C6C;padding:16px;margin:20px 0;">
<p style="margin-top:0;font-weight:600;">Message from requester:</p>
<p style="margin-bottom:0;font-style:italic;">"${Layout.escapeHtml(data.message)}"</p>
</div>`
      : ''
    const body = `<p>Hi Admin,</p>
<p>A new access request has been submitted:</p>
<div style="background-color:#f0fdf4;border-left:4px solid #16a34a;padding:16px;margin:20px 0;">
<p style="margin:0 0 8px;"><strong>Name:</strong> ${requesterName}</p>
<p style="margin:0;"><strong>Email:</strong> ${requesterEmail}</p>
</div>
${messageBlock}
<p><a href="${adminUrl}" style="color:#EF6C6C;font-weight:600;">Review Request</a></p>`
    return {
      subject: `Access Request from ${data.requesterName}`,
      html: Layout.renderHtml({ title: 'New Access Request', preheader: `Access request from ${data.requesterName}`, body }),
      text: Layout.renderPlain({
        title: `Access Request from ${data.requesterName}`,
        body: `Name: ${data.requesterName}\nEmail: ${data.requesterEmail}\n${data.message ? `Message: ${data.message}\n` : ''}\n${data.adminUrl}`,
      }),
    }
  }
}
