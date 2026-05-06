import express, { type Request, type Response } from 'express'
import type { VercelRequest, VercelResponse } from '@vercel/node'

import approveAccessHandler from '../../api/auth/approve-access'
import requestAccessHandler from '../../api/auth/request-access'
import revokeAccessHandler from '../../api/auth/revoke-access'
import adminContentHandler from '../../api/admin/content'
import adminDashboardHandler from '../../api/admin/dashboard'
import birthdayGenerateHandler from '../../api/birthdays/generate'
import birthdayUpcomingHandler from '../../api/birthdays/upcoming'
import eventByIdHandler from '../../api/events/[id]'
import eventsHandler from '../../api/events/index'
import eventRsvpHandler from '../../api/events/rsvp'
import notificationSendHandler from '../../api/notifications/send'
import userByIdHandler from '../../api/users/[id]'
import usersHandler from '../../api/users/index'
import promoteUserHandler from '../../api/users/promote'
import { env } from '../config/env'

type VercelHandler = (req: VercelRequest, res: VercelResponse) => void

function toVercelHandler(handler: VercelHandler) {
  return (req: Request, res: Response) => {
    handler(req as unknown as VercelRequest, res as unknown as VercelResponse)
  }
}

const app = express()

app.use(express.json())

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

const routes = [
  { method: 'all', path: '/api/auth/request-access', handler: requestAccessHandler },
  { method: 'all', path: '/api/auth/approve-access', handler: approveAccessHandler },
  { method: 'all', path: '/api/auth/revoke-access', handler: revokeAccessHandler },
  { method: 'all', path: '/api/users', handler: usersHandler },
  { method: 'all', path: '/api/users/:id', handler: userByIdHandler },
  { method: 'all', path: '/api/users/promote', handler: promoteUserHandler },
  { method: 'all', path: '/api/events', handler: eventsHandler },
  { method: 'all', path: '/api/events/:id', handler: eventByIdHandler },
  { method: 'all', path: '/api/events/rsvp', handler: eventRsvpHandler },
  { method: 'all', path: '/api/birthdays/generate', handler: birthdayGenerateHandler },
  { method: 'all', path: '/api/birthdays/upcoming', handler: birthdayUpcomingHandler },
  { method: 'all', path: '/api/notifications/send', handler: notificationSendHandler },
  { method: 'all', path: '/api/admin/content', handler: adminContentHandler },
  { method: 'all', path: '/api/admin/dashboard', handler: adminDashboardHandler },
] as const

for (const route of routes) {
  app[route.method](route.path, toVercelHandler(route.handler))
}

const port = env.PORT

app.listen(port, () => {
  console.log('KinEvents backend local server')
  console.log(`Listening on port ${port}`)
  for (const route of routes) {
    console.log(`${String(route.method).toUpperCase()} ${route.path}`)
  }
})

export { app, toVercelHandler }