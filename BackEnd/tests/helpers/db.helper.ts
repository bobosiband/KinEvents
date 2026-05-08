import { setData, type DbSchema } from '../../src/config/db'

/**
 * Resets the database to an empty test state.
 */
export function resetDb(): void {
  setData({
    users: [],
    events: [],
    accessRequests: [],
    notifications: [],
    content: [],
  })
}

/**
 * Seeds the database with partial test data.
 * @param partialData Partial database payload to merge into the test state.
 */
export function seedDb(partialData: Partial<DbSchema>): void {
  setData({
    users: partialData.users ?? [],
    events: partialData.events ?? [],
    accessRequests: partialData.accessRequests ?? [],
    notifications: partialData.notifications ?? [],
    content: partialData.content ?? [],
  })
}