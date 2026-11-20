# Celebration page with wishes wall

Public, link-share-only page per occasion where family and friends leave written wishes. The birthday person gets the wall as a scroll of cards.

## Goal

By the morning of a birthday, the celebrant opens `/celebrate/<eventId>` and reads 30 wishes. Each year's wall is kept and browsable.

## Data model

New collection `wishes`:

```ts
interface IWish {
  id: string
  recipientUserId: string
  eventId: string
  year: number             // birthday year on the event; dedup/key field
  authorId: string
  authorName: string       // frozen at submit time, independent of profile edits later
  message: string
  createdAt: string
  moderatedAt?: string
  status: 'pending' | 'approved' | 'hidden'
  deletedAt?: string
}
```

Compound unique index `{ recipientUserId, year, authorId }` so each author can leave one wish per year — editing updates in place.

## Endpoints

| Method | Path | Who |
| ------ | ---- | --- |
| `GET /api/celebrate/:eventId` | returns event + approved wishes | signed-in family members and share-link holders |
| `POST /api/celebrate/:eventId/wishes` | create or update own wish | signed-in family members |
| `POST /api/admin/wishes/:id/hide` | moderate | admin / manager |

A shared `celebrationToken` field on the event unlocks read access without login so the celebrant can share the link with non-members on the day.

## Admin controls

- Hide inappropriate wishes.
- Bulk-export a year's wall as PDF for printing.

## Verdict

**Integration** into the main backend. The wall is just a filtered read over `wishes` and renders inside the existing frontend — no separate deploy.
