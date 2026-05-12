import { renderLayout } from './layout'
import { renderPlainText } from './plain-text-layout'

export interface WelcomeContext {
  recipientName: string
  loginUrl: string
}

const LOGIN_URL = 'https://kinevents.vercel.app/login'
/**
 * Welcome email template for new approved users.
 */
export function render(context: WelcomeContext) {
  const body = `<p>Hi ${escapeHtml(context.recipientName)},</p>

<p>Welcome to <strong>KinEvents</strong>! Your access request has been approved, and you now have full access to our platform.</p>

<p>You can log in and start managing your family events right away:</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
  <tr>
    <td style="background-color: #EF6C6C; border-radius: 6px; text-align: center; padding: 0;">
      <a href="${escapeHtml(context.loginUrl)}" style="display: inline-block; color: #ffffff; text-decoration: none; font-weight: 600; padding: 12px 28px; border-radius: 6px;">Log In Now</a>
    </td>
  </tr>
</table>

<p>Once logged in, you'll be able to:</p>
<ul style="margin: 12px 0; padding-left: 20px;">
  <li>Create and manage family events</li>
  <li>Respond to upcoming gatherings</li>
  <li>View upcoming birthdays</li>
  <li>Receive notifications about events</li>
</ul>

<p>If you have any questions, feel free to reach out. Looking forward to having you on the platform!</p>

<p>Best regards,<br/>
The KinEvents Team</p>`

  const plainText = `Hi ${context.recipientName},

Welcome to KinEvents! Your access request has been approved, and you now have full access to our platform.

You can log in and start managing your family events right away:
${LOGIN_URL}

Once logged in, you'll be able to:
- Create and manage family events
- Respond to upcoming gatherings
- View upcoming birthdays
- Receive notifications about events

One More Important Thing: If you have do do is ADDING YOUR BIRTHDAY!!

If you have any questions, feel free to reach out. Looking forward to having you on the platform!

Best regards,
The KinEvents Team`

  return {
    subject: `Welcome to KinEvents, ${context.recipientName}!`,
    html: renderLayout({
      title: 'Welcome to KinEvents',
      preheader: 'Your access has been approved!',
      body,
    }),
    text: renderPlainText({
      title: 'Welcome to KinEvents',
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
