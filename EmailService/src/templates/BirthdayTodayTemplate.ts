import { BaseEmailTemplate } from './BaseEmailTemplate'
import { Layout } from './Layout'
import type { RenderedEmail } from '../types/EmailTypes'

interface BirthdayTodayData {
  readonly recipientName: string
  readonly birthdayName: string
}

export class BirthdayTodayTemplate extends BaseEmailTemplate {
  public readonly name: string = 'birthday-today'

  public render(data: Record<string, unknown>): RenderedEmail {
    return this.renderInternal(this.validate(data))
  }

  private validate(data: Record<string, unknown>): BirthdayTodayData {
    return {
      recipientName: this.requireString(data, 'recipientName'),
      birthdayName: this.requireString(data, 'birthdayName'),
    }
  }

  private renderInternal(data: BirthdayTodayData): RenderedEmail {
    const body = `<p>Hi ${Layout.escapeHtml(data.recipientName)},</p>
<p>Today is <strong>${Layout.escapeHtml(data.birthdayName)}</strong>'s birthday. Send them a message!</p>`
    return {
      subject: `It's ${data.birthdayName}'s birthday today`,
      html: Layout.renderHtml({ title: 'Happy birthday', body }),
      text: Layout.renderPlain({ title: `It's ${data.birthdayName}'s birthday today`, body: '' }),
    }
  }
}
