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

const dbFilePath = resolve(process.cwd(), 'data', 'db.json')

const defaultData: DbSchema = {
  users: [],
  events: [],
  accessRequests: [],
  notifications: [],
  content: [],
}

const collectionNames: Array<keyof DbSchema> = ['users', 'events', 'accessRequests', 'notifications', 'content']

mkdirSync(dirname(dbFilePath), { recursive: true })

type DatabaseAdapter = {
  data: DbSchema
  ready: Promise<void>
  write(): void | Promise<void>
}

class JsonDatabase {
  data: DbSchema = { ...defaultData }
  readonly ready = Promise.resolve()

  read() {
    if (!existsSync(dbFilePath)) {
      this.write()
      return this
    }

    try {
      const fileContents = readFileSync(dbFilePath, 'utf8')
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
    writeFileSync(dbFilePath, `${JSON.stringify(this.data, null, 2)}\n`)
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

// Initialize database synchronously to avoid export timing issues
let database: DatabaseAdapter = new JsonDatabase().read()
let readyPromise: Promise<void> = Promise.resolve()

if (useMongoDatabase) {
  // Try MongoDB; fall back to JSON if it times out
  const mongoDb = new MongoDatabase(process.env.MONGODB_URI!, process.env.MONGODB_DB_NAME?.trim() || 'kinevents')
  
  readyPromise = Promise.race([
    mongoDb.ready,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('MongoDB connection timeout')), 5000))
  ]).then(
    () => {
      database = mongoDb
    },
    (err) => {
      // eslint-disable-next-line no-console
      console.warn('MongoDB connection failed, using JSON database:', err.message)
      database = new JsonDatabase().read()
    }
  )
}

export const db = database
export const dbReady = readyPromise

export default db