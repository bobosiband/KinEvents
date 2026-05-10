import express, { type Request, type Response } from 'express'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import swaggerUi from 'swagger-ui-express'

import swaggerDocument from './config/swagger'
import approveAccessHandler from '../api/auth/approve-access'
import requestAccessHandler from '../api/auth/request-access'
import loginHandler from '../api/auth/login'
import revokeAccessHandler from '../api/auth/revoke-access'
import adminContentHandler from '../api/admin/content'
import adminDashboardHandler from '../api/admin/dashboard'
import createAdminHandler from '../api/admin/create-admin'
import adminCleanupHandler from '../api/admin/cleanup'
import emailLogsHandler from '../api/admin/email-logs'
import emailResendHandler from '../api/admin/email-resend'
import emailTestHandler from '../api/admin/email-test'
import birthdayGenerateHandler from '../api/birthdays/generate'
import birthdayRemindersHandler from '../api/birthdays/reminders'
import birthdayUpcomingHandler from '../api/birthdays/upcoming'
import eventByIdHandler from '../api/events/[id]'
import eventsHandler from '../api/events/index'
import eventRemindersHandler from '../api/events/reminders'
import eventRsvpHandler from '../api/events/rsvp'
import notificationsHandler from '../api/notifications/index'
import notificationSendHandler from '../api/notifications/send'
import notificationReadHandler from '../api/notifications/[id]/read'
import notificationByIdHandler from '../api/notifications/[id]'
import userByIdHandler from '../api/users/[id]'
import usersHandler from '../api/users/index'
import promoteUserHandler from '../api/users/promote'
import debugDbHandler from '../api/debug/db'
import { corsMiddleware } from './middleware/cors'

type VercelHandler = (req: VercelRequest, res: VercelResponse) => void | Promise<void>

export const routes = [
  { method: 'all', path: '/api/auth/request-access', handler: requestAccessHandler },
  { method: 'all', path: '/api/auth/login', handler: loginHandler },
  { method: 'all', path: '/api/auth/approve-access', handler: approveAccessHandler },
  { method: 'all', path: '/api/auth/revoke-access', handler: revokeAccessHandler },
  { method: 'all', path: '/api/users', handler: usersHandler },
  { method: 'all', path: '/api/users/promote', handler: promoteUserHandler },
  { method: 'all', path: '/api/users/:id', handler: userByIdHandler },
  { method: 'all', path: '/api/events', handler: eventsHandler },
  { method: 'all', path: '/api/events/reminders', handler: eventRemindersHandler },
  { method: 'all', path: '/api/events/rsvp', handler: eventRsvpHandler },
  { method: 'all', path: '/api/events/:id', handler: eventByIdHandler },
  { method: 'all', path: '/api/birthdays/upcoming', handler: birthdayUpcomingHandler },
  { method: 'all', path: '/api/birthdays/reminders', handler: birthdayRemindersHandler },
  { method: 'all', path: '/api/birthdays/generate', handler: birthdayGenerateHandler },
  { method: 'all', path: '/api/notifications', handler: notificationsHandler },
  { method: 'all', path: '/api/notifications/send', handler: notificationSendHandler },
  { method: 'all', path: '/api/notifications/:id/read', handler: notificationReadHandler },
  { method: 'all', path: '/api/notifications/:id', handler: notificationByIdHandler },
  { method: 'all', path: '/api/admin/create-admin', handler: createAdminHandler },
  { method: 'all', path: '/api/admin/dashboard', handler: adminDashboardHandler },
  { method: 'all', path: '/api/admin/content', handler: adminContentHandler },
  { method: 'all', path: '/api/admin/cleanup', handler: adminCleanupHandler },
  { method: 'all', path: '/api/admin/email-logs', handler: emailLogsHandler },
  { method: 'all', path: '/api/admin/email-resend', handler: emailResendHandler },
  { method: 'all', path: '/api/admin/email-test', handler: emailTestHandler },
  { method: 'all', path: '/api/debug/db', handler: debugDbHandler },
] as const

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

export function createApp() {
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

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument as unknown as swaggerUi.SwaggerUiOptions))

  for (const route of routes) {
    app[route.method](route.path, toVercelHandler(route.handler))
  }

  return app
}

export const app = createApp()
