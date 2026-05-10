import { renderLayout } from './layout'
import { renderPlainText } from './plain-text-layout'

export interface BirthdayTodayContext {
  recipientName: string
}

/**
 * Birthday greeting sent on someone's birthday.
 */
export function render(context: BirthdayTodayContext) {
  const body = `<p>🎂 <strong>Happy Birthday, ${escapeHtml(context.recipientName)}!</strong> 🎂</p>

<p>Today is your special day! We hope you have an amazing celebration surrounded by loved ones.</p>

<p>May this year bring you joy, laughter, and wonderful memories with your family.</p>

<p>Enjoy your day!</p>

<p style="margin-top: 30px;">With warmest wishes,<br/>
The KinEvents Team 🎉</p>`

  const plainText = `🎂 Happy Birthday, ${context.recipientName}! 🎂

Today is your special day! We hope you have an amazing celebration surrounded by loved ones.

May this year bring you joy, laughter, and wonderful memories with your family.

Enjoy your day!

With warmest wishes,
The KinEvents Team 🎉`

  return {
    subject: `🎂 Happy Birthday, ${context.recipientName}!`,
    html: renderLayout({
      title: 'Happy Birthday!',
      preheader: 'Wishing you a wonderful birthday',
      body,
    }),
    text: renderPlainText({
      title: `🎂 Happy Birthday, ${context.recipientName}!`,
      body: plainText,
    }),
  }
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
