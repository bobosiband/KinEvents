import type { EmailAddress, EmailTemplateName } from '../interfaces/email.interface'

export interface IEmailSender {
  sendTemplate(templateName: EmailTemplateName, data: Record<string, unknown>, recipient: EmailAddress, recipientId: string): Promise<boolean>
}

interface SendEmailResponseBody {
  readonly success: boolean
  readonly logId: string
  readonly status: 'sent' | 'failed' | 'skipped'
  readonly retryCount: number
}

export class EmailServiceClient implements IEmailSender {
  private readonly baseUrl: string
  private readonly apiKey: string

  public constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.apiKey = apiKey
  }

  public static fromEnv(): EmailServiceClient | null {
    const baseUrl = process.env.EMAIL_SERVICE_URL?.trim() ?? ''
    const apiKey = process.env.EMAIL_SERVICE_API_KEY?.trim() ?? ''
    if (!baseUrl || !apiKey) return null
    return new EmailServiceClient(baseUrl, apiKey)
  }

  public async sendTemplate(
    templateName: EmailTemplateName,
    data: Record<string, unknown>,
    recipient: EmailAddress,
    recipientId: string,
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': this.apiKey,
        },
        body: JSON.stringify({
          templateName,
          recipient,
          recipientId,
          data,
        }),
      })
      if (!response.ok) {
        const body = await response.text().catch(() => '')
        console.error(`[EMAIL] EmailService ${response.status} for '${templateName}': ${body.substring(0, 200)}`)
        return false
      }
      const parsed = (await response.json()) as SendEmailResponseBody
      return parsed.success
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown'
      console.error(`[EMAIL] EmailService call failed for '${templateName}':`, message)
      return false
    }
  }
}
