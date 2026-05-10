import { randomUUID } from 'crypto'

import { app, routes } from '../app'
import { env } from '../config/env'
import { getData, initData, persistData, setData } from '../config/db'
import type { IUser } from '../interfaces/user.interface'

async function startServer() {
  await initData()

  try {
    const current = getData()
    // Only seed if we have no users. Prefer data from db.json or MongoDB.
    if ((current.users?.length || 0) === 0 && process.env.NODE_ENV !== 'production') {
      const now = new Date().toISOString()
      const seeded: IUser[] = [
        {
          id: randomUUID(),
          name: 'Local Admin',
          email: 'local-admin@kinevents.test',
          role: 'admin',
          accessStatus: 'approved',
          birthday: '1990-01-01',
          capabilities: [
            'create_event',
            'edit_any_event',
            'delete_any_event',
            'edit_locked_event',
            'manage_users',
            'edit_content',
          ],
          notificationPrefs: { level: 'all', channels: ['email'] },
          createdAt: now,
          updatedAt: now,
        },
      ]

      setData({ ...current, users: seeded })
      await persistData().catch((err) => console.error('[DB] persist seed error', err))
      console.log('[DB] Seeded in-memory users:', seeded.map((user) => user.email).join(', '))
    }
  } catch (err) {
    console.error('[DB] Error while seeding users', err)
  }

  app.listen(env.PORT, () => {
    console.log('KinEvents backend local server')
    console.log(`Listening on port ${env.PORT}`)
    for (const route of routes) {
      console.log(`${String(route.method).toUpperCase()} ${route.path}`)
    }
  })
}

void startServer()
