# Shared lists and potluck

## Goal

Per event, the organizer posts a list of things to bring. Family members claim items; the list updates live; the organizer sees what's covered and what's still open without having to chase anyone.

## Data model

New collection `sharedLists`:

```ts
interface ISharedList {
  id: string
  eventId: string
  title: string                // "What to bring"
  createdBy: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}
```

New collection `sharedListItems`:

```ts
interface ISharedListItem {
  id: string
  listId: string
  name: string                 // "Potato salad"
  quantity: number             // 1 by default
  notes?: string               // "no mayo if possible"
  claimedBy?: string           // userId
  claimedAt?: string
  completedAt?: string         // optional "I actually brought this" tick on the day
  createdAt: string
  updatedAt: string
  deletedAt?: string
}
```

## Endpoints

| Method | Path | Who |
| ------ | ---- | --- |
| `POST /api/events/:eventId/lists` | create | admin / manager / event creator |
| `POST /api/lists/:id/items` | add item | organizer |
| `POST /api/list-items/:id/claim` | claim | any approved user |
| `POST /api/list-items/:id/unclaim` | unclaim | claimer only |

## Notifications

On claim, notify the organizer. Nothing more — we don't want to spam everyone every time a slot fills.

## Admin controls

- Force-reassign a claim (e.g. the original claimer backed out).
- Duplicate a list from a past event.

## Verdict

**Integration** into the main backend.
