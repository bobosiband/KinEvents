/**
 * HTML email layout wrapper with KinEvents branding.
 * Inline CSS, mobile-responsive, Gmail/Outlook/Apple Mail compatible.
 */
export function renderLayout(options: {
  title: string
  preheader?: string
  body: string
  footerText?: string
}): string {
  return `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(options.title)}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  ${options.preheader ? `<div style="display: none; max-height: 0px; overflow: hidden;">${escapeHtml(options.preheader)}</div>` : ''}
  
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px;">
        <!-- Main container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #EF6C6C 0%, #F49090 100%); padding: 30px 20px; text-align: center; border-bottom: 3px solid #EF6C6C;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">❤️ KinEvents</h1>
              <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 14px;">Family Events Platform</p>
            </td>
          </tr>

          <!-- Body content -->
          <tr>
            <td style="padding: 30px 30px; color: #374151; font-size: 16px; line-height: 1.6;">
              ${options.body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280;">
              <p style="margin: 0; padding: 0;">
                <strong>KinEvents</strong> — Family Events Platform
              </p>
              ${options.footerText ? `<p style="margin: 8px 0 0 0; padding: 0;">${escapeHtml(options.footerText)}</p>` : ''}
              <p style="margin: 12px 0 0 0; padding: 0; border-top: 1px solid #e5e7eb; padding-top: 12px;">
                <a href="https://kinevents.vercel.app/profile" style="color: #EF6C6C; text-decoration: none; font-weight: 500;">Manage email preferences</a>
              </p>
              <p style="margin: 8px 0 0 0; padding: 0;">
                © 2024–2026 KinEvents. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Escapes HTML special characters to prevent XSS.
 */
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
