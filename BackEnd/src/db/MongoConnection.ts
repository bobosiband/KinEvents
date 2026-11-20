import { MongoClient, type Db } from 'mongodb'

/**
 * Lazy MongoDB connection to the kinevents_v2 database (separate from the
 * live legacy `kinevents` database). Connects on first `db()` call and
 * caches the client. In test mode or without MONGODB_URI, every call
 * throws so repository code never accidentally reaches out — services
 * only touch MongoRepositories when featureFlags.useCollections is true.
 */
export class MongoConnection {
  private static instance: MongoConnection | null = null

  private readonly uri: string
  private readonly dbName: string
  private client: MongoClient | null = null
  private cached: Db | null = null
  private connecting: Promise<void> | null = null

  private constructor(uri: string, dbName: string) {
    this.uri = uri
    this.dbName = dbName
  }

  public static get(): MongoConnection {
    if (!MongoConnection.instance) {
      const uri = (process.env.MONGODB_URI ?? '').trim()
      const parentDb = (process.env.MONGODB_DB_NAME ?? 'kinevents').trim()
      const dbName = `${parentDb}_v2`
      if (!uri) {
        throw new Error('MONGODB_URI is required to open the kinevents_v2 connection')
      }
      MongoConnection.instance = new MongoConnection(uri, dbName)
    }
    return MongoConnection.instance
  }

  public async db(): Promise<Db> {
    if (this.cached) return this.cached
    if (!this.connecting) {
      this.connecting = (async () => {
        this.client = new MongoClient(this.uri, {
          serverSelectionTimeoutMS: 8000,
          connectTimeoutMS: 8000,
          maxPoolSize: 2,
        })
        await this.client.connect()
        this.cached = this.client.db(this.dbName)
      })()
    }
    await this.connecting
    if (!this.cached) throw new Error('kinevents_v2 database never initialised')
    return this.cached
  }

  public async close(): Promise<void> {
    if (this.client) {
      await this.client.close()
      this.client = null
      this.cached = null
      this.connecting = null
    }
  }

  public static resetForTesting(): void {
    MongoConnection.instance = null
  }
}
