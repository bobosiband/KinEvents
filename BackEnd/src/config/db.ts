import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

import { MongoClient } from 'mongodb'

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
  notifications: [],
  content: [],
}

let isConnected = false

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

  return normalizeDataShape({
    users: [
      {
        id: '99b13223-b3b1-4e9e-b5d3-54e769f34fab',
        name: 'Bob Local',
        email: 'bobosibanda35@gmail.com',
        role: 'admin',
        accessStatus: 'approved',
        capabilities: [],
        notificationPrefs: { level: 'all', channels: ['email'] },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  })
}

function normalizeDataShape(saved: Partial<DbSchema> = {}): DbSchema {
  return {
    users: Array.isArray(saved.users) ? saved.users : [],
    events: Array.isArray(saved.events) ? saved.events : [],
    accessRequests: Array.isArray(saved.accessRequests) ? saved.accessRequests : [],
    notifications: Array.isArray(saved.notifications) ? saved.notifications : [],
    content: Array.isArray(saved.content) ? saved.content : [],
  }
}

export async function initData(): Promise<void> {
  // Re-evaluate URI at init time (may be provided via SAM env overrides)
  mongoUri = process.env.MONGODB_URI?.trim()

  if (isTestMode || !mongoUri) {
    console.log('[DB] Test mode or no MongoDB URI - using in-memory data store')
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
      return
    }
  }

  if (!isConnected && client) {
    try {
      await client.connect()
      isConnected = true
      console.log('[DB] MongoDB connected')
    } catch (error) {
      console.warn('[DB] MongoDB connect failed, using seed data fallback', error)
      data = getSeedData()
      client = null
      return
    }
  }

  const collection = client.db(DB_NAME).collection(COLLECTION)
  const saved = await collection.findOne({ name: DOCUMENT_NAME })

  if (saved) {
    data = normalizeDataShape(saved.data as Partial<DbSchema>)
    console.log('[DB] Data loaded - users:', data.users.length, 'events:', data.events.length)
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

  // If we found any legacy data, use it; otherwise initialize fresh document
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
    return
  }

  data = normalizeDataShape()
  await collection.insertOne({ name: DOCUMENT_NAME, data })
  console.log('[DB] No existing document - inserted fresh datastore')
}

export async function persistData(): Promise<void> {
  if (isTestMode || !client) {
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

export function getData(): DbSchema {
  return data
}

export function setData(value: DbSchema): void {
  data = value
}
