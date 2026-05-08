import express, { type Request, type Response } from 'express'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import swaggerUi from 'swagger-ui-express'

import swaggerDocument from '../config/swagger'
import approveAccessHandler from '../../api/auth/approve-access'
import requestAccessHandler from '../../api/auth/request-access'
import loginHandler from '../../api/auth/login'
import revokeAccessHandler from '../../api/auth/revoke-access'
import adminContentHandler from '../../api/admin/content'
import adminDashboardHandler from '../../api/admin/dashboard'
import createAdminHandler from '../../api/admin/create-admin'
import birthdayGenerateHandler from '../../api/birthdays/generate'
import birthdayUpcomingHandler from '../../api/birthdays/upcoming'
import eventByIdHandler from '../../api/events/[id]'
import eventsHandler from '../../api/events/index'
import eventRsvpHandler from '../../api/events/rsvp'
import notificationSendHandler from '../../api/notifications/send'
import userByIdHandler from '../../api/users/[id]'
import usersHandler from '../../api/users/index'
import promoteUserHandler from '../../api/users/promote'
import debugDbHandler from '../../api/debug/db'
import { initData, getData, setData, persistData } from '../config/db'
import type { IUser } from '../interfaces/user.interface'
import { env } from '../config/env'
import { corsMiddleware } from '../middleware/cors'
import { randomUUID } from 'crypto'

type VercelHandler = (req: VercelRequest, res: VercelResponse) => void | Promise<void>

function toVercelHandler(handler: VercelHandler) {
  return async (req: Request, res: Response) => {
    try {
      await handler(req as unknown as VercelRequest, res as unknown as VercelResponse)
    } catch (error) {
      console.error(error)

      if (!res.headersSent) {
        res.status(500).json({ success: false, message: (error as Error).message })
      }
    }
  }
}

const app = express()

app.use(express.json())
app.use(corsMiddleware)

app.use((req, res, next) => {
  const startedAt = Date.now()

  res.on('finish', () => {
    const elapsedMs = Date.now() - startedAt
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} in ${elapsedMs}ms`)
  })

  next()
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV })
})

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument as unknown as swaggerUi.SwaggerUiOptions))

const routes = [
  { method: 'all', path: '/api/auth/request-access', handler: requestAccessHandler },
  { method: 'all', path: '/api/auth/login', handler: loginHandler },
  { method: 'all', path: '/api/auth/approve-access', handler: approveAccessHandler },
  { method: 'all', path: '/api/auth/revoke-access', handler: revokeAccessHandler },
  { method: 'all', path: '/api/users', handler: usersHandler },
  { method: 'all', path: '/api/users/promote', handler: promoteUserHandler },
  { method: 'all', path: '/api/users/:id', handler: userByIdHandler },
  { method: 'all', path: '/api/events', handler: eventsHandler },
  { method: 'all', path: '/api/events/rsvp', handler: eventRsvpHandler },
  { method: 'all', path: '/api/events/:id', handler: eventByIdHandler },
  { method: 'all', path: '/api/birthdays/upcoming', handler: birthdayUpcomingHandler },
  { method: 'all', path: '/api/birthdays/generate', handler: birthdayGenerateHandler },
  { method: 'all', path: '/api/notifications/send', handler: notificationSendHandler },
  { method: 'all', path: '/api/admin/create-admin', handler: createAdminHandler },
  { method: 'all', path: '/api/admin/dashboard', handler: adminDashboardHandler },
  { method: 'all', path: '/api/admin/content', handler: adminContentHandler },
    { method: 'all', path: '/api/debug/db', handler: debugDbHandler },
] as const

for (const route of routes) {
  app[route.method](route.path, toVercelHandler(route.handler))
}

const port = env.PORT

async function startServer() {
  await initData()

  // If running locally (not production) and datastore is empty, seed a test user
  try {
    const current = getData()
    if ((current.users?.length || 0) === 0 && process.env.NODE_ENV !== 'production') {
      const now = new Date().toISOString()
      const seeded: IUser[] = [
        {
          id: randomUUID(),
          name: 'Local Admin',
          email: 'admin.local@example.com',
          role: 'admin',
          accessStatus: 'approved',
          birthday: undefined,
          capabilities: ['manage_events', 'manage_users'],
          notificationPrefs: { level: 'all', channels: ['email'] },
          createdAt: now,
          updatedAt: now,
        },
      ]

      setData({ ...current, users: seeded })
      await persistData().catch((err) => console.error('[DB] persist seed error', err))
      console.log('[DB] Seeded in-memory users:', seeded.map((u) => u.email).join(', '))
    }
  } catch (err) {
    console.error('[DB] Error while seeding users', err)
  }

  app.listen(port, () => {
    console.log('KinEvents backend local server')
    console.log(`Listening on port ${port}`)
    for (const route of routes) {
      console.log(`${String(route.method).toUpperCase()} ${route.path}`)
    }
  })
}

void startServer()

export { app, toVercelHandler }