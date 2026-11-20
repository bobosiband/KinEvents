import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { AppConfig } from '../config/AppConfig'
import type { EmailLogRecord } from '../types/EmailTypes'
import type { IEmailLogRepository } from './IEmailLogRepository'

export class DynamoEmailLogRepository implements IEmailLogRepository {
  private readonly client: DynamoDBDocumentClient
  private readonly tableName: string

  public constructor(client?: DynamoDBDocumentClient, tableName?: string) {
    this.client = client ?? DynamoDBDocumentClient.from(new DynamoDBClient({ region: AppConfig.awsRegion }))
    this.tableName = tableName ?? AppConfig.emailLogsTable
  }

  public async write(record: EmailLogRecord): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: { ...record },
      }),
    )
  }

  public async listAll(limit: number): Promise<readonly EmailLogRecord[]> {
    const result = await this.client.send(
      new ScanCommand({
        TableName: this.tableName,
        Limit: limit,
      }),
    )
    const items = (result.Items ?? []) as EmailLogRecord[]
    return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  public async listByRecipient(recipientId: string, limit: number): Promise<readonly EmailLogRecord[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'byRecipient',
        KeyConditionExpression: 'recipientId = :rid',
        ExpressionAttributeValues: { ':rid': recipientId },
        Limit: limit,
        ScanIndexForward: false,
      }),
    )
    return (result.Items ?? []) as EmailLogRecord[]
  }
}
