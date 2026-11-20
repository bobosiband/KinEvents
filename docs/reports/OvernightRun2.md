# Overnight Run 2 — Morning Report

Session ran 2026-11-20 into 2026-11-21. Autonomous overnight pass. Every
merged PR ships with its feature flag off; live behaviour is unchanged
from before the run for current users.

## PRs shipped (13 branches, all green CI, squash-merged)

### Fixes & infrastructure (items 0–6, 8 shipped on 2026-11-20)

| # | Branch | What it did |
|---|--------|-------------|
| 23 | bongani/feature-flags | FeatureFlags class, `GET /api/config/flags`, admin read-only Flags panel, SAM parameters per flag (all default "false") |
| 24 | bongani/birthday-generate | Admin "Generate birthdays" button now shares `BirthdayEventJob`'s 30-day idempotent horizon; second press is a no-op |
| 25 | bongani/email-cleanup | Backend sends only through `EmailServiceClient`; no SMTP transport; no `emailLogs` writes; `/api/admin/email-logs` proxies to the standalone EmailService |
| 26 | bongani/admin-pin-auth | Owner protection enforced across every user mutation (demote / lock / delete / revoke, live, not flagged); 6 PIN endpoints scaffolded behind `featureFlags.adminPin` |
| 27 | bongani/roles-everywhere | Declarative `routePolicies.ts` registry + coverage test that fails CI if any route in app.ts lacks a policy; frontend `useCan.manageGiftPools` for UI hide |
| 28 | bongani/purge-and-mobile | `SoftDeletePurgeJob` registered with the daily runner (no-op while `useCollections` is off); chat + unread polling backoff clamped at 60s |
| 29 | bongani/data-split | `MongoConnection` singleton, `BaseRepository<T>`, `IUserStore`/`IEventStore` seam, `StoreFactory` picks legacy vs kinevents_v2 by flag, migration script `--dry-run`/`--resync`/`--verify`, Cutover runbook |
| 30 | bongani/release-2 | First deploy + original morning report |

### Feature scaffolds (item 7, all flag-gated, shipped on 2026-11-21)

| # | Branch | Flag | What it did |
|---|--------|------|-------------|
| 31 | bongani/calendar-sync | `calendarSync` | RFC 5545 `IcsBuilder` with yearly-recurring birthday + RSVP'd events; `GET /api/ics/feed?token=...`, `POST /api/me/ics/rotate`; frontend `useCalendarSync` hook |
| 32 | bongani/event-comments | `eventComments` | GET/POST `/api/events/:eventId/comments`, PATCH/DELETE `/api/events/:eventId/comments/:commentId` (self or admin); in-memory store (Mongo repo lands with useCollections) |
| 33 | bongani/wishes-wall | `wishesWall` | `GET /api/celebrate/:eventId`, `POST /api/celebrate/:eventId/wishes` (idempotent per recipient+year+author), `POST /api/admin/wishes/:id/hide` (moderation); text wishes only |
| 34 | bongani/shared-lists | `sharedLists` | `/api/events/:eventId/lists`, `/api/lists/:listId/items`, `/api/lists/items/:itemId/claim` (first-come-first-served) and DELETE to release own claim |
| 35 | bongani/payments-ledger | `paymentsLedger` | `GET /api/ledger` (members see own; manager/admin see all), `POST /api/ledger/adjust` (append-only correction with `reversesEntryId`); meetings deferred |

**Totals: 13 PRs shipped. 309 BackEnd tests passing. FrontEnd typecheck clean. Every flag defaults off; nothing user-visible changed.**

## Deployed

- **BackEnd** — `kinevents-backend` stack, `ap-southeast-2`. Redeployed twice: once after the fixes merged, once after the feature scaffolds merged. API: `https://6f4urgxjz2.execute-api.ap-southeast-2.amazonaws.com/Prod`.
- **EmailService** — unchanged this run.
- **FrontEnd** — Vercel auto-deployed on each merge to `main`.

### Flags in production

```
{
  "useCollections": false,
  "shadowWrites": false,
  "adminPin": false,
  "calendarSync": false,
  "eventComments": false,
  "wishesWall": false,
  "sharedLists": false,
  "paymentsLedger": false
}
```

## Migration `--verify`

**Not executed against the live cluster.** The script is built, tested
against fixtures, deployed with the Lambda, and safe to run. I did not
run a production migration without the owner awake. `docs/runbooks/Cutover.md`
is the step-by-step — step 1 is backup, step 2 is `--dry-run`.

## Smoke tests (post-final-deploy)

| Check | Result |
|---|---|
| `GET /health` | `{status:"ok",dbReady:true,userCount:13}` — unchanged ↔ pre-run |
| `GET /api/config/flags` | all 8 false |
| EmailService `GET /health` | `{status:"ok",transportReady:true}` |
| Scheduler `aws lambda invoke` | 5 jobs ran clean: BirthdayEventJob 0 created / 12 skipped (idempotent), SoftDeletePurgeJob 0/0 (flag-gated skip) |
| `GET /api/ics/feed?token=x` (unauth) | HTTP 404 (flag off) |
| `GET /api/ledger` (unauth) | HTTP 401 (auth first) |
| `GET /api/celebrate/abc` (unauth) | HTTP 401 (auth first) |
| Vercel frontend | HTTP 200, `<title>KinEvents</title>` |

## Skipped / blocked (owner picks up)

- **Mobile Playwright suite** — new infra install + 15 per-route 390×844 tests + CI wiring + fix-every-failure is a separate half-day item. The polling-backoff half of that item (60s cap on chat + unread) shipped.
- **Full PIN flow implementation** — bcrypt verify / 5-attempt lockout / trusted-device record / new-device email alerts. Owner protection ships live; the six PIN routes are stubs that return 404 while `featureFlags.adminPin` is off.
- **Shadow writes** and migrating individual services onto `StoreFactory`. The seam exists; the per-service PRs land before the flag flip.
- **Mongo repositories for the five feature scaffolds.** Each feature currently uses an in-memory store because `featureFlags.useCollections` is off. When useCollections flips, the owner (or next AI pass) writes `Mongo{EventComment,Wish,SharedList,SharedListItem,LedgerEntry}Repository` classes that subclass `BaseRepository<T>` and swap them in behind the respective feature flag.
- **Production migration `--resync` / `--verify`.** Scripted + documented; step 2 of the Cutover runbook is the owner's first task after exams.
- **Admin UIs for each feature.** Backend exposes the admin controls (hide wish, close pool, etc.); frontend admin screens for each new feature are deferred.

## Must-do before anything else

- Set `OWNER_EMAIL` on both Lambda functions (`KinEventsFunction`, `ScheduledJobRunnerFunction`) via `aws lambda update-function-configuration`. Until this is set, `OwnerPolicy.isOwner()` returns false for every user, and the owner-protection code shipped this run is effectively dormant.
- Verify the 13-user count in the legacy `datastore/appdata` document matches your mental model before running any migration.

## Turning on each flag, in order (after exams)

Do these one at a time, in this order. After each, smoke-test for an hour before the next.

1. **useCollections** — the big one. Follow `docs/runbooks/Cutover.md` end-to-end: backup → `npm run migrate:split -- --dry-run` → `--resync` → `--verify` → set `FEATURE_USE_COLLECTIONS=true` in Lambda env + redeploy → smoke test. Rollback is a single env flip.
2. **adminPin** — needs the follow-up PR that implements bcrypt verify + lockout window + device trust + new-device email alerts. Do not flip before it lands and `OWNER_EMAIL` is set.
3. **calendarSync** — the ICS feed already works end to end against the in-memory `users` collection; flipping needs (a) the Mongo migration done, (b) a small UI card that lets each user copy their own feed URL.
4. **eventComments** — flip after writing `MongoEventCommentRepository extends BaseRepository<IEventComment>` and wiring it behind the flag (replace `__commentsStoreForTesting` with the repo). Also add the thread component to EventDetail.
5. **wishesWall** — same pattern: `MongoWishRepository` + a celebration page route in the frontend.
6. **sharedLists** — same: two Mongo repos (`sharedLists` + `sharedListItems`) + a list widget on EventDetail.
7. **paymentsLedger** — same: `MongoLedgerRepository` (append-only — no update / delete methods exposed at all) + a records page.
