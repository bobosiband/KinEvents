import type { EmailService } from '../services/EmailService'

export class LogsHandler {
  private static readonly DefaultLimit: number = 50
  private static readonly MaxLimit: number = 200

  public constructor(private readonly service: EmailService) {}

  public async handle(query: Record<string, string | undefined>): Promise<unknown> {
    const recipientId = query['recipientId']
    const limit = this.parseLimit(query['limit'])
    const logs = recipientId
      ? await this.service.logsByRecipient(recipientId, limit)
      : await this.service.logsAll(limit)
    return { logs, count: logs.length }
  }

  private parseLimit(raw: string | undefined): number {
    if (!raw) return LogsHandler.DefaultLimit
    const parsed = Number(raw)
    if (!Number.isFinite(parsed) || parsed <= 0) return LogsHandler.DefaultLimit
    return Math.min(parsed, LogsHandler.MaxLimit)
  }
}
