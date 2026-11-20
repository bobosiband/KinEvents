import { EmailServiceClient } from './EmailServiceClient'
import type {
  EmailPayload,
  EmailTemplateName,
  EmailAddress,
  EmailLogEntry,
  TemplateContext,
} from '../interfaces/email.interface'

/**
 * Thin wrapper over EmailServiceClient. All outbound email is routed through
 * the standalone EmailService stack; this process never opens its own SMTP
 * transport and never writes email logs into Mongo. If the EmailService
 * client is unreachable or not configured, every send logs and returns
 * false — no email failure ever throws into a user request.
 */
export class EmailService {
  private readonly client: EmailServiceClient | null = EmailServiceClient.fromEnv()

  public async sendTemplate<T extends TemplateContext>(
    templateName: EmailTemplateName,
    context: T,
    recipient: EmailAddress,
    recipientId: string,
  ): Promise<boolean> {
    if (process.env.NODE_ENV === 'test') return true
    if (!this.client) {
      console.warn(`[EMAIL] Skipping '${templateName}' — EMAIL_SERVICE_URL/EMAIL_SERVICE_API_KEY not configured`)
      return false
    }
    return this.client.sendTemplate(templateName, context as Record<string, unknown>, recipient, recipientId)
  }

  public async send(payload: EmailPayload, meta: { templateName: EmailTemplateName; recipientId: string }): Promise<boolean> {
    const recipient = Array.isArray(payload.to) ? payload.to[0] : payload.to
    return this.sendTemplate(meta.templateName, {} as TemplateContext, recipient, meta.recipientId)
  }

  public async getEmailLogs(recipientId?: string): Promise<readonly EmailLogEntry[]> {
    if (!this.client) return []
    return this.client.fetchLogs(recipientId ? { recipientId } : undefined)
  }
}

export const emailService: EmailService = new EmailService()
