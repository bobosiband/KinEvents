# Shareable guest event cards

## Goal

A member can send a plus-one or an extended-family cousin a shareable invitation card — one URL plus a QR code — that unlocks a read-only view of the event (title, time, place, map, "I'm coming" button) without requiring an account.

## Data model

New collection `guestInvites`:

```ts
interface IGuestInvite {
  id: string
  eventId: string
  issuedBy: string           // userId
  guestName?: string
  token: string              // long opaque
  maxRsvps: number           // e.g. 1 for +1, 4 for a family
  rsvpedNames: readonly string[]
  expiresAt: string
  createdAt: string
  revokedAt?: string
  deletedAt?: string
}
```

## Endpoints

| Method | Path | Who |
| ------ | ---- | --- |
| `POST /api/events/:eventId/guest-invites` | mint | event creator, admin, manager |
| `GET /g/:token` | public read-only page (frontend route) | anyone with the token |
| `POST /api/guest-invites/:token/rsvp` | guest RSVPs | anyone with the token |
| `POST /api/guest-invites/:id/revoke` | revoke | issuer, admin, manager |

## Admin controls

- See all open invites, who issued them, how many RSVPs each has used.
- Revoke an invite.

## Verdict

**Integration** into the main backend. The public `/g/:token` page is the only non-authenticated surface — it reads a filtered event view based on the token.
