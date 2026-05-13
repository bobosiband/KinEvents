import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

import { MongoClient } from 'mongodb'

import type { IAccessRequest } from '../interfaces/auth.interface'
import type { IContentBlock } from '../interfaces/content.interface'
import type { IEvent } from '../interfaces/event.interface'
import type { INotification } from '../interfaces/notification.interface'
import type { IUser } from '../interfaces/user.interface'
import type { IMessage } from '../interfaces/message.interface'
import type { EmailLogEntry } from '../interfaces/email.interface'

export interface DbSchema {
  users: IUser[]
  events: IEvent[]
  accessRequests: IAccessRequest[]
  accessRequestHistory: IAccessRequest[]
  notifications: INotification[]
  content: IContentBlock[]
  emailLogs: EmailLogEntry[]
  messages: IMessage[]
}

const isTestMode = process.env.NODE_ENV === 'test'

// Defer MongoClient creation until initData so SAM/local environments
// with partial env vars don't cause module-load failures.
let client: MongoClient | null = null
let mongoUri = process.env.MONGODB_URI?.trim()

const DB_NAME = process.env.MONGODB_DB_NAME?.trim() || 'kinevents'
const COLLECTION = 'datastore'
const DOCUMENT_NAME = 'appdata'

let data: DbSchema = {
  users: [],
  events: [],
  accessRequests: [],
  accessRequestHistory: [],
  notifications: [],
  content: [],
  emailLogs: [],
  messages: [],
}

let isConnected = false
let initPromise: Promise<void> | null = null
let initComplete = false

function getSeedData(): DbSchema {
  const seedPath = resolve(__dirname, '../../..', 'data', 'db.json')

  if (existsSync(seedPath)) {
    try {
      const raw = readFileSync(seedPath, 'utf8')
      const parsed = raw.trim() ? (JSON.parse(raw) as Partial<DbSchema>) : {}
      return normalizeDataShape(parsed)
    } catch (error) {
      console.error('[DB] Failed to load seed data:', error)
    }
  }

  return normalizeDataShape()
}

function normalizeDataShape(saved: Partial<DbSchema> = {}): DbSchema {
  return {
    users: Array.isArray(saved.users) ? saved.users : [],
    events: Array.isArray(saved.events) ? saved.events : [],
    accessRequests: Array.isArray(saved.accessRequests) ? saved.accessRequests : [],
    accessRequestHistory: Array.isArray(saved.accessRequestHistory) ? saved.accessRequestHistory : [],
    notifications: Array.isArray(saved.notifications) ? saved.notifications : [],
    content: Array.isArray(saved.content) ? saved.content : [],
    emailLogs: Array.isArray(saved.emailLogs) ? saved.emailLogs : [],
    messages: Array.isArray(saved.messages) ? saved.messages : [],
  }
}

export async function initData(): Promise<void> {
  if (initPromise) return initPromise

  // Store the init work in the promise so callers can await readiness.
  initPromise = (async () => {
    try {
      initComplete = false

      // Re-evaluate URI at init time (may be provided via SAM env overrides)
      mongoUri = process.env.MONGODB_URI?.trim()

      if (isTestMode || !mongoUri) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('MONGODB_URI is required in production')
        }

        console.log('[DB] Test mode or no MongoDB URI - using in-memory data store')
        data = getSeedData()
        initComplete = true
        return
      }

      // Lazily create client now that we have a URI and are not in test mode
      if (!client) {
        try {
          client = new MongoClient(mongoUri, {
            serverSelectionTimeoutMS: 8000,
            connectTimeoutMS: 8000,
          })
        } catch (err) {
          console.error('[DB] Invalid MONGODB_URI, falling back to in-memory store', err)
          client = null
          if (process.env.NODE_ENV === 'production') {
            throw err
          }
          // Non-production fallback: use in-memory store and mark initialized
          data = getSeedData()
          initComplete = true
          return
        }
      }

      if (!isConnected && client) {
        try {
          await client.connect()
          isConnected = true
          console.log('[DB] MongoDB connected')
        } catch (error) {
          client = null
          console.warn('[DB] MongoDB connect failed, using empty in-memory store', error)
          data = normalizeDataShape()

          if (process.env.NODE_ENV === 'production') {
            throw error
          }

          initComplete = true
          return
        }
      }

      const collection = client.db(DB_NAME).collection(COLLECTION)
      const saved = await collection.findOne({ name: DOCUMENT_NAME })

      if (saved) {
        data = normalizeDataShape(saved.data as Partial<DbSchema>)
        console.log('[DB] Data loaded - users:', data.users.length, 'events:', data.events.length)
        initComplete = true
        return
      }

      // No single-document datastore found. Attempt to migrate from legacy per-collection storage
      // (collections named 'users', 'events', 'accessRequests', 'notifications', 'content').
      const db = client.db(DB_NAME)
      const migrated: Partial<DbSchema> = {}

      try {
        const collNames = await db.listCollections().toArray()
        const names = collNames.map((c) => c.name)

        if (names.includes('users')) {
          const usersColl = db.collection('users')
          const users = await usersColl.find().toArray()
          migrated.users = (Array.isArray(users) ? users : []) as unknown as typeof migrated.users
        }

        if (names.includes('events')) {
          const eventsColl = db.collection('events')
          const events = await eventsColl.find().toArray()
          migrated.events = (Array.isArray(events) ? events : []) as unknown as typeof migrated.events
        }

        if (names.includes('accessRequests')) {
          const arColl = db.collection('accessRequests')
          const ars = await arColl.find().toArray()
          migrated.accessRequests = (Array.isArray(ars) ? ars : []) as unknown as typeof migrated.accessRequests
        }

        if (names.includes('notifications')) {
          const nColl = db.collection('notifications')
          const notifs = await nColl.find().toArray()
          migrated.notifications = (Array.isArray(notifs) ? notifs : []) as unknown as typeof migrated.notifications
        }

        if (names.includes('content')) {
          const cColl = db.collection('content')
          const content = await cColl.find().toArray()
          migrated.content = (Array.isArray(content) ? content : []) as unknown as typeof migrated.content
        }
      } catch (err) {
        console.error('[DB] Error while checking legacy collections', err)
      }

      // If we found any legacy data, use it; otherwise initialize fresh document.
      if (
        (migrated.users && migrated.users.length > 0) ||
        (migrated.events && migrated.events.length > 0) ||
        (migrated.accessRequests && migrated.accessRequests.length > 0) ||
        (migrated.notifications && migrated.notifications.length > 0) ||
        (migrated.content && migrated.content.length > 0)
      ) {
        data = normalizeDataShape(migrated as Partial<DbSchema>)
        await collection.insertOne({ name: DOCUMENT_NAME, data })
        console.log('[DB] Migrated legacy collections into single-document datastore - users:', data.users.length)
        initComplete = true
        return
      }

      data = normalizeDataShape()
      await collection.insertOne({ name: DOCUMENT_NAME, data })
      console.log('[DB] No existing document - inserted fresh empty datastore')
      initComplete = true
    } catch (err) {
      initPromise = null // allow retry on next call
      throw err
    }
  })()

  return initPromise
}

let persistQueue: Promise<void> = Promise.resolve()

export async function persistData(): Promise<void> {
  // Chain onto the existing queue so writes are serialised
  persistQueue = persistQueue.then(() => _doPersist()).catch(() => _doPersist())
  return persistQueue
}

async function _doPersist(): Promise<void> {
  if (isTestMode) return

  if (!initPromise && process.env.NODE_ENV === 'production') {
    throw new Error('Database not initialized - cannot persist data safely')
  }

  await waitForDb()

  if (!client) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Database not connected - cannot persist data')
    }
    return
  }

  const collection = client.db(DB_NAME).collection(COLLECTION)
  const result = await collection.updateOne(
    { name: DOCUMENT_NAME },
    { $set: { data } },
    { upsert: true }
  )

  if (result.upsertedId) {
    console.log('[DB] Upserted new document:', result.upsertedId)
  }
}

async function ensureConnected(): Promise<void> {
  if (isConnected && client) return
  // Reset and retry connection
  isConnected = false
  initPromise = null
  await initData()
}

export async function readData(): Promise<DbSchema> {
  // In test mode or when MongoDB is not connected, return in-memory copy
  if (isTestMode || !client || !isConnected) {
    return data
  }

  const collection = client.db(DB_NAME).collection(COLLECTION)
  const saved = await collection.findOne({ name: DOCUMENT_NAME })
  if (!saved) return data // fallback to in-memory if document missing

  data = normalizeDataShape(saved.data as Partial<DbSchema>)
  return data
}

export function getData(): DbSchema {
  return data
}

export function setData(value: DbSchema): void {
  data = value
}

export function waitForDb(): Promise<void> {
  return initPromise ?? Promise.resolve()
}

export function isDbReady(): boolean {
  // Consider DB "ready" if an explicit init completed, or if in tests the
  // in-memory `data` has been seeded with users (helpers call `setData`).
  if (initComplete) return true
  try {
    return Array.isArray(data.users) && data.users.length > 0
  } catch (e) {
    return false
  }
}

export function resetInitForTesting(): void {
  initPromise = null
  initComplete = false
  isConnected = false
  client = null
  data = normalizeDataShape()
}
