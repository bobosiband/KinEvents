import { randomUUID } from 'crypto'
import { readData, persistData } from '../config/db'
import { getTransport, getFromAddress } from '../config/email.config'
import { EmailServiceClient } from './EmailServiceClient'
import type {
  EmailPayload,
  EmailTemplateName,
  EmailAddress,
  EmailLogEntry,
  TemplateContext,
} from '../interfaces/email.interface'

export class EmailService {
  private readonly client: EmailServiceClient | null = EmailServiceClient.fromEnv()

  async send(payload: EmailPayload, meta: { templateName: EmailTemplateName; recipientId: string }): Promise<boolean> {
    if (process.env.NODE_ENV === 'test') {
      const to = Array.isArray(payload.to) ? payload.to[0] : payload.to
      await this.logEmail({
        templateName: meta.templateName,
        recipientId: meta.recipientId,
        recipientEmail: to.email,
        subject: payload.subject,
        status: 'skipped',
        createdAt: new Date().toISOString(),
        retryCount: 0,
      })
      return true
    }

    const transport = getTransport()
    if (!transport) {
      const to = Array.isArray(payload.to) ? payload.to[0] : payload.to
      await this.logEmail({
        templateName: meta.templateName,
        recipientId: meta.recipientId,
        recipientEmail: to.email,
        subject: payload.subject,
        status: 'skipped',
        createdAt: new Date().toISOString(),
        retryCount: 0,
      })
      return false
    }

    try {
      const to = Array.isArray(payload.to) ? payload.to.map((a) => `${a.name} <${a.email}>`) : `${payload.to.name} <${payload.to.email}>`
      const recipientEmail = Array.isArray(payload.to) ? payload.to[0].email : payload.to.email

      console.log(`[EMAIL] Sending '${meta.templateName}' to ${meta.recipientId}`)

      await transport.sendMail({
        from: `${process.env.EMAIL_FROM_NAME || 'KinEvents'} <${getFromAddress()}>`,
        to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        replyTo: payload.replyTo,
      })

      const sentAt = new Date().toISOString()
      await this.logEmail({
        templateName: meta.templateName,
        recipientId: meta.recipientId,
        recipientEmail,
        subject: payload.subject,
        status: 'sent',
        sentAt,
        createdAt: sentAt,
        retryCount: 0,
      })

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const to = Array.isArray(payload.to) ? payload.to[0] : payload.to

      console.error(`[EMAIL] Failed to send '${meta.templateName}':`, errorMessage)

      await this.logEmail({
        templateName: meta.templateName,
        recipientId: meta.recipientId,
        recipientEmail: to.email,
        subject: payload.subject,
        status: 'failed',
        error: errorMessage.substring(0, 500),
        createdAt: new Date().toISOString(),
        retryCount: 0,
      })

      return false
    }
  }

  async sendTemplate<T extends TemplateContext>(
    templateName: EmailTemplateName,
    context: T,
    recipient: EmailAddress,
    recipientId: string
  ): Promise<boolean> {
    if (this.client && process.env.NODE_ENV !== 'test') {
      return this.client.sendTemplate(templateName, context as Record<string, unknown>, recipient, recipientId)
    }

    let template
    try {
      template = await import(`../templates/email/${templateName}`)
    } catch (error) {
      console.error(`[EMAIL] Template not found: ${templateName}`, error)
      return false
    }

    if (!template.render) {
      console.error(`[EMAIL] Template ${templateName} does not export render function`)
      return false
    }

    const { subject, html, text } = template.render(context)

    return this.send(
      {
        to: recipient,
        subject,
        html,
        text,
      },
      { templateName, recipientId }
    )
  }

  private async logEmail(entry: Omit<EmailLogEntry, 'id' | 'createdAt'> & { createdAt: string }): Promise<void> {
    const logEntry: EmailLogEntry = {
      id: randomUUID(),
      ...entry,
    }
    const db = await readData()
    db.emailLogs.push(logEntry)
    await persistData()
  }

  async getEmailLogs(recipientId?: string): Promise<EmailLogEntry[]> {
    const db = await readData()
    const logs = db.emailLogs
    if (recipientId) {
      return logs.filter((log) => log.recipientId === recipientId)
    }
    return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  async resend(logEntryId: string): Promise<boolean> {
    const db = await readData()
    const logs = db.emailLogs
    const logEntry = logs.find((log) => log.id === logEntryId)

    if (!logEntry) {
      console.error(`[EMAIL] Log entry not found: ${logEntryId}`)
      return false
    }

    logEntry.retryCount += 1
    console.log(`[EMAIL] Retry attempt ${logEntry.retryCount} for log ${logEntryId}`)

    try {
      if (this.client && process.env.NODE_ENV !== 'test') {
        logEntry.status = 'skipped'
        await persistData()
        return false
      }

      const transport = getTransport()
      if (!transport) {
        logEntry.status = 'skipped'
        await persistData()
        return false
      }

      if (!logEntry.recipientEmail) {
        console.warn(`[EMAIL] Recipient email missing for retry log ${logEntryId}`)
        logEntry.status = 'skipped'
        await persistData()
        return false
      }

      await persistData()
      return true
    } catch (error) {
      console.error(`[EMAIL] Resend failed for log ${logEntryId}:`, error)
      return false
    }
  }
}

export const emailService = new EmailService()
