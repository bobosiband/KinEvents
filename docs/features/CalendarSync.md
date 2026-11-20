# Calendar sync (ICS feed)

## Goal

Each user has a private ICS URL they can subscribe to from Google Calendar, Apple Calendar, Outlook. Their birthdays and the family events they RSVP'd yes to show up in their own calendar, updated within an hour.

## Data model

Extend `users` with:

- `icsToken: string` — a long opaque UUID; URL-safe; regeneratable.

No new collection; the ICS feed is a compute endpoint.

## Endpoints

| Method | Path | Who |
| ------ | ---- | --- |
| `GET /ics/feed/:token.ics` | public (token = authentication) | the token holder |
| `POST /api/me/ics/rotate` | authenticated member | invalidates the old token |

The feed response is `text/calendar; charset=utf-8`. Cache-Control: `private, max-age=3600`.

## Content

For each birthday on `users`: one `VEVENT` per year, 10 years ahead, with `RRULE:FREQ=YEARLY`. For each event the user RSVP'd yes to: one `VEVENT` with `UID` = `event-<id>@kinevents`.

Cancelled events stay in the feed as `STATUS:CANCELLED` so clients remove them cleanly.

## Admin controls

- Admin can rotate a user's token if it leaked. Admin never sees the token in the UI after it's created — they revoke and ask the user to generate a new one.

## Verdict

**Integration** into the main backend as a new route that bypasses the usual JSON API Gateway (returns `text/calendar`). Response is cheap and feeds are tiny.
