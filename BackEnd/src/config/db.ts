import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, resolve } from 'path'

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

class JsonDatabase {
  data: DbSchema = { ...defaultData }

  read() {
    if (!existsSync(dbFilePath)) {
      this.write()
      return this
    }

    try {
      const fileContents = readFileSync(dbFilePath, 'utf8')
      const parsedData = fileContents.trim() ? (JSON.parse(fileContents) as Partial<DbSchema>) : {}

      this.data = {
        ...defaultData,
        ...parsedData,
      }
    } catch {
      this.data = { ...defaultData }
      this.write()
    }

    return this
  }

  write() {
    writeFileSync(dbFilePath, `${JSON.stringify(this.data, null, 2)}\n`)
    return this
  }
}

export const db = new JsonDatabase().read()

export default db