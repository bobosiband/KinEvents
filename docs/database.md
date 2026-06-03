# Database

## Overview

KinEvents uses MongoDB with an unconventional but intentional design: the entire application state is stored in a **single document** rather than separate collections. This simplifies reads, guarantees consistency without transactions, and makes the app trivially portable to file-based storage during development.

---

## Connection & Configuration

**File:** `BackEnd/src/config/db.ts`

| Env Var | Purpose |
|---------|---------|
| `MONGODB_URI` | MongoDB connection string |
| `MONGODB_DB_NAME` | Database name (default: `kinevents`) |

**Collection:** `datastore`  
**Document name (key):** `appdata`

If `MONGODB_URI` is not set, the app falls back to an **in-memory store** that can be seeded from `/data/db.json`. This lets developers run the backend without a MongoDB instance.

---

## Schema

The single `appdata` document matches this TypeScript interface:

```typescript
interface DbSchema {
  users: IUser[]
  events: IEvent[]
  accessRequests: IAccessRequest[]
  accessRequestHistory: IAccessRequest[]
  notifications: INotification[]
  auditLogs: AuditLogEntry[]
  content: IContentBlock[]
  emailLogs: EmailLogEntry[]
  messages: IMessage[]
  giftPools: IGiftPool[]
  giftContributions: IGiftContribution[]
}
```

Each top-level key is an array of domain objects. See the individual feature docs for the shape of each object.

---

## Core Database Functions

All database access goes through three functions defined in `db.ts`:

### `readData(): Promise<DbSchema>`

Reads the full `appdata` document from MongoDB (or the in-memory store). Returns the current state.

### `persistData(newState: DbSchema): Promise<void>`

Replaces the entire `appdata` document with `newState`. All mutations go through this function — there are no partial updates at the document level (except for the atomic helpers below).

### `mutateData(fn: (state: DbSchema) => DbSchema): Promise<void>`

Convenience wrapper: reads current state, applies `fn`, then persists the result. Most service operations use this:

```typescript
await mutateData((state) => {
  state.events.push(newEvent);
  return state;
});
```

---

## Write Serialisation (persistQueue)

Concurrent writes to the single document would cause data loss (last-write-wins). A `persistQueue` serialises all calls to `persistData`:

```typescript
// Only one write is in-flight at a time; others queue behind it
await persistQueue.add(() => persistData(newState));
```

This is handled automatically inside `mutateData`. Service code does not need to manage the queue directly.

---

## Atomic Operations

For high-frequency operations (chat messages), the full read-mutate-write cycle is too slow. These use MongoDB `$push` / `$set` with array filters directly:

| Function | What it does |
|----------|-------------|
| `atomicPushMessage(message)` | Appends a message using `$push` (avoids read overhead) |
| `atomicDeleteMessage(id, userId, isAdmin)` | Soft-deletes with permission check via `$set` + array filter |
| `atomicMarkRead(messageIds, userId)` | Bulk adds `userId` to `readBy[]` via `$set` + array filter |

---

## Legacy Migration

Earlier versions of the app used separate MongoDB collections (`users`, `events`, `accessRequests`). On startup, `db.ts` detects this layout and migrates to the single-document format automatically. The migration runs once and is idempotent.

---

## Audit Logs

Sensitive actions (contribution verification, role changes) are recorded in `auditLogs`:

```typescript
interface AuditLogEntry {
  id: string
  action: string        // e.g. 'contribution_approved'
  performedBy: string   // userId
  targetId: string      // the resource ID acted on
  metadata?: unknown
  createdAt: string
}
```

Audit logs are append-only and are never mutated after creation.

---

## Debug Endpoint

During development, `GET /api/debug/db` returns the full `appdata` document. This endpoint is disabled in production (`NODE_ENV === 'production'`).
