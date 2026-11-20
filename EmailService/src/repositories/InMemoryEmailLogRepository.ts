import type { EmailLogRecord } from '../types/EmailTypes'
import type { IEmailLogRepository } from './IEmailLogRepository'

export class InMemoryEmailLogRepository implements IEmailLogRepository {
  private readonly records: EmailLogRecord[] = []

  public async write(record: EmailLogRecord): Promise<void> {
    this.records.push(record)
  }

  public async listAll(limit: number): Promise<readonly EmailLogRecord[]> {
    return this.records
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
  }

  public async listByRecipient(recipientId: string, limit: number): Promise<readonly EmailLogRecord[]> {
    return this.records.filter((row) => row.recipientId === recipientId).slice(0, limit)
  }
}
