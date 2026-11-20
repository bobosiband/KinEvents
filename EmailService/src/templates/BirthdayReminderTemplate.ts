import { BaseEmailTemplate } from './BaseEmailTemplate'
import { Layout } from './Layout'
import type { RenderedEmail } from '../types/EmailTypes'

interface BirthdayReminderData {
  readonly recipientName: string
  readonly birthdayName: string
  readonly daysUntil: string
}

export class BirthdayReminderTemplate extends BaseEmailTemplate {
  public readonly name: string = 'birthday-reminder'

  public render(data: Record<string, unknown>): RenderedEmail {
    return this.renderInternal(this.validate(data))
  }

  private validate(data: Record<string, unknown>): BirthdayReminderData {
    return {
      recipientName: this.requireString(data, 'recipientName'),
      birthdayName: this.requireString(data, 'birthdayName'),
      daysUntil: this.requireString(data, 'daysUntil'),
    }
  }

  private renderInternal(data: BirthdayReminderData): RenderedEmail {
    const body = `<p>Hi ${Layout.escapeHtml(data.recipientName)},</p>
<p><strong>${Layout.escapeHtml(data.birthdayName)}</strong>'s birthday is in <strong>${Layout.escapeHtml(data.daysUntil)}</strong> day(s).</p>`
    return {
      subject: `${data.birthdayName}'s birthday in ${data.daysUntil} day(s)`,
      html: Layout.renderHtml({ title: 'Birthday reminder', body }),
      text: Layout.renderPlain({ title: `${data.birthdayName}'s birthday in ${data.daysUntil} day(s)`, body: '' }),
    }
  }
}
