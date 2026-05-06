import { randomUUID } from 'crypto'

import type { ContentBlockKey, IContentBlock } from '../interfaces/content.interface'
import { contentRepository } from '../repositories/content.repository'

export class ContentService {
  /**
   * Returns every stored content block.
    * @returns All content blocks.
   */
  listContent(): IContentBlock[] {
    return contentRepository.findAll()
  }

  /**
   * Looks up a content block by key.
    * @param key Content block key.
    * @returns The matching content block, or undefined when no match exists.
   */
  getContent(key: ContentBlockKey): IContentBlock | undefined {
    return contentRepository.findByKey(key)
  }

  /**
   * Creates or updates a content block.
    * @param key Content block key.
    * @param value Content value.
    * @param updatedBy Identifier for the editor.
    * @returns The stored content block.
   */
  upsertContent(key: ContentBlockKey, value: string, updatedBy: string): IContentBlock {
    const contentBlock: IContentBlock = {
      key,
      value,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || randomUUID(),
    }

    return contentRepository.upsert(contentBlock)
  }
}

export const contentService = new ContentService()