import { renderLayout } from './layout'
import { renderPlainText } from './plain-text-layout'

export interface BirthdayReminderContext {
  recipientName: string
  birthdayPersonName: string
  daysUntil: number
  birthdayDate: string
}

/**
 * Birthday reminder sent to family members.
 */
export function render(context: BirthdayReminderContext) {
  const daysText =
    context.daysUntil === 0
      ? 'today'
      : context.daysUntil === 1
        ? 'tomorrow'
        : `in ${context.daysUntil} days`

  const formattedDate = formatBirthdayDate(context.birthdayDate)

  const body = `<p>Hi ${escapeHtml(context.recipientName)},</p>

<p>Just a heads up! <strong>${escapeHtml(context.birthdayPersonName)}'s</strong> birthday is coming up ${daysText} on ${formattedDate}.</p>

<p>Start planning your celebration! 🎂</p>

<p>Best regards,<br/>
The KinEvents Team</p>`

  const plainText = `Hi ${context.recipientName},

Just a heads up! ${context.birthdayPersonName}'s birthday is coming up ${daysText} on ${formattedDate}.

Start planning your celebration! 🎂

Best regards,
The KinEvents Team`

  return {
    subject: `${context.birthdayPersonName}'s Birthday is Coming Up!`,
    html: renderLayout({
      title: 'Birthday Reminder',
      preheader: `${context.birthdayPersonName}'s birthday is ${daysText}`,
      body,
    }),
    text: renderPlainText({
      title: `${context.birthdayPersonName}'s Birthday is Coming Up!`,
      body: plainText,
    }),
  }
}

function formatBirthdayDate(dateStr: string): string {
  const [, month, day] = dateStr.split('-').map(Number)
  return new Date(2000, month - 1, day).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  })
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}
