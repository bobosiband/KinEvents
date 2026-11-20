import { BaseEmailTemplate } from './BaseEmailTemplate'
import { Layout } from './Layout'
import type { RenderedEmail } from '../types/EmailTypes'

interface RoleChangedData {
  readonly recipientName: string
  readonly newRole: string
}

export class RoleChangedTemplate extends BaseEmailTemplate {
  public readonly name: string = 'role-changed'

  public render(data: Record<string, unknown>): RenderedEmail {
    return this.renderInternal(this.validate(data))
  }

  private validate(data: Record<string, unknown>): RoleChangedData {
    return {
      recipientName: this.requireString(data, 'recipientName'),
      newRole: this.requireString(data, 'newRole'),
    }
  }

  private renderInternal(data: RoleChangedData): RenderedEmail {
    const body = `<p>Hi ${Layout.escapeHtml(data.recipientName)},</p>
<p>Your role in KinEvents is now <strong>${Layout.escapeHtml(data.newRole)}</strong>.</p>`
    return {
      subject: `Your KinEvents role is now ${data.newRole}`,
      html: Layout.renderHtml({ title: 'Role updated', body }),
      text: Layout.renderPlain({ title: `Your KinEvents role is now ${data.newRole}`, body: '' }),
    }
  }
}
