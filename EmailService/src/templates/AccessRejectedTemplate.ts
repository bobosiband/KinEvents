import { BaseEmailTemplate } from './BaseEmailTemplate'
import { Layout } from './Layout'
import type { RenderedEmail } from '../types/EmailTypes'

interface AccessRejectedData {
  readonly recipientName: string
  readonly supportEmail: string
}

export class AccessRejectedTemplate extends BaseEmailTemplate {
  public readonly name: string = 'access-rejected'

  public render(data: Record<string, unknown>): RenderedEmail {
    return this.renderInternal(this.validate(data))
  }

  private validate(data: Record<string, unknown>): AccessRejectedData {
    return {
      recipientName: this.requireString(data, 'recipientName'),
      supportEmail: this.requireString(data, 'supportEmail'),
    }
  }

  private renderInternal(data: AccessRejectedData): RenderedEmail {
    const name = Layout.escapeHtml(data.recipientName)
    const support = Layout.escapeHtml(data.supportEmail)
    const body = `<p>Hi ${name},</p>
<p>Thank you for your interest in KinEvents. Unfortunately, your access request has been <strong>declined</strong> at this time.</p>
<p>If you believe this is an error, please contact <a href="mailto:${support}" style="color:#EF6C6C;font-weight:600;">${support}</a>.</p>
<p>Best regards,<br/>The KinEvents Team</p>`
    return {
      subject: 'Your KinEvents Access Request Update',
      html: Layout.renderHtml({ title: 'Access Request Update', preheader: 'Update on your KinEvents access request', body }),
      text: Layout.renderPlain({
        title: 'Your KinEvents Access Request Update',
        body: `Hi ${data.recipientName},\n\nYour access request has been declined. Contact ${data.supportEmail}.\n\nBest regards,\nThe KinEvents Team`,
      }),
    }
  }
}
