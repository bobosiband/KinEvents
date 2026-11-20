import { BaseEmailTemplate } from './BaseEmailTemplate'
import { Layout } from './Layout'
import type { RenderedEmail } from '../types/EmailTypes'

interface WelcomeData {
  readonly recipientName: string
  readonly loginUrl: string
}

export class WelcomeTemplate extends BaseEmailTemplate {
  public readonly name: string = 'welcome'

  public render(data: Record<string, unknown>): RenderedEmail {
    return this.renderInternal(this.validate(data))
  }

  private validate(data: Record<string, unknown>): WelcomeData {
    return {
      recipientName: this.requireString(data, 'recipientName'),
      loginUrl: this.requireString(data, 'loginUrl'),
    }
  }

  private renderInternal(data: WelcomeData): RenderedEmail {
    const name = Layout.escapeHtml(data.recipientName)
    const url = Layout.escapeHtml(data.loginUrl)
    const body = `<p>Hi ${name},</p>
<p>Welcome to KinEvents — your family's events, birthdays and gift pools, all in one place.</p>
<p><a href="${url}" style="color:#EF6C6C;font-weight:600;">Open KinEvents</a></p>
<p>Warm regards,<br/>The KinEvents Team</p>`
    return {
      subject: 'Welcome to KinEvents',
      html: Layout.renderHtml({ title: 'Welcome', preheader: 'Welcome to KinEvents', body }),
      text: Layout.renderPlain({ title: 'Welcome to KinEvents', body: `Hi ${data.recipientName},\n\nWelcome to KinEvents.\n\n${data.loginUrl}` }),
    }
  }
}
