import { BaseEmailTemplate } from './BaseEmailTemplate'
import { Layout } from './Layout'
import type { RenderedEmail } from '../types/EmailTypes'

interface LoginPinData {
  readonly recipientName: string
  readonly code: string
  readonly expiresInMinutes: string
}

export class LoginPinTemplate extends BaseEmailTemplate {
  public readonly name: string = 'login-pin'

  public render(data: Record<string, unknown>): RenderedEmail {
    return this.renderInternal(this.validate(data))
  }

  private validate(data: Record<string, unknown>): LoginPinData {
    return {
      recipientName: this.requireString(data, 'recipientName'),
      code: this.requireString(data, 'code'),
      expiresInMinutes: this.requireString(data, 'expiresInMinutes'),
    }
  }

  private renderInternal(data: LoginPinData): RenderedEmail {
    const body = `<p>Hi ${Layout.escapeHtml(data.recipientName)},</p>
<p>Use this one-time code to set up your KinEvents admin PIN:</p>
<p style="font-size:28px;font-weight:700;letter-spacing:6px;color:#EF6C6C;">${Layout.escapeHtml(data.code)}</p>
<p>It expires in ${Layout.escapeHtml(data.expiresInMinutes)} minute(s). If you didn't ask for this, you can ignore the email.</p>`
    return {
      subject: 'Your KinEvents one-time setup code',
      html: Layout.renderHtml({ title: 'One-time setup code', body }),
      text: Layout.renderPlain({ title: 'Your KinEvents one-time setup code', body: `Code: ${data.code}\nExpires in ${data.expiresInMinutes} minute(s).` }),
    }
  }
}
