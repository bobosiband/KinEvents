export class Layout {
  public static escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    }
    return text.replace(/[&<>"']/g, (char) => map[char] ?? char)
  }

  public static renderHtml(options: { title: string; preheader?: string; body: string }): string {
    const preheader = options.preheader
      ? `<div style="display: none; max-height: 0px; overflow: hidden;">${this.escapeHtml(options.preheader)}</div>`
      : ''
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${this.escapeHtml(options.title)}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  ${preheader}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-collapse: collapse;">
          <tr>
            <td style="background: linear-gradient(135deg, #EF6C6C 0%, #F49090 100%); padding: 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">KinEvents</h1>
              <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 14px;">Family Events Platform</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 30px; color: #374151; font-size: 16px; line-height: 1.6;">
              ${options.body}
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280;">
              KinEvents | Family Events Platform
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  }

  public static renderPlain(options: { title: string; body: string }): string {
    return `${options.title}\n\n${options.body}\n\n---\n\nKinEvents | Family Events Platform`
  }
}
