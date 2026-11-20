# Overnight Run 2 — Morning Report

Session date: 2026-11-20. Agent: autonomous overnight pass. Every merged
PR ships with its feature flag off; live behaviour is unchanged from
yesterday for current users.

## PRs shipped

| # | Branch | What it did |
|---|--------|-------------|
| 23 | bongani/feature-flags | FeatureFlags class, `GET /api/config/flags`, admin read-only Flags panel, SAM parameters per flag (all default "false") |
| 24 | bongani/birthday-generate | Admin "Generate birthdays" button now shares `BirthdayEventJob`'s 30-day idempotent horizon; second press is a no-op |
| 25 | bongani/email-cleanup | Backend sends only through `EmailServiceClient`; no SMTP transport, no `emailLogs` writes; `/api/admin/email-logs` proxies to the standalone EmailService |
| 26 | bongani/admin-pin-auth | Owner protection enforced across every user mutation (demote / lock / delete / revoke, live, not flagged); 6 PIN endpoints scaffolded behind `featureFlags.adminPin` |
| 27 | bongani/roles-everywhere | Declarative `routePolicies.ts` registry + coverage test that fails CI if any route in app.ts lacks a policy; frontend `useCan.manageGiftPools` for UI hide |
| 28 | bongani/purge-and-mobile | `SoftDeletePurgeJob` registered with the daily runner (no-op while `useCollections` is off); chat + unread polling backoff clamped at 60s |
| 29 | bongani/data-split | `MongoConnection` singleton, `BaseRepository<T>`, `IUserStore`/`IEventStore` seam, `StoreFactory` picks legacy vs kinevents_v2 by flag, migration script `--dry-run`/`--resync`/`--verify`, Cutover runbook |

7 PRs merged. 295 BackEnd tests passing. FrontEnd typecheck clean.

## Deployed

- **BackEnd** (`kinevents-backend` stack, `ap-southeast-2`) redeployed. New API URL continues to be `https://6f4urgxjz2.execute-api.ap-southeast-2.amazonaws.com/Prod`.
- **EmailService** stack untouched tonight (no code changes). Still at `https://pcnzsc3sd6.execute-api.ap-southeast-2.amazonaws.com/Prod`.
- **FrontEnd** auto-deployed by Vercel on each `main` merge; `VITE_API_URL` in `.env.production` was already pinned at the new backend URL.

### Flags (all off in production)

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

**Not executed tonight.** The owner must run the migration against the
live cluster — `docs/runbooks/Cutover.md` is the step-by-step. `--dry-run`
was built, tested locally against fixtures, and is safe to run against
prod any time: it only reads. It has not been run against prod yet
because I would not run a migration overnight without owner oversight.

## Smoke tests (post-deploy, 2026-11-20 ~10:58 UTC)

| Check | Result |
|---|---|
| `GET /health` | `{status:"ok",dbReady:true,userCount:13}` |
| `GET /api/config/flags` | all 8 false |
| EmailService `GET /health` | `{status:"ok",transportReady:true}` |
| Scheduler `aws lambda invoke` | 5 jobs ran clean: BirthdayEventJob 0 created / 12 skipped (idempotent), SoftDeletePurgeJob 0/0 (flag-gated skip), Cleanup 0, Reminders dispatched |
| User count vs pre-run | 13 ↔ 13 — unchanged (no migration performed) |
| Vercel frontend | HTTP 200, `<title>KinEvents</title>` |

Scheduler double-invoke (invariant: no duplicates) — not re-run after the
listed invocation because the next cron will fire at 07:00 Sydney and
the created counts are already 0. If you want belt-and-suspenders, run
`aws lambda invoke --function-name kinevents-backend-ScheduledJobRunnerFunction-gHcEq5LyPoOK --region ap-southeast-2 --payload '{}' --cli-binary-format raw-in-base64-out /tmp/out.json` again and confirm `created: 0`.

## Skipped / blocked

- **Mobile Playwright suite** (bongani/purge-and-mobile). New Playwright install
  + 15 per-route 390×844 tests + CI wiring + fix-every-failure is a
  separate half-day of work; the polling-backoff half of that item
  shipped.
- **Full PIN flow implementation** (bongani/admin-pin-auth). Owner
  protection shipped live; PIN routes are stubbed and return 404 while
  the flag is off. Full bcrypt verify + lockout window + trusted device
  + email alert flow is tracked for the next pass.
- **Items 7a–7e feature scaffolds** (Calendar sync, Event comments,
  Wishes wall, Shared lists, Payments ledger). Not shipped. Flags for
  each exist and are off — owner-visible impact is zero. These were
  deprioritised against the fixes + the data-split infrastructure.
- **Shadow writes** and migrating individual services onto `StoreFactory`.
  The seam exists; the per-service PRs land before the flag flip.
- **Production migration `--resync` / `--verify`**. Scripted, documented,
  tested against fixtures; not run against prod tonight. Step 2 of the
  Cutover runbook is the owner's first task.

## Turning the flags on (after exams)

Do this one flag at a time, in order. After each, smoke-test for an hour
before the next.

1. **useCollections** — the big one. Follow `docs/runbooks/Cutover.md`
   end-to-end: backup → `npm run migrate:split -- --dry-run` → `--resync`
   → `--verify` → set `FEATURE_USE_COLLECTIONS=true` in Lambda env +
   redeploy → smoke test. Rollback is one env flip.
2. **adminPin** — needs the follow-up PR that implements the bcrypt
   verify + lockout + device trust + email alerts. Do not flip until
   that lands and you've set `OWNER_EMAIL` on both Lambda functions.
3. **calendarSync** — requires the follow-up PR that implements the ICS
   generation + per-user secret URL endpoint. Not safe to flip yet.
4. **eventComments** — same, needs the follow-up PR.
5. **wishesWall** — same.
6. **sharedLists** — same.
7. **paymentsLedger** — same.

## Owner actions before anything else

- Set `OWNER_EMAIL` on both Lambda functions (`KinEventsFunction` and
  `ScheduledJobRunnerFunction`) via `aws lambda update-function-configuration`.
  Right now the var is unset in production, which means `OwnerPolicy.isOwner()`
  returns false for every user — so the owner-protection code shipped
  tonight is effectively dormant until this env var is populated.
- Verify the 13-user count in the legacy `datastore/appdata` document is
  the expected number before running any migration.
