import { randomUUID } from 'crypto'
import { MongoClient, type Db } from 'mongodb'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  details?: unknown
}

interface LoginUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'member'
  accessStatus: 'pending' | 'approved' | 'rejected' | 'revoked'
  capabilities: string[]
  notificationPrefs: {
    level: 'all' | 'important' | 'none'
    channels: Array<'email' | 'push'>
  }
  createdAt: string
  updatedAt: string
  birthday?: string
}

interface DatastoreDocument {
  name: string
  data: {
    users: LoginUser[]
    events: Array<Record<string, unknown>>
    accessRequests: Array<Record<string, unknown>>
    notifications: Array<Record<string, unknown>>
    content: Array<Record<string, unknown>>
  }
}

const baseUrl = (process.env.INTEGRATION_BASE_URL || '').replace(/\/$/, '')
const mongoUri = process.env.INTEGRATION_MONGODB_URI?.trim() || process.env.MONGODB_URI?.trim() || ''
const mongoDbName = process.env.INTEGRATION_MONGODB_DB_NAME?.trim() || process.env.MONGODB_DB_NAME?.trim() || 'kinevents'
const integrationEmail = process.env.INTEGRATION_EMAIL?.trim().toLowerCase() || 'bobosibanda35@gmail.com'
const adminSecret = process.env.ADMIN_SECRET?.trim()

const canRunIntegration = Boolean(baseUrl && mongoUri)
const describeIntegration = canRunIntegration ? describe : describe.skip

const requestHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
}

let mongoClient: MongoClient | null = null
let originalDatastore: DatastoreDocument | null = null
let hadDatastore = false
let snapshotReady = false

let authUser: LoginUser
let authToken = ''

async function request<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<{ status: number; body: ApiResponse<T> | null; rawBody: string }> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...requestHeaders,
      ...(init.headers || {}),
    },
  })

  const rawBody = await response.text()
  let body: ApiResponse<T> | null = null

  if (rawBody.trim()) {
    body = JSON.parse(rawBody) as ApiResponse<T>
  }

  return { status: response.status, body, rawBody }
}

function authRequest<T = unknown>(path: string, init: RequestInit = {}) {
  return request<T>(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${authToken}`,
      ...(init.headers || {}),
    },
  })
}

async function snapshotDatastore(db: Db) {
  const collection = db.collection<DatastoreDocument>('datastore')
  const document = await collection.findOne({ name: 'appdata' })
  hadDatastore = Boolean(document)
  originalDatastore = document ? JSON.parse(JSON.stringify(document)) as DatastoreDocument : null
}

async function restoreDatastore() {
  if (!mongoClient || !snapshotReady) {
    return
  }

  const collection = mongoClient.db(mongoDbName).collection<DatastoreDocument>('datastore')

  if (hadDatastore && originalDatastore) {
    await collection.updateOne(
      { name: 'appdata' },
      { $set: { data: originalDatastore.data } },
      { upsert: true }
    )
  } else {
    await collection.deleteOne({ name: 'appdata' })
  }
}

describeIntegration('Real user integration', () => {
  jest.setTimeout(120000)

  beforeAll(async () => {
    mongoClient = new MongoClient(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    })
    await mongoClient.connect()
    await snapshotDatastore(mongoClient.db(mongoDbName))
    snapshotReady = true

    const login = await request<{ user: LoginUser; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: integrationEmail }),
    })

    expect(login.status).toBe(200)
    expect(login.body?.success).toBe(true)
    authUser = login.body?.data?.user as LoginUser
    authToken = login.body?.data?.token as string
    expect(authUser?.email).toBe(integrationEmail)
    expect(authToken).toBeTruthy()
  })

  afterAll(async () => {
    try {
      await restoreDatastore()
    } finally {
      await mongoClient?.close()
    }
  })

  test('exercises the full API with a real admin user', async () => {
    const health = await request('/health')
    expect(health.status).toBe(200)

    const debug = await request<{ collections: Record<string, number> }>('/api/debug/db')
    expect(debug.status).toBe(200)
    expect(debug.body?.data?.collections.users).toBeGreaterThanOrEqual(1)

    const dashboard = await authRequest<{ users: { total: number; admins: number } }>('/api/admin/dashboard')
    expect(dashboard.status).toBe(200)
    expect(dashboard.body?.data?.users.total).toBeGreaterThanOrEqual(1)

    const existingAdminCount = dashboard.body?.data?.users.admins || 0

    const tempRequestEmail = `integration-${randomUUID()}@example.com`
    const requestAccess = await request<{ id: string }>('/api/auth/request-access', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Integration User',
        email: tempRequestEmail,
        message: 'integration test',
      }),
    })
    expect(requestAccess.status).toBe(201)
    const accessRequestId = requestAccess.body?.data?.id as string
    expect(accessRequestId).toBeTruthy()

    const approveAccess = await authRequest<{ request: { id: string }; user: LoginUser; token: string }>('/api/auth/approve-access', {
      method: 'POST',
      body: JSON.stringify({ accessRequestId }),
    })
    expect(approveAccess.status).toBe(200)
    const tempUser = approveAccess.body?.data?.user as LoginUser
    const tempUserId = tempUser.id
    expect(tempUserId).toBeTruthy()

    const revokeAccess = await authRequest('/api/auth/revoke-access', {
      method: 'POST',
      body: JSON.stringify({ accessRequestId }),
    })
    expect(revokeAccess.status).toBe(200)

    const usersList = await authRequest<{ id: string; email: string }[]>('/api/users')
    expect(usersList.status).toBe(200)
    expect(usersList.body?.data?.some((user) => user.email === tempRequestEmail)).toBe(true)

    const userGet = await authRequest<LoginUser>(`/api/users/${tempUserId}`)
    expect(userGet.status).toBe(200)
    expect(userGet.body?.data?.email).toBe(tempRequestEmail)

    const userPatch = await authRequest<LoginUser>(`/api/users/${tempUserId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: 'Integration User Updated',
        birthday: '1991-05-08',
        notificationPrefs: {
          level: 'important',
          channels: ['push'],
        },
      }),
    })
    expect(userPatch.status).toBe(200)
    expect(userPatch.body?.data?.birthday).toBe('1991-05-08')

    const userPromote = await authRequest<LoginUser>('/api/users/promote', {
      method: 'POST',
      body: JSON.stringify({ userId: tempUserId, role: 'manager' }),
    })
    expect(userPromote.status).toBe(200)
    expect(userPromote.body?.data?.role).toBe('manager')

    const eventsList = await authRequest<Array<{ id: string; title: string }>>('/api/events')
    expect(eventsList.status).toBe(200)

    const createEvent = await authRequest<{ id: string; title: string }>('/api/events', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Integration Event',
        description: 'Created by integration test',
        date: new Date(Date.now() + 86_400_000).toISOString(),
        createdBy: authUser.id,
        location: 'Remote',
        type: 'custom',
      }),
    })
    expect(createEvent.status).toBe(201)
    const eventId = createEvent.body?.data?.id as string

    const eventGet = await authRequest(`/api/events/${eventId}`)
    expect(eventGet.status).toBe(200)

    const eventPatch = await authRequest(`/api/events/${eventId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Integration Event Updated', locked: true }),
    })
    expect(eventPatch.status).toBe(200)

    const rsvp = await authRequest(`/api/events/rsvp`, {
      method: 'POST',
      body: JSON.stringify({ eventId, userId: tempUserId, status: 'yes' }),
    })
    expect(rsvp.status).toBe(200)

    const notification = await authRequest(`/api/notifications/send`, {
      method: 'POST',
      body: JSON.stringify({
        type: 'event_reminder',
        recipientId: tempUserId,
        payload: { eventId, title: 'Integration Event Updated' },
      }),
    })
    expect(notification.status).toBe(201)

    const birthdaysUpcoming = await authRequest(`/api/birthdays/upcoming?limit=5`)
    expect(birthdaysUpcoming.status).toBe(200)

    const birthdaysGenerate = await authRequest(`/api/birthdays/generate`, {
      method: 'POST',
      body: JSON.stringify({ year: new Date().getFullYear() }),
    })
    expect(birthdaysGenerate.status).toBe(201)

    const contentGet = await authRequest(`/api/admin/content`)
    expect(contentGet.status).toBe(200)

    const contentPost = await authRequest(`/api/admin/content`, {
      method: 'POST',
      body: JSON.stringify({
        key: 'announcement',
        value: 'Integration test update',
        updatedBy: authUser.id,
      }),
    })
    expect(contentPost.status).toBe(201)

    if (adminSecret) {
      const createAdmin = await authRequest(`/api/admin/create-admin`, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Integration Admin',
          email: `admin-${randomUUID()}@example.com`,
          secret: adminSecret,
        }),
      })

      if (existingAdminCount > 0) {
        expect(createAdmin.status).toBe(400)
      } else {
        expect(createAdmin.status).toBe(201)
      }
    } else {
      const createAdmin = await authRequest(`/api/admin/create-admin`, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Integration Admin',
          email: `admin-${randomUUID()}@example.com`,
          secret: 'invalid-secret',
        }),
      })
      expect(createAdmin.status).toBe(403)
    }

    const userDelete = await authRequest(`/api/users/${tempUserId}`, {
      method: 'DELETE',
    })
    expect(userDelete.status).toBe(200)

    const eventDelete = await authRequest(`/api/events/${eventId}`, {
      method: 'DELETE',
    })
    expect(eventDelete.status).toBe(200)
  })
})