import { setData, type DbSchema } from '../../src/config/db'

/**
 * Resets the database to an empty test state.
 */
export function resetDb(): void {
  setData({
    users: [],
    events: [],
    accessRequests: [],
    accessRequestHistory: [],
    notifications: [],
    content: [],
    emailLogs: [],
    messages: [],
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
    accessRequestHistory: partialData.accessRequestHistory ?? [],
    notifications: partialData.notifications ?? [],
    content: partialData.content ?? [],
    emailLogs: partialData.emailLogs ?? [],
    messages: partialData.messages ?? [],
  })
}