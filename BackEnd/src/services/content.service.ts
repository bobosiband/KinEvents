import { randomUUID } from 'crypto'

import { getData, persistData } from '../config/db'
import type { ContentBlockKey, IContentBlock } from '../interfaces/content.interface'

export class ContentService {
  async listContent(): Promise<IContentBlock[]> {
    return getData().content
  }

  async getContent(key: ContentBlockKey): Promise<IContentBlock | undefined> {
    return getData().content.find((contentBlock) => contentBlock.key === key)
  }

  async upsertContent(key: ContentBlockKey, value: string, updatedBy: string): Promise<IContentBlock> {
    const db = getData()
    const existing = db.content.find((contentBlock) => contentBlock.key === key)
    const block: IContentBlock = {
      key,
      value,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || randomUUID(),
    }
    if (existing) {
      Object.assign(existing, block)
    } else {
      db.content.push(block)
    }
    await persistData()
    return block
  }
}

export const contentService = new ContentService()