import type {
  Collection,
  Filter,
  IndexSpecification,
  CreateIndexesOptions,
  OptionalUnlessRequiredId,
  Sort,
  UpdateFilter,
} from 'mongodb'

import type { MongoConnection } from './MongoConnection'

export interface ISoftDeletable {
  id: string
  deletedAt?: string | null
}

export interface IFindOptions {
  readonly includeDeleted?: boolean
  readonly limit?: number
  readonly sort?: Sort
}

export interface IIndexSpec {
  readonly spec: IndexSpecification
  readonly options?: CreateIndexesOptions
}

/**
 * Thin typed wrapper over a Mongo collection. Subclasses declare their
 * collection name and index spec; this class lazily ensures indexes on
 * first access and applies the `{ deletedAt: null }` soft-delete filter
 * on every read unless the caller opts in via options.includeDeleted.
 *
 * Write methods are intentionally narrow — insertOne, updateOne (targeted
 * $set/$inc/$push through UpdateFilter), softDelete, restore. There is no
 * replaceOne path.
 */
export abstract class BaseRepository<T extends ISoftDeletable> {
  protected abstract readonly collectionName: string
  protected abstract readonly indexes: readonly IIndexSpec[]
  private indexesEnsured: boolean = false

  public constructor(protected readonly connection: MongoConnection) {}

  protected async collection(): Promise<Collection<T>> {
    const db = await this.connection.db()
    const coll = db.collection<T>(this.collectionName)
    if (!this.indexesEnsured && this.indexes.length > 0) {
      for (const idx of this.indexes) {
        try {
          await coll.createIndex(idx.spec, idx.options)
        } catch (error) {
          console.error(`[DB] Failed creating index on ${this.collectionName}:`, error)
        }
      }
      this.indexesEnsured = true
    }
    return coll
  }

  public async findById(id: string, options: IFindOptions = {}): Promise<T | null> {
    const coll = await this.collection()
    const filter = this.applySoftDelete({ id } as Filter<T>, options)
    return coll.findOne(filter) as Promise<T | null>
  }

  public async findOne(filter: Filter<T>, options: IFindOptions = {}): Promise<T | null> {
    const coll = await this.collection()
    return coll.findOne(this.applySoftDelete(filter, options)) as Promise<T | null>
  }

  public async findMany(filter: Filter<T>, options: IFindOptions = {}): Promise<readonly T[]> {
    const coll = await this.collection()
    const cursor = coll.find(this.applySoftDelete(filter, options))
    if (options.sort) cursor.sort(options.sort)
    if (options.limit) cursor.limit(options.limit)
    const result = await cursor.toArray()
    return result as T[]
  }

  public async insertOne(entity: T): Promise<void> {
    const coll = await this.collection()
    await coll.insertOne(entity as unknown as OptionalUnlessRequiredId<T>)
  }

  public async updateOne(id: string, update: UpdateFilter<T>): Promise<void> {
    const coll = await this.collection()
    await coll.updateOne({ id } as Filter<T>, update)
  }

  public async softDelete(id: string): Promise<void> {
    const now = new Date().toISOString()
    await this.updateOne(id, { $set: { deletedAt: now, updatedAt: now } } as unknown as UpdateFilter<T>)
  }

  public async restore(id: string): Promise<void> {
    const now = new Date().toISOString()
    await this.updateOne(id, { $set: { deletedAt: null, updatedAt: now } } as unknown as UpdateFilter<T>)
  }

  public async count(filter: Filter<T> = {} as Filter<T>, options: IFindOptions = {}): Promise<number> {
    const coll = await this.collection()
    return coll.countDocuments(this.applySoftDelete(filter, options))
  }

  private applySoftDelete(filter: Filter<T>, options: IFindOptions): Filter<T> {
    if (options.includeDeleted) return filter
    return { ...filter, deletedAt: { $in: [null, undefined] } } as Filter<T>
  }
}
