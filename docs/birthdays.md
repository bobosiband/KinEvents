# Birthdays

## Overview

KinEvents stores each user's birthday and automatically generates birthday events and reminders. Family members can see upcoming birthdays on the home dashboard.

---

## Data Model

Birthdays are stored as a field on the user record:

```typescript
interface IUser {
  // ...
  birthday?: string  // MM-DD format, e.g. "03-15"
}
```

The year is intentionally omitted so the birthday recurs annually without needing to update the record.

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/birthdays/upcoming` | required | List upcoming birthdays (next N days) |
| `POST` | `/api/birthdays/generate` | admin | Auto-generate birthday events for upcoming birthdays |
| `POST` | `/api/birthdays/reminders` | admin | Send birthday reminder notifications |

---

## Upcoming Birthdays

**Frontend files:**
- `FrontEnd/src/features/birthdays/api/birthdays.api.ts`
- `FrontEnd/src/features/birthdays/hooks/useBirthdays.ts`
- `FrontEnd/src/features/birthdays/components/BirthdayCard/BirthdayCard.tsx`

**Backend files:**
- `BackEnd/api/birthdays/upcoming.ts`
- `BackEnd/src/services/birthday.service.ts`

**Flow:**
1. Home page mounts and calls `useBirthdays()`
2. `GET /api/birthdays/upcoming?days=7` (default 7, configurable 1–10)
3. Service iterates all users with a `birthday` field, calculates days until next occurrence using UTC timezone
4. Returns users whose birthday falls within the requested window
5. Displayed in a `BirthdayCard` list on the home/dashboard

---

## Auto-Generate Birthday Events

**Endpoint:** `POST /api/birthdays/generate`

**Backend file:** `BackEnd/api/birthdays/generate.ts`

**Flow:**
1. Admin triggers the endpoint (or a scheduled job calls it)
2. Service finds all users with birthdays in the upcoming window
3. For each user, checks whether a birthday event already exists for this year (`type: 'birthday'`, `birthdayUserId` matches)
4. If no event exists, creates one:
   - `type: 'birthday'`
   - `title`: "{name}'s Birthday"
   - `locked: true` (prevents accidental edits)
   - `birthdayUserId`: the birthday person's userId
5. Notification dispatched to all family members

---

## Birthday Reminders

**Endpoint:** `POST /api/birthdays/reminders`

**Backend file:** `BackEnd/api/birthdays/reminders.ts`

- Iterates upcoming birthdays (default window: 3 days)
- Dispatches `birthday_reminder` notification to all family members
- On the birthday itself, dispatches `birthday_today` notification
- Respects each user's notification preferences (level, channels)

---

## UTC Timezone Handling

Birthday comparisons are done in UTC to avoid edge cases around local timezone offsets. The `birthday.service.ts` converts the stored `MM-DD` string to a UTC date for the current year, then computes the day difference relative to today's UTC date.

---

## Frontend Display

Upcoming birthdays appear on:
- `/home` (home dashboard widget)
- Inline on relevant event cards (when `type === 'birthday'`)

The `BirthdayCard` component shows the person's name, avatar, birthday date, and days remaining.
