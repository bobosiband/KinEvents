import { renderLayout } from './layout'
import { renderPlainText } from './plain-text-layout'

export interface AnnouncementContext {
  recipientName: string
  announcementTitle: string
  announcementBody: string
  priority: 'normal' | 'important'
}

/**
 * Announcement email template.
 */
export function render(context: AnnouncementContext) {
  const bgColor = context.priority === 'important' ? '#fee2e2' : '#fef3c7'
  const borderColor = context.priority === 'important' ? '#dc2626' : '#EF6C6C'

  const body = `<p>Hi ${escapeHtml(context.recipientName)},</p>

<div style="background-color: ${bgColor}; border-left: 4px solid ${borderColor}; padding: 16px; margin: 20px 0;">
  <p style="margin-top: 0; font-weight: 600; font-size: 18px;">${escapeHtml(context.announcementTitle)}</p>
  <p style="margin-bottom: 0;">${escapeHtml(context.announcementBody)}</p>
</div>

<p>Thank you for being part of the KinEvents community!</p>

<p>Best regards,<br/>
The KinEvents Team</p>`

  const plainText = `Hi ${context.recipientName},

${context.announcementTitle}

${context.announcementBody}

Thank you for being part of the KinEvents community!

Best regards,
The KinEvents Team`

  return {
    subject: context.announcementTitle,
    html: renderLayout({
      title: context.announcementTitle,
      preheader: context.announcementTitle,
      body,
    }),
    text: renderPlainText({
      title: context.announcementTitle,
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
