# Events

## Overview

Events are the core entity of KinEvents. Family members can create events, RSVP to them, and admins can lock events to prevent further edits.

---

## Data Model

```typescript
interface IEvent {
  id: string
  title: string
  description: string
  date: string                       // ISO date string
  location?: string
  onlineLink?: string
  imageUrl?: string
  type: 'birthday' | 'custom'
  locked: boolean                    // prevents editing when true
  createdBy: string                  // userId
  birthdayUserId?: string            // set on auto-generated birthday events
  rsvps: Record<string, RSVPStatus>  // { [userId]: 'yes' | 'no' | 'maybe' }
  createdAt: string
  updatedAt: string
}

type RSVPStatus = 'yes' | 'no' | 'maybe'
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/events` | required | List all events |
| `POST` | `/api/events` | `create_event` | Create a new event |
| `GET` | `/api/events/:id` | required | Get a single event |
| `PUT` | `/api/events/:id` | owner or `edit_any_event` | Update an event |
| `DELETE` | `/api/events/:id` | owner or `delete_any_event` | Delete an event |
| `POST` | `/api/events/rsvp` | required | Submit an RSVP |
| `POST` | `/api/events/reminders` | admin | Send reminders for upcoming events |

---

## Creating an Event

**Frontend files:**
- `FrontEnd/src/features/events/components/EventForm/EventForm.tsx` — form UI
- `FrontEnd/src/features/events/hooks/useCreateEvent.ts` — React Query mutation
- `FrontEnd/src/features/events/api/events.api.ts` — Axios call

**Backend files:**
- `BackEnd/api/events/index.ts` — handler
- `BackEnd/src/services/event.service.ts` — business logic

**Flow:**
1. User fills out the form (title, description, date are required)
2. `useCreateEvent` mutation fires `POST /api/events`
3. Backend validates with Zod schema, creates the event record
4. Notification dispatched to all family members (`event_created`)
5. React Query cache is invalidated so the event list refreshes

**Authorization:** Requires `create_event` capability (admin or manager).

---

## Editing & Deleting Events

- The event owner can edit or delete their own event
- A user with `edit_any_event` / `delete_any_event` can act on any event
- A locked event (`locked: true`) can only be edited by a user with `edit_locked_event` (admin only)

The backend service checks these conditions before applying changes.

---

## RSVP

**Frontend files:**
- `FrontEnd/src/features/events/components/RsvpButton/RsvpButton.tsx`
- `FrontEnd/src/features/events/hooks/useRsvp.ts`

**Backend file:**
- `BackEnd/api/events/rsvp.ts`

**Flow:**
1. User clicks the RSVP button (yes / no / maybe)
2. `POST /api/events/rsvp` with `{ eventId, status }`
3. Backend updates `event.rsvps[userId] = status` in the single document
4. Notification sent to the event creator (`rsvp_received`)
5. RSVP counts update optimistically in the UI

A user can change their RSVP at any time; the last value overwrites the previous one.

---

## Event Locking

Admins can lock an event via the admin event management page. A locked event:

- Shows a lock icon in the UI
- Cannot be edited by the owner or managers
- Can only be edited by a user with the `edit_locked_event` capability (admin)

This is used to freeze birthday events after auto-generation.

---

## Event Reminders

**Endpoint:** `POST /api/events/reminders`

Iterates over all upcoming events, identifies attendees who have not yet RSVPed, and dispatches `event_reminder` notifications via their preferred channels (email / WhatsApp).

Called manually by an admin or via a scheduled job.

---

## Frontend Pages & Routing

| Route | Page Component |
|-------|---------------|
| `/events` | `FrontEnd/src/pages/user/Events.tsx` |
| `/events/:id` | Event detail (inline or modal) |
| `/admin/events` | `FrontEnd/src/admin/pages/ManageEvents/ManageEvents.tsx` |
