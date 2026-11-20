# Year in review

## Goal

Every January 1st every family member receives an email and sees an in-app page summarizing the previous year: events attended, photos they appeared in, gift pools contributed to, their own birthday wishes, a trip highlights reel.

## Data model

No new persistent entities. Computed on the fly from `events`, `rsvps`, `photos`, `giftContributions`, `wishes`, `meetings`. Cached in a new `yearInReviewSnapshots` collection keyed `{ userId, year }` so the computation doesn't rerun on every page load:

```ts
interface IYearInReviewSnapshot {
  id: string
  userId: string
  year: number
  computedAt: string
  payload: Record<string, unknown>   // stats + top-3s + image URLs
  deletedAt?: string
}
```

Compound unique index `{ userId, year }`.

## Jobs

Add `YearInReviewJob extends ScheduledJob` that runs on `01-02 07:00 Australia/Sydney` (one day after year-end so late submissions settle). It:

1. Builds a snapshot per approved user.
2. Hands the snapshots to `EmailService` with `year-in-review` template.

## Endpoints

| Method | Path | Who |
| ------ | ---- | --- |
| `GET /api/year-in-review/:year` | own snapshot | any approved user |
| `GET /api/admin/year-in-review/:year?userId=` | any user | admin only |

## Verdict

**Integration** into the main backend. New template in EmailService (not a new stack). The snapshot payloads are small and family-scale; no need for a separate pipeline.
