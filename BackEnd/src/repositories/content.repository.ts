import type { ContentBlockKey, IContentBlock } from '../interfaces/content.interface'
import { db } from '../config/db'

export class ContentRepository {
  /**
   * Returns every content block stored in the database.
    * @returns Every stored content block.
   */
  findAll(): IContentBlock[] {
    return [...db.data!.content]
  }

  /**
   * Looks up a content block by key.
    * @param key Content block key.
    * @returns The matching content block, or undefined when no match exists.
   */
  findByKey(key: ContentBlockKey): IContentBlock | undefined {
    return db.data!.content.find((block) => block.key === key)
  }

  /**
   * Inserts or replaces a content block.
    * @param block Content block to store.
    * @returns The stored content block.
   */
  upsert(block: IContentBlock): IContentBlock {
    const existingIndex = db.data!.content.findIndex((item) => item.key === block.key)

    if (existingIndex >= 0) {
      db.data!.content[existingIndex] = block
    } else {
      db.data!.content.push(block)
    }

    db.write()
    return block
  }

  /**
   * Removes a content block by key.
    * @param key Content block key.
    * @returns True when a content block was removed, otherwise false.
   */
  removeByKey(key: ContentBlockKey): boolean {
    const index = db.data!.content.findIndex((item) => item.key === key)

    if (index < 0) {
      return false
    }

    db.data!.content.splice(index, 1)
    db.write()
    return true
  }
}

export const contentRepository = new ContentRepository()