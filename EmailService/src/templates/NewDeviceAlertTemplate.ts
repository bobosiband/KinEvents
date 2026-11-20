import { BaseEmailTemplate } from './BaseEmailTemplate'
import { Layout } from './Layout'
import type { RenderedEmail } from '../types/EmailTypes'

interface NewDeviceAlertData {
  readonly recipientName: string
  readonly deviceSummary: string
  readonly loginAt: string
  readonly ipAddress: string
}

export class NewDeviceAlertTemplate extends BaseEmailTemplate {
  public readonly name: string = 'new-device-alert'

  public render(data: Record<string, unknown>): RenderedEmail {
    return this.renderInternal(this.validate(data))
  }

  private validate(data: Record<string, unknown>): NewDeviceAlertData {
    return {
      recipientName: this.requireString(data, 'recipientName'),
      deviceSummary: this.requireString(data, 'deviceSummary'),
      loginAt: this.requireString(data, 'loginAt'),
      ipAddress: this.requireString(data, 'ipAddress'),
    }
  }

  private renderInternal(data: NewDeviceAlertData): RenderedEmail {
    const body = `<p>Hi ${Layout.escapeHtml(data.recipientName)},</p>
<p>A new sign-in to your KinEvents admin account was detected:</p>
<ul>
  <li><strong>Device:</strong> ${Layout.escapeHtml(data.deviceSummary)}</li>
  <li><strong>IP:</strong> ${Layout.escapeHtml(data.ipAddress)}</li>
  <li><strong>At:</strong> ${Layout.escapeHtml(data.loginAt)}</li>
</ul>
<p>If this was you, you can ignore this email. If not, change your PIN immediately.</p>`
    return {
      subject: 'New sign-in to your KinEvents admin account',
      html: Layout.renderHtml({ title: 'New sign-in', body }),
      text: Layout.renderPlain({ title: 'New sign-in', body: `Device: ${data.deviceSummary}\nIP: ${data.ipAddress}\nAt: ${data.loginAt}` }),
    }
  }
}
