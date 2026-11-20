import { ValidationError } from '../errors/DomainError'
import type { EmailService } from '../services/EmailService'
import type { EmailTemplateName, SendEmailRequest } from '../types/EmailTypes'

export class SendEmailHandler {
  public constructor(private readonly service: EmailService) {}

  public async handle(body: unknown): Promise<unknown> {
    const parsed = this.parse(body)
    const result = await this.service.send(parsed)
    return result
  }

  private parse(body: unknown): SendEmailRequest {
    if (!body || typeof body !== 'object') {
      throw new ValidationError('Request body must be a JSON object')
    }
    const b = body as Record<string, unknown>
    const templateName = this.requireString(b, 'templateName') as EmailTemplateName
    const recipientId = this.requireString(b, 'recipientId')
    const recipientRaw = b['recipient']
    if (!recipientRaw || typeof recipientRaw !== 'object') {
      throw new ValidationError('recipient must be an object with name and email')
    }
    const r = recipientRaw as Record<string, unknown>
    const recipient = {
      name: this.requireString(r, 'name'),
      email: this.requireString(r, 'email'),
    }
    const data = (b['data'] ?? {}) as Record<string, unknown>
    const replyTo = typeof b['replyTo'] === 'string' ? (b['replyTo'] as string) : undefined
    return { templateName, recipient, recipientId, data, replyTo }
  }

  private requireString(obj: Record<string, unknown>, key: string): string {
    const value = obj[key]
    if (typeof value !== 'string' || value.length === 0) {
      throw new ValidationError(`Missing required string field '${key}'`)
    }
    return value
  }
}
