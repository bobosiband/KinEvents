import { db, type DbSchema } from '../config/db'
import type { MaybePromise } from '../interfaces/db.interface'

export abstract class BaseRepository<TKey extends keyof DbSchema, TItem extends { id: string }> {
  protected constructor(private readonly collectionName: TKey) {}

  protected get items(): TItem[] {
    return db.data![this.collectionName] as unknown as TItem[]
  }

  /**
   * Returns a shallow copy of every record in the collection.
    * @returns All records in the collection.
   */
  findAll(): TItem[] {
    return [...this.items]
  }

  /**
   * Looks up a record by id.
    * @param id Record identifier.
    * @returns The matching record, or undefined when no match exists.
   */
  findById(id: string): TItem | undefined {
    return this.items.find((item) => item.id === id)
  }

  /**
   * Returns every record that matches the supplied predicate.
    * @param predicate Filtering callback.
    * @returns Every record that satisfies the predicate.
   */
  findWhere(predicate: (item: TItem) => boolean): TItem[] {
    return this.items.filter(predicate)
  }

  /**
   * Inserts a new record into the collection.
    * @param item Record to persist.
    * @returns The inserted record.
   */
  insert(item: TItem): MaybePromise<TItem> {
    this.items.push(item)

    const writeResult = db.write()
    if (writeResult instanceof Promise) {
      return writeResult.then(() => {
        console.log(`[DB] Persisted ${String(this.collectionName)} after insert`)
        return item
      })
    }

    console.log(`[DB] Persisted ${String(this.collectionName)} after insert`)
    return item
  }

  /**
   * Applies a partial update to an existing record.
    * @param id Record identifier.
    * @param patch Fields to merge into the record.
    * @returns The updated record, or null when no record exists.
   */
  update(id: string, patch: Partial<TItem>): MaybePromise<TItem | null> {
    const item = this.findById(id)

    if (!item) {
      return null
    }

    Object.assign(item, patch)

    const writeResult = db.write()
    if (writeResult instanceof Promise) {
      return writeResult.then(() => {
        console.log(`[DB] Persisted ${String(this.collectionName)} after update`)
        return item
      })
    }

    console.log(`[DB] Persisted ${String(this.collectionName)} after update`)
    return item
  }

  /**
   * Removes a record from the collection.
    * @param id Record identifier.
    * @returns True when a record was removed, otherwise false.
   */
  remove(id: string): MaybePromise<boolean> {
    const index = this.items.findIndex((item) => item.id === id)

    if (index < 0) {
      return false
    }

    this.items.splice(index, 1)

    const writeResult = db.write()
    if (writeResult instanceof Promise) {
      return writeResult.then(() => {
        console.log(`[DB] Persisted ${String(this.collectionName)} after delete`)
        return true
      })
    }

    console.log(`[DB] Persisted ${String(this.collectionName)} after delete`)
    return true
  }
}