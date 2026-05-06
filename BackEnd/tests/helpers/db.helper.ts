import { db, type DbSchema } from '../../src/config/db'

/**
 * Resets the database to an empty test state.
 */
export function resetDb(): void {
  db.data = {
    users: [],
    events: [],
    accessRequests: [],
    notifications: [],
    content: [],
  }

  db.write()
}

/**
 * Seeds the database with partial test data.
 * @param partialData Partial database payload to merge into the test state.
 */
export function seedDb(partialData: Partial<DbSchema>): void {
  db.data = {
    users: partialData.users ?? [],
    events: partialData.events ?? [],
    accessRequests: partialData.accessRequests ?? [],
    notifications: partialData.notifications ?? [],
    content: partialData.content ?? [],
  }

  db.write()
}