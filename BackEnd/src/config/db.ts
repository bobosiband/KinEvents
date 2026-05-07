import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, resolve } from 'path'

import { MongoClient, type Db } from 'mongodb'

import type { IAccessRequest } from '../interfaces/auth.interface'
import type { IContentBlock } from '../interfaces/content.interface'
import type { IEvent } from '../interfaces/event.interface'
import type { INotification } from '../interfaces/notification.interface'
import type { IUser } from '../interfaces/user.interface'

export interface DbSchema {
  users: IUser[]
  events: IEvent[]
  accessRequests: IAccessRequest[]
  notifications: INotification[]
  content: IContentBlock[]
}

function getJsonDbFilePath() {
  if (process.env.LOCAL_DB_PATH?.trim()) {
    return resolve(process.env.LOCAL_DB_PATH)
  }

  if (process.env.AWS_SAM_LOCAL === 'true' || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return resolve('/tmp', 'kinevents', 'db.json')
  }

  return resolve(process.cwd(), 'data', 'db.json')
}

const defaultData: DbSchema = {
  users: [],
  events: [],
  accessRequests: [],
  notifications: [],
  content: [],
}

const collectionNames: Array<keyof DbSchema> = ['users', 'events', 'accessRequests', 'notifications', 'content']

mkdirSync(dirname(getJsonDbFilePath()), { recursive: true })

type DatabaseAdapter = {
  data: DbSchema
  ready: Promise<void>
  write(): void | Promise<void>
}

class JsonDatabase {
  data: DbSchema = { ...defaultData }
  readonly ready = Promise.resolve()

  constructor(private readonly filePath: string) {}

  read() {
    if (!existsSync(this.filePath)) {
      this.write()
      return this
    }

    try {
      const fileContents = readFileSync(this.filePath, 'utf8')
      const parsedData = fileContents.trim() ? (JSON.parse(fileContents) as Partial<DbSchema>) : {}

      this.data = {
        ...defaultData,
        ...parsedData,
      }
    } catch {
      this.data = { ...defaultData }
      this.write()
    }

    return this
  }

  write(): void {
    mkdirSync(dirname(this.filePath), { recursive: true })
    writeFileSync(this.filePath, `${JSON.stringify(this.data, null, 2)}\n`)
  }
}

class MongoDatabase implements DatabaseAdapter {
  data: DbSchema = { ...defaultData }
  readonly ready: Promise<void>

  private client: MongoClient | null = null
  private database: Db | null = null
  private persistQueue: Promise<void> = Promise.resolve()

  constructor(private readonly uri: string, private readonly databaseName: string) {
    this.ready = this.initialize()
  }

  private async initialize() {
    this.client = new MongoClient(this.uri)
    await this.client.connect()
    this.database = this.client.db(this.databaseName)

    const loadedCollections = await Promise.all(
      collectionNames.map(async (collectionName) => [collectionName, await this.collection(collectionName).find().toArray()] as const)
    )

    this.data = { ...defaultData }
    const mutableData = this.data as Record<keyof DbSchema, unknown[]>
    for (const [collectionName, documents] of loadedCollections) {
      mutableData[collectionName] = documents as unknown[]
    }
  }

  private collection<T extends import('mongodb').Document>(collectionName: keyof DbSchema) {
    if (!this.database) {
      throw new Error('Mongo database is not ready')
    }

    return this.database.collection<T>(String(collectionName))
  }

  private async persist() {
    if (!this.database) {
      throw new Error('Mongo database is not ready')
    }

    await Promise.all(
      collectionNames.map(async (collectionName) => {
        const collection = this.collection(collectionName)
        await collection.deleteMany({})

        const documents = this.data[collectionName]
        if (documents.length > 0) {
          await collection.insertMany(documents as never[])
        }
      })
    )
  }

  write() {
    this.persistQueue = this.persistQueue.then(() => this.persist())
    return this.persistQueue
  }
}

const useMongoDatabase = process.env.NODE_ENV !== 'test' && Boolean(process.env.MONGODB_URI?.trim())
const allowJsonFallback =
  process.env.NODE_ENV === 'development' ||
  Boolean(process.env.LOCAL_DB_PATH?.trim()) ||
  process.env.AWS_SAM_LOCAL === 'true' ||
  Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
  Boolean(process.env.AWS_REGION)

// Proxy wrapper that delegates to an active adapter which can be swapped
class ProxyDatabase implements DatabaseAdapter {
  private _active: DatabaseAdapter
  readonly ready: Promise<void>

  constructor() {
    // start with JSON DB snapshot
    this._active = new JsonDatabase(getJsonDbFilePath()).read()

    if (useMongoDatabase) {
      const mongoDb = new MongoDatabase(process.env.MONGODB_URI!, process.env.MONGODB_DB_NAME?.trim() || 'kinevents')

      this.ready = Promise.race([
        mongoDb.ready,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('MongoDB connection timeout')), 28000)),
      ]).then(
        () => {
          // eslint-disable-next-line no-console
          console.log('[DB] MongoDB connected successfully')
          // copy any data that was written to the JSON DB while Mongo was connecting
          mongoDb.data = this._active.data
          this._active = mongoDb
        },
        (err) => {
          if (!allowJsonFallback) throw err
          // eslint-disable-next-line no-console
          console.warn('[DB] MongoDB failed, using JSON database:', err.message)
          // _active already points to JsonDatabase, nothing to do
        }
      )
    } else {
      // eslint-disable-next-line no-console
      console.log('[DB] Using JSON database')
      this.ready = Promise.resolve()
    }
  }

  get data(): DbSchema {
    return this._active.data
  }

  set data(value: DbSchema) {
    this._active.data = value
  }

  write() {
    return this._active.write()
  }
}

export const db = new ProxyDatabase()
export const dbReady = db.ready

export default db