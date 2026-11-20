# Per-event comments

## Goal

Every event has a comment thread — faster than a group chat for "what time does it start again?" and visible to any approved family member looking at the event.

## Data model

New collection `eventComments`:

```ts
interface IEventComment {
  id: string
  eventId: string
  authorId: string
  body: string
  mentions: readonly string[]       // userIds @-mentioned, resolved at submit
  parentCommentId?: string          // threaded one level deep
  createdAt: string
  updatedAt: string
  deletedAt?: string
}
```

## Endpoints

| Method | Path | Who |
| ------ | ---- | --- |
| `GET /api/events/:eventId/comments` | list | approved users |
| `POST /api/events/:eventId/comments` | create | approved users |
| `PATCH /api/events/:eventId/comments/:id` | edit own | author within 15 minutes |
| `DELETE /api/events/:eventId/comments/:id` | soft-delete | author, admin, manager |

## Notifications

On comment create, dispatch `event_comment` notifications to:

- the event creator (if different from the comment author)
- every user @-mentioned
- every RSVP-yes attendee who opted into "comment notifications" (default: on, admins only off)

Dedup key `{ type: 'event_comment', recipientId, payload.commentId }`.

## Admin controls

- Hide a comment (soft-delete).
- Mute a user on a specific thread.

## Verdict

**Integration** into the main backend. Small writes, same auth boundary as events.
