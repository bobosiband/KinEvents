# 1.3 — Split the single Mongo document into collections

**Branch:** `bongani/data-split`  
**Why:** every feature-breaks-another report traces back to 38 full-document `$set` overwrites racing across Lambda invocations. Chat messages, RSVPs, and contributions have disappeared because of this. The fix is per-entity collections with targeted writes.

## Hard rules

- **Never delete a user.**
- Before any write to a real database: `mongodump` or JSON export first; keep the archive.
- The legacy `datastore` / `appdata` document is **never** modified by this PR. The migration script copies out of it, verifies, then switches `readData`/`persistData` to the new collections. The legacy document stays around as a frozen backup.

## Collections (11)

Create these under the same Mongo database:

| Collection | Shape (TS interface) | Notes |
| ---------- | --------------------- | ----- |
| `users` | `IUser` | indexes: `email` unique, `role`, `isOwner`, `deletedAt` |
| `events` | `IEvent` | indexes: `date`, `type`, `createdBy`, `deletedAt`; one event per source birthday per year |
| `rsvps` | `IRsvp { eventId, userId, status, createdAt, updatedAt, deletedAt? }` | compound unique `{ eventId, userId }` |
| `accessRequests` | `IAccessRequest` | indexes: `email`, `status` |
| `notifications` | `INotification` | indexes: `recipientId`, `createdAt`, `readBy`, `deletedAt` |
| `messages` | `IMessage` | indexes: `createdAt`, `from`, `deletedAt` |
| `giftPools` | `IGiftPool` | indexes: `eventId` unique, `status` |
| `giftContributions` | `IContribution` | indexes: `giftPoolId`, `contributorId`, `status`, `createdAt` |
| `auditLogs` | `IAuditLog` | indexes: `actorId`, `createdAt`, `targetId` |
| `content` | `IContentEntry` | indexes: `key` unique |
| `authAttempts` | `IAuthAttempt` | TTL index on `expiresAt` |

Every entity carries `createdAt: ISO-string`, `updatedAt: ISO-string`, and `deletedAt?: ISO-string`. Reads filter `{ deletedAt: null }` by default.

## Code

Create `BackEnd/src/db/` containing:

```
db/
  MongoConnection.ts       // lazy singleton, from env MONGODB_URI/MONGODB_DB_NAME
  BaseRepository.ts        // abstract, one-entity CRUD; see below
  UserRepository.ts
  EventRepository.ts
  RsvpRepository.ts
  AccessRequestRepository.ts
  NotificationRepository.ts
  MessageRepository.ts
  GiftPoolRepository.ts
  GiftContributionRepository.ts
  AuditLogRepository.ts
  ContentRepository.ts
  AuthAttemptRepository.ts
```

### `BaseRepository<T>`

```ts
export abstract class BaseRepository<T extends { id: string; deletedAt?: string | null }> {
  protected abstract readonly collectionName: string
  protected abstract readonly indexes: readonly IndexSpecification[]

  public constructor(private readonly connection: MongoConnection) {}

  protected async collection(): Promise<Collection<T>> { /* lazy ensureIndexes */ }

  public async findById(id: string, options?: { includeDeleted?: boolean }): Promise<T | null>
  public async findOne(filter: Filter<T>, options?: { includeDeleted?: boolean }): Promise<T | null>
  public async findMany(filter: Filter<T>, options?: { limit?: number; sort?: Sort; includeDeleted?: boolean }): Promise<readonly T[]>
  public async insertOne(entity: T): Promise<void>
  public async updateOne(id: string, update: UpdateFilter<T>): Promise<void>
  public async softDelete(id: string): Promise<void>
  public async restore(id: string): Promise<void>
}
```

Every subclass supplies its collection name and index spec in its constructor. Repositories only wrap Mongo — no business rules.

### Services and handlers

Services get constructor-injected repositories. Handlers do `const service = new XService(repoA, repoB, ...)` once per invocation (fine for Lambda). No whole-document `$set` anywhere; repositories enforce targeted operators.

## Migration script

`BackEnd/scripts/migrate-split.ts`, runnable via `ts-node`:

```bash
npm run migrate:split -- --dry-run     # read + report, no writes
npm run migrate:split -- --execute     # copy over
npm run migrate:split -- --verify      # recount
```

Steps (all inside a single run, in order):

1. **Backup** — `mongodump --archive=./backup-pre-split-<ISO>.gz --gzip`; abort if missing.
2. **Read** the legacy document from `datastore`.
3. **Copy** each sub-array into its collection using `insertMany({ ordered: false })`. Each document carries the same `id` as the legacy entry. Duplicates on second runs are ignored by key.
4. **Verify**:
    - `users` count === legacy `users.length`
    - Every legacy user `id` present in `users` — fail loudly if any single user is missing. (**"Never delete a user."**)
    - Repeat for every collection.
5. **Switch**:
    - Write a sentinel `{ key: "dataSource", value: "collections", migratedAt }` into `content`.
    - `readData` / `persistData` in `src/config/db.ts` check the sentinel and route to the new repositories. If the sentinel is absent, they fall back to the legacy single-document for safety.
6. **Keep** the legacy `datastore` document untouched.

`--dry-run` executes steps 1 (backup), 2, and reports what 3–5 would do without writing.

## Tests

- `tests/db/BaseRepository.test.ts` — against `mongodb-memory-server`.
- One test per concrete repository covering insert, update, softDelete, restore, index uniqueness.
- `tests/migrate-split.test.ts` — seed a mock legacy document, run migrate in dry-run, assert the report matches counts.

## Order within the PR

1. Add dependency `mongodb-memory-server` as devDep.
2. Create `MongoConnection` + `BaseRepository`.
3. Create all 11 concrete repositories.
4. Rewire one service at a time, keeping both read paths working behind the sentinel.
5. Add the migration script and the sentinel-driven routing in `src/config/db.ts`.
6. Delete the legacy single-document write path from services once every test passes.

Keep PRs under ~600 LOC net if the repo scope lets you; otherwise split as `bongani/data-split-repos`, `bongani/data-split-wiring`, `bongani/data-split-migration`.
