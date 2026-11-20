import { randomUUID } from 'crypto'
import { AppConfig } from '../config/AppConfig'
import { EmailDispatchError } from '../errors/DomainError'
import type { IEmailLogRepository } from '../repositories/IEmailLogRepository'
import type { TemplateRegistry } from '../templates/TemplateRegistry'
import type { EmailLogRecord, SendEmailRequest, SendEmailResult } from '../types/EmailTypes'
import type { ITransport } from './ITransport'

export class EmailService {
  public constructor(
    private readonly transport: ITransport,
    private readonly repository: IEmailLogRepository,
    private readonly templates: TemplateRegistry,
  ) {}

  public async send(request: SendEmailRequest): Promise<SendEmailResult> {
    const template = this.templates.get(request.templateName)
    const rendered = template.render(request.data)
    const fromAddress = `${AppConfig.emailFromName} <${AppConfig.gmailUser}>`
    const to = `${request.recipient.name} <${request.recipient.email}>`
    const createdAt = new Date().toISOString()
    const expiresAt = Math.floor(Date.now() / 1000) + AppConfig.emailLogsRetentionDays * 86400

    let attempt = 0
    let lastError: Error | undefined
    while (attempt < AppConfig.maxRetries) {
      attempt++
      try {
        await this.transport.send({
          from: fromAddress,
          to,
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
          replyTo: request.replyTo,
        })
        const record: EmailLogRecord = {
          id: randomUUID(),
          templateName: request.templateName,
          recipientId: request.recipientId,
          recipientEmail: request.recipient.email,
          subject: rendered.subject,
          status: 'sent',
          sentAt: new Date().toISOString(),
          createdAt,
          retryCount: attempt - 1,
          expiresAt,
        }
        await this.repository.write(record)
        return { success: true, logId: record.id, status: 'sent', retryCount: attempt - 1 }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        if (attempt < AppConfig.maxRetries) {
          await this.wait(AppConfig.retryBaseDelayMs * Math.pow(2, attempt - 1))
        }
      }
    }

    const record: EmailLogRecord = {
      id: randomUUID(),
      templateName: request.templateName,
      recipientId: request.recipientId,
      recipientEmail: request.recipient.email,
      subject: rendered.subject,
      status: 'failed',
      error: (lastError?.message ?? 'Unknown error').substring(0, 500),
      createdAt,
      retryCount: attempt - 1,
      expiresAt,
    }
    await this.repository.write(record)
    throw new EmailDispatchError(`Failed to send '${request.templateName}' after ${attempt} attempts: ${lastError?.message ?? 'unknown'}`)
  }

  public async verify(): Promise<void> {
    await this.transport.verify()
  }

  public async logsAll(limit: number): Promise<readonly EmailLogRecord[]> {
    return this.repository.listAll(limit)
  }

  public async logsByRecipient(recipientId: string, limit: number): Promise<readonly EmailLogRecord[]> {
    return this.repository.listByRecipient(recipientId, limit)
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
