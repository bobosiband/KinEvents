import { BaseEmailTemplate } from './BaseEmailTemplate'
import { Layout } from './Layout'
import type { RenderedEmail } from '../types/EmailTypes'

interface AccountUpdatedData {
  readonly recipientName: string
  readonly summary: string
}

export class AccountUpdatedTemplate extends BaseEmailTemplate {
  public readonly name: string = 'account-updated'

  public render(data: Record<string, unknown>): RenderedEmail {
    return this.renderInternal(this.validate(data))
  }

  private validate(data: Record<string, unknown>): AccountUpdatedData {
    return {
      recipientName: this.requireString(data, 'recipientName'),
      summary: this.requireString(data, 'summary'),
    }
  }

  private renderInternal(data: AccountUpdatedData): RenderedEmail {
    const body = `<p>Hi ${Layout.escapeHtml(data.recipientName)},</p>
<p>Your account was just updated.</p>
<p><em>${Layout.escapeHtml(data.summary)}</em></p>
<p>If you didn't make this change, please contact support immediately.</p>`
    return {
      subject: 'Your KinEvents account was updated',
      html: Layout.renderHtml({ title: 'Account updated', body }),
      text: Layout.renderPlain({ title: 'Your KinEvents account was updated', body: `${data.summary}` }),
    }
  }
}
