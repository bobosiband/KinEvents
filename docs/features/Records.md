# Records: append-only ledger and meeting notes

## Goal

A finance-grade view of every rand/dollar the family has pooled. Each approved gift contribution produces a ledger entry; corrections never edit history — they post an adjusting entry. Meeting notes with attendees and minutes link to the event they relate to.

## Data model

New collection `ledgerEntries`:

```ts
interface ILedgerEntry {
  id: string
  entryType: 'contribution' | 'disbursement' | 'adjustment'
  sourceId?: string            // giftContributionId for contribution entries
  giftPoolId?: string
  eventId?: string
  payerId?: string
  payeeId?: string
  amountCents: number           // signed; contributions +, disbursements and refunds -
  currency: string              // ISO 4217
  memo: string
  postedAt: string              // ISO; immutable once written
  postedBy: string              // userId
  reversesEntryId?: string      // for adjusting entries
  createdAt: string
}
```

No `deletedAt` on `ledgerEntries` — append-only by rule. Corrections post a new entry with `reversesEntryId` set.

New collection `meetings`:

```ts
interface IMeeting {
  id: string
  title: string
  eventId?: string              // optional link
  startsAt: string
  endsAt: string
  attendeeIds: readonly string[]
  minutesMarkdown: string
  createdBy: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}
```

## Ledger flow

- On `giftContributionApproved` — insert one `contribution` entry.
- On a reversal (manager action) — insert a signed-negative `adjustment` entry that references the original.
- Running balance = sum of amountCents grouped by `giftPoolId` / `eventId`.

## Endpoints

| Method | Path | Who |
| ------ | ---- | --- |
| `GET /api/records/ledger?eventId=&giftPoolId=` | list | admin / manager / member (filtered to their own if member) |
| `POST /api/records/ledger/:id/reverse` | post an adjusting entry | admin / manager |
| `POST /api/meetings` | create | admin / manager |
| `GET /api/meetings/:id` | read | attendees and admins |

## Admin controls

- Export CSV / PDF per event or year.
- Lock a period (no new postings dated before the lock) — admin only.

## Verdict

**Integration** into the main backend. The data lives next to users and events, authorization reuses `PermissionPolicy`, no new vendor credentials.
