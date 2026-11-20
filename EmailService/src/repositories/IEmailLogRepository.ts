import type { EmailLogRecord } from '../types/EmailTypes'

export interface IEmailLogRepository {
  write(record: EmailLogRecord): Promise<void>
  listAll(limit: number): Promise<readonly EmailLogRecord[]>
  listByRecipient(recipientId: string, limit: number): Promise<readonly EmailLogRecord[]>
}
