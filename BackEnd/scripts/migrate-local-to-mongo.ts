import { readFileSync } from 'fs'
import { resolve } from 'path'

import { dbReady } from '../src/config/db'
import { userRepository } from '../src/repositories/user.repository'
import { eventRepository } from '../src/repositories/event.repository'
import { accessRequestRepository } from '../src/repositories/accessRequest.repository'
import { notificationRepository } from '../src/repositories/notification.repository'
import { contentRepository } from '../src/repositories/content.repository'

async function main() {
  const dbPath = resolve(process.cwd(), 'data', 'db.json')
  const raw = readFileSync(dbPath, 'utf8')
  const parsed = raw.trim() ? JSON.parse(raw) : {}

  await dbReady

  // Users
  const users = Array.isArray(parsed.users) ? parsed.users : []
  for (const u of users) {
    const exists = userRepository.findById(u.id) || userRepository.findByEmail(u.email)
    if (!exists) {
      // eslint-disable-next-line no-console
      console.log('Inserting user:', u.email)
      // insert may return Promise or value — cast to any to satisfy types for migration
      await userRepository.insert(u as any)
    } else {
      // eslint-disable-next-line no-console
      console.log('Skipping existing user:', u.email)
    }
  }

  // Events
  const events = Array.isArray(parsed.events) ? parsed.events : []
  for (const e of events) {
    const exists = eventRepository.findById(e.id)
    if (!exists) {
      // eslint-disable-next-line no-console
      console.log('Inserting event:', e.id)
      await eventRepository.insert(e as any)
    } else {
      // eslint-disable-next-line no-console
      console.log('Skipping existing event:', e.id)
    }
  }

  // Access Requests
  const requests = Array.isArray(parsed.accessRequests) ? parsed.accessRequests : []
  for (const r of requests) {
    const exists = accessRequestRepository.findById?.(r.id) || accessRequestRepository.findByEmail?.(r.email)
    if (!exists) {
      // eslint-disable-next-line no-console
      console.log('Inserting access request:', r.email || r.id)
      await accessRequestRepository.insert(r as any)
    } else {
      // eslint-disable-next-line no-console
      console.log('Skipping existing access request:', r.email || r.id)
    }
  }

  // Notifications
  const notifications = Array.isArray(parsed.notifications) ? parsed.notifications : []
  for (const n of notifications) {
    const exists = notificationRepository.findById?.(n.id)
    if (!exists) {
      // eslint-disable-next-line no-console
      console.log('Inserting notification:', n.id)
      await notificationRepository.insert(n as any)
    } else {
      // eslint-disable-next-line no-console
      console.log('Skipping existing notification:', n.id)
    }
  }

  // Content
  const content = Array.isArray(parsed.content) ? parsed.content : []
  for (const c of content) {
    const exists = contentRepository.findByKey?.(c.key)
    if (!exists) {
      // eslint-disable-next-line no-console
      console.log('Inserting content key:', c.key)
      await contentRepository.upsert(c as any)
    } else {
      // eslint-disable-next-line no-console
      console.log('Skipping existing content key:', c.key)
    }
  }

  // Summary
  // eslint-disable-next-line no-console
  console.log('Migration complete')
  // eslint-disable-next-line no-console
  console.log('Users:', userRepository.findAll().length)
  // eslint-disable-next-line no-console
  console.log('Events:', eventRepository.findAll().length)
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
