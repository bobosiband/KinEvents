# Occasion tributes

Family-contributed video / photo / message montages tied to any occasion type (birthday, wedding, anniversary, graduation, memorial).

## Goal

Within one week of an occasion going on the calendar, any family member can open the tribute page, paste a short video / photo / written message, and watch the montage grow. The organizer sees a progress bar; everyone sees the final montage on the day.

## Data model

New collection `occasionTributes`:

```ts
interface IOccasionTribute {
  id: string
  eventId: string
  occasionType: 'birthday' | 'wedding' | 'anniversary' | 'graduation' | 'memorial' | 'custom'
  openAt: string        // ISO; tributes accepted from this moment
  closeAt: string       // ISO; stops accepting submissions
  publishAt: string     // ISO; montage visible to recipient from this moment
  recipientUserIds: readonly string[]
  createdBy: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}
```

New collection `tributeSubmissions`:

```ts
interface ITributeSubmission {
  id: string
  tributeId: string
  authorId: string
  kind: 'video' | 'photo' | 'text'
  mediaUrl?: string       // Cloudinary secure URL for video/photo
  thumbnailUrl?: string
  message?: string
  createdAt: string
  moderatedAt?: string
  status: 'pending' | 'approved' | 'rejected'
}
```

## Open / close policy

One `abstract class OccasionType` with subclasses `BirthdayOccasion`, `WeddingOccasion`, etc. Each defines `openAt`, `closeAt`, `publishAt` offsets from the event date and whether late submissions are visible. Memorial tributes stay open indefinitely, for example.

## Endpoints

| Method | Path | Who |
| ------ | ---- | --- |
| `POST /api/tributes` | create | admin or event organizer |
| `GET /api/tributes/:id` | read, respects publishAt | any approved user |
| `POST /api/tributes/:id/submissions` | add submission | approved user |
| `POST /api/tributes/:id/submissions/:sid/approve` | moderate | admin or tribute organizer |
| `GET /api/events/:eventId/tribute` | find for event | any approved user |

## Admin controls

- Create / edit / delete tributes.
- Moderate submissions (approve, reject, hide).
- Nudge non-contributors by email.

## Verdict

**Integration** into the main backend. Shares the auth boundary, the events table, and the Cloudinary credentials. The montage render for emails leans on the shared `animations` package (below), so there's no new cold-start cost to isolate.
