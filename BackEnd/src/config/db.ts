import { mkdirSync } from 'fs'
import { dirname, resolve } from 'path'

import { JSONFileSync, LowSync } from 'lowdb'

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

const dbFilePath = resolve(process.cwd(), 'data', 'db.json')

const defaultData: DbSchema = {
  users: [],
  events: [],
  accessRequests: [],
  notifications: [],
  content: [],
}

mkdirSync(dirname(dbFilePath), { recursive: true })

const adapter = new JSONFileSync<DbSchema>(dbFilePath)
const database = new LowSync<DbSchema>(adapter)

database.read()
database.data = {
  ...defaultData,
  ...(database.data ?? {}),
}
database.write()

export const db = database

export default db