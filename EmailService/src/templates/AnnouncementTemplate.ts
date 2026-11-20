import { BaseEmailTemplate } from './BaseEmailTemplate'
import { Layout } from './Layout'
import type { RenderedEmail } from '../types/EmailTypes'

interface AnnouncementData {
  readonly recipientName: string
  readonly title: string
  readonly message: string
}

export class AnnouncementTemplate extends BaseEmailTemplate {
  public readonly name: string = 'announcement'

  public render(data: Record<string, unknown>): RenderedEmail {
    return this.renderInternal(this.validate(data))
  }

  private validate(data: Record<string, unknown>): AnnouncementData {
    return {
      recipientName: this.requireString(data, 'recipientName'),
      title: this.requireString(data, 'title'),
      message: this.requireString(data, 'message'),
    }
  }

  private renderInternal(data: AnnouncementData): RenderedEmail {
    const body = `<p>Hi ${Layout.escapeHtml(data.recipientName)},</p>
<h2 style="color:#EF6C6C;">${Layout.escapeHtml(data.title)}</h2>
<p>${Layout.escapeHtml(data.message)}</p>`
    return {
      subject: data.title,
      html: Layout.renderHtml({ title: data.title, body }),
      text: Layout.renderPlain({ title: data.title, body: data.message }),
    }
  }
}
