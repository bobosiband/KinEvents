# 1.4 — Scheduled jobs, no admin needed

**Branch:** `bongani/scheduled-jobs`  
**Depends on:** 1.3 data-split (repositories).

## What ships

Daily EventBridge `ScheduleV2` firing at 07:00 `Australia/Sydney` invokes a dedicated `ScheduledJobRunner` Lambda. The runner iterates a list of `ScheduledJob` subclasses and calls `run()` on each. Each job is **idempotent** — running it twice on the same day produces zero duplicate side effects.

The existing admin "generate birthdays" / "send reminders" / "cleanup" buttons stay, and they now call the exact same `ScheduledJob.run()` methods so the manual and automatic paths cannot diverge.

## Code

Add a second SAM function to `BackEnd/template.yaml`:

```yaml
ScheduledJobRunnerFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: dist/src/lambda-scheduler.handler
    CodeUri: .lambda-pkg/
    Timeout: 300
    Environment:
      Variables: { /* same as api lambda */ }
    Events:
      Daily07Sydney:
        Type: ScheduleV2
        Properties:
          ScheduleExpression: "cron(0 7 * * ? *)"
          ScheduleExpressionTimezone: "Australia/Sydney"
          State: ENABLED
```

Add `BackEnd/src/scheduler/`:

```
scheduler/
  ScheduledJob.ts            // abstract { readonly name: string; run(): Promise<JobResult> }
  ScheduledJobRunner.ts      // iterates jobs; catches per-job errors; audit-logs each result
  jobs/
    BirthdayEventJob.ts
    BirthdayReminderJob.ts
    EventReminderJob.ts
    CleanupJob.ts
    SoftDeletePurgeJob.ts
```

### BirthdayEventJob

- Reads `users` with a `birthday` set; computes each user's birthday within the next 30 days (inclusive).
- For each, checks `events` for `{ type: 'birthday', sourceUserId: userId, year: <computed year> }`.
- Inserts only the missing ones. This fixes the current bug where "generate" creates the whole year.
- The admin manual button calls `new BirthdayEventJob(...).run()`.

### BirthdayReminderJob

- Finds birthdays in `[today, today + 7 days]` and `today` exactly.
- For each, creates one `notification` per other approved user (`type: 'birthday_reminder'` or `birthday_today`). Dedup key: `{ type, recipientId, payload.sourceUserId, date: YYYY-MM-DD }`. The repository upserts by that key.

### EventReminderJob

- Finds events in `[today, today + 3 days]`.
- Creates one notification per RSVP-yes attendee plus the creator. Same dedup pattern.

### CleanupJob

- Calls into the Phase 1.5 methods: `deleteOldReadNotifications`, `deleteOldAccessRequestHistory`, `deleteOldEmailLogs`.

### SoftDeletePurgeJob

- For every entity with `deletedAt < now - 30 days`:
  1. Fetch the document.
  2. Write it to S3 at `s3://kinevents-soft-delete-archive/<collection>/<id>-<deletedAt>.json`.
  3. Only after the S3 `putObject` succeeds, hard-delete the row from Mongo.
- Users are **never** processed by this job — enforce in code.

## Tests

- Unit tests per job with `mongodb-memory-server` and spy on the email dispatcher / S3 client.
- "idempotent" test: run each job twice, assert zero duplicates.
- Integration test: run `ScheduledJobRunner` with the real five-job list against the memory DB; assert job order and that one failing job does not block the others.

## Admin surface

- Keep the three existing admin buttons. Each now calls the corresponding `ScheduledJob` via a thin handler.
- New admin button "Run daily schedule now" that invokes `ScheduledJobRunner`.
- Log every run to `auditLogs` with the job name, duration, and counts.
