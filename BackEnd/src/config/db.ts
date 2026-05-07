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
  // Check for a packaged seed file (used when we include data/db.json in the package)
  const seedPath = resolve(__dirname, '../../..', 'data', 'db.json')
  if (existsSync(seedPath)) {
    // If running inside Lambda (or SAM local), the package area is read-only.
    // Copy the packaged seed into /tmp and use that writable path instead.
    if (process.env.AWS_SAM_LOCAL === 'true' || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME)) {
      const tmpDir = resolve('/tmp', 'kinevents')
      const tmpPath = resolve(tmpDir, 'db.json')
      try {
        mkdirSync(tmpDir, { recursive: true })
        if (!existsSync(tmpPath)) {
          const contents = readFileSync(seedPath, 'utf8')
          writeFileSync(tmpPath, contents)
          console.log('[DB] 📦 Copied seed data to writable /tmp path:', tmpPath)
        } else {
          console.log('[DB] 📦 Writable seed already exists at /tmp:', tmpPath)
        }
        return tmpPath
      } catch (err) {
        console.warn('[DB] ⚠️ Failed to copy seed to /tmp, will attempt to use packaged seed:', err instanceof Error ? err.message : err)
        return seedPath
      }
    }

    console.log('[DB] 📦 Found seed file:', seedPath)
    return seedPath
  }

  // Fallback: use /tmp for ephemeral storage (if seed doesn't exist)
  if (process.env.AWS_SAM_LOCAL === 'true' || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME)) {
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

const collectionNames: Array<keyof DbSchema> = [
  'users',
  'events',
  'accessRequests',
  'notifications',
  'content',
]

type DatabaseAdapter = {
  data: DbSchema
  ready: Promise<void>
  write(): void | Promise<void>
}

class JsonDatabase implements DatabaseAdapter {
  data: DbSchema = { ...defaultData }

  readonly ready = Promise.resolve()

  constructor(private readonly filePath: string) {}

  read() {
    mkdirSync(dirname(this.filePath), { recursive: true })

    if (!existsSync(this.filePath)) {
      this.write()
      return this
    }

    try {
      const fileContents = readFileSync(this.filePath, 'utf8')

      const parsedData = fileContents.trim()
        ? (JSON.parse(fileContents) as Partial<DbSchema>)
        : {}

      this.data = {
        ...defaultData,
        ...parsedData,
      }
    } catch (error) {
      console.error('[DB] Failed to read JSON database:', error)

      this.data = { ...defaultData }

      this.write()
    }

    console.log('[DB] JSON users loaded:', this.data.users.length)

    return this
  }

  write(): void {
    try {
      mkdirSync(dirname(this.filePath), { recursive: true })

      writeFileSync(
        this.filePath,
        `${JSON.stringify(this.data, null, 2)}\n`
      )
    } catch (err) {
      console.warn('[DB] ⚠️ Failed to write JSON database:', err instanceof Error ? err.message : err)
    }
  }
}

class MongoDatabase implements DatabaseAdapter {
  data: DbSchema = { ...defaultData }

  readonly ready: Promise<void>

  private client: MongoClient | null = null
  private database: Db | null = null
  private persistQueue: Promise<void> = Promise.resolve()

  constructor(
    private readonly uri: string,
    private readonly databaseName: string
  ) {
    this.ready = this.initialize()
  }

  private async initialize() {
    console.log('[DB] Connecting to MongoDB...')

    this.client = new MongoClient(this.uri)

    await this.client.connect()

    this.database = this.client.db(this.databaseName)

    console.log('[DB] MongoDB connected')

    const loadedCollections = await Promise.all(
      collectionNames.map(async (collectionName) => {
        const documents = await this.collection(collectionName)
          .find({})
          .toArray()

        console.log(
          `[DB] Loaded ${documents.length} documents from ${collectionName}`
        )

        return [collectionName, documents] as const
      })
    )

    const nextData: DbSchema = {
      users: [],
      events: [],
      accessRequests: [],
      notifications: [],
      content: [],
    }

    for (const [collectionName, documents] of loadedCollections) {
      nextData[collectionName] = documents as never[]
    }

    this.data = nextData

    console.log('[DB] Mongo users available:', this.data.users.length)
  }

  private collection<T extends import('mongodb').Document>(
    collectionName: keyof DbSchema
  ) {
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

const useMongoDatabase =
  process.env.NODE_ENV !== 'test' &&
  Boolean(process.env.MONGODB_URI?.trim())

const allowJsonFallback =
  process.env.NODE_ENV === 'development' ||
  Boolean(process.env.LOCAL_DB_PATH?.trim()) ||
  process.env.AWS_SAM_LOCAL === 'true' || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME)

class ProxyDatabase implements DatabaseAdapter {
  private activeAdapter: DatabaseAdapter
  private adapterType: 'json' | 'mongo' = 'json'
  private isReady = false

  readonly ready: Promise<void>

  constructor() {
    const jsonDb = new JsonDatabase(getJsonDbFilePath()).read()

    this.activeAdapter = jsonDb
    this.adapterType = 'json'

    if (!useMongoDatabase) {
      console.log('[DB] ✓ Using JSON database only')
      console.log(`[DB] 📁 Path: ${getJsonDbFilePath()}`)
      console.log(`[DB] 👥 Users: ${this.activeAdapter.data.users.length}`)

      this.ready = Promise.resolve()
      this.isReady = true

      return
    }

    console.log('[DB] 🔄 MongoDB initialization starting...')
    console.log(`[DB] 🌐 URI: ${process.env.MONGODB_URI?.substring(0, 30)}...`)

    const mongoDb = new MongoDatabase(
      process.env.MONGODB_URI!,
      process.env.MONGODB_DB_NAME?.trim() || 'kinevents'
    )

    const mongoTimeoutMs = parseInt(process.env.MONGO_CONNECT_TIMEOUT_MS || '30000', 10)
    
    this.ready = Promise.race([
      mongoDb.ready,
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`MongoDB connection timeout (${mongoTimeoutMs}ms)`))
        }, mongoTimeoutMs)
      }),
    ]).then(
      async () => {
        // CRITICAL: DO NOT copy JSON data into MongoDB.
        // MongoDB has already loaded the real production database.
        // Simply switch the active adapter reference.

        console.log('[DB] ✓ MongoDB connected successfully')
        console.log(`[DB] 👥 Users: ${mongoDb.data.users.length}`)
        console.log(
          '[DB] 📊 Collections loaded:',
          {
            users: mongoDb.data.users.length,
            events: mongoDb.data.events.length,
            accessRequests: mongoDb.data.accessRequests.length,
            notifications: mongoDb.data.notifications.length,
            content: mongoDb.data.content.length,
          }
        )

        // CACHE MongoDB data to JSON file as fallback
        // If MongoDB times out on next request, we have cached data
        try {
          jsonDb.data = mongoDb.data
          jsonDb.write()
          console.log('[DB] 💾 Cached MongoDB data to JSON file for fallback')
        } catch (cacheError) {
          console.warn('[DB] ⚠️  Failed to cache MongoDB data:', cacheError instanceof Error ? cacheError.message : cacheError)
        }

        this.activeAdapter = mongoDb
        this.adapterType = 'mongo'
        this.isReady = true

        console.log('[DB] 🔀 Switched from JSON to MongoDB adapter')
      },
      async (error) => {
        console.warn(
          '[DB] ⚠️  MongoDB connection failed:',
          error instanceof Error ? error.message : error
        )
        console.warn('[DB] 📌 Falling back to JSON database')

        if (!allowJsonFallback) {
          console.error('[DB] ❌ JSON fallback not allowed. Throwing error.')
          throw error
        }

        this.isReady = true
      }
    )
  }

  /**
   * Gets the active adapter type for diagnostics.
   */
  getAdapterType(): 'json' | 'mongo' {
    return this.adapterType
  }

  /**
   * Returns true if database is fully initialized.
   */
  getReadyState(): boolean {
    return this.isReady
  }

  get data(): DbSchema {
    return this.activeAdapter.data
  }

  set data(value: DbSchema) {
    this.activeAdapter.data = value
  }

  write() {
    return this.activeAdapter.write()
  }
}

/**
 * Singleton instance of ProxyDatabase.
 * Exported as const to prevent accidental reassignment.
 * All routes must import this instance, not create new ones.
 */
export const db = new ProxyDatabase()

export const dbReady = db.ready

export default db