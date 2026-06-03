# Notifications

## Overview

KinEvents sends notifications when important things happen (event created, birthday coming up, contribution verified, etc.). Each notification is stored in the database and dispatched to the user's preferred channels (email, WhatsApp).

---

## Data Model

```typescript
interface INotification {
  id: string
  userId: string
  type: NotificationType
  status: 'pending' | 'sent' | 'failed'
  subject?: string
  body?: string
  metadata?: Record<string, unknown>
  readAt?: string
  createdAt: string
}

type NotificationType =
  | 'event_created'
  | 'event_updated'
  | 'event_reminder'
  | 'birthday_reminder'
  | 'birthday_today'
  | 'gift_pool_reminder'
  | 'access_approved'
  | 'access_rejected'
  | 'rsvp_received'
  | 'contribution_verified'
  | 'contribution_rejected'
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/notifications` | required | List notifications for the current user |
| `POST` | `/api/notifications/send` | admin | Manually create and send a notification |
| `GET` | `/api/notifications/:id` | required | Get a single notification |
| `POST` | `/api/notifications/:id/read` | required | Mark a notification as read |

---

## How Notifications Are Created

Notifications are never created directly by frontend actions — they are a side-effect of service operations.

**Example: event created**

```
EventService.createEvent()
  → creates event record
  → calls NotificationService.createForAllUsers('event_created', { event })
    → writes Notification records (status: 'pending') for each user
    → calls NotificationDispatcherService.dispatch(notification, user)
```

**Key files:**
- `BackEnd/src/services/notification.service.ts` — creates records, triggers dispatch
- `BackEnd/src/services/notification-dispatcher.service.ts` — reads preferences, routes to channels

---

## Dispatch Pipeline

```
NotificationDispatcherService.dispatch(notification, user)
  │
  ├── user.notificationPrefs.level === 'none' → skip
  ├── user.notificationPrefs.level === 'important' && !isImportant(type) → skip
  │
  ├── channels includes 'email'    → EmailService.send(...)
  └── channels includes 'whatsapp' → WhatsAppService.send(...)
```

Dispatch is async and does not block the API response. Failures are caught and the notification `status` is updated to `'failed'`.

---

## Email Notifications

**Service:** `BackEnd/src/services/email.service.ts`

**Templates:** `BackEnd/src/templates/email/` (one function per notification type)

Email transport is selected based on configured environment variables:

| Priority | Transport | Config |
|----------|-----------|--------|
| 1st | SendGrid | `SENDGRID_API_KEY` |
| 2nd | Nodemailer/Gmail | `GMAIL_USER` + `GMAIL_APP_PASSWORD` |
| 3rd | Resend | `RESEND_API_KEY` |

Each email template receives a typed context object and returns `{ subject, html, text }`. The `EMAIL_FROM_NAME` env var controls the sender name.

Email sending can be disabled globally with `EMAIL_ENABLED=false`.

---

## WhatsApp Notifications

**Service:** `BackEnd/src/services/whatsapp.service.ts`

Uses the WhatsApp Business API with pre-approved message templates. Required config:

- `WHATSAPP_PHONE_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_TOKEN`

Phone numbers are validated to E.164 international format. Only users with a verified `phoneNumber` will receive WhatsApp notifications.

---

## Read Tracking

Notifications have a `readAt` timestamp. When a user opens the notifications panel:
1. Frontend calls `POST /api/notifications/:id/read`
2. Backend sets `readAt = new Date().toISOString()`

The notification bell icon in the sidebar shows an unread badge count.

---

## Email Logs (Admin)

Admins can view the email sending log at `/admin/email-logs`:

- `GET /api/admin/email-logs` — list all log entries
- `POST /api/admin/email-resend` — resend a failed email
- `POST /api/admin/email-test` — send a test email to verify transport config

Each email attempt is written to `emailLogs` in the database with status (`sent` / `failed`) and any error message.

---

## Frontend: Notification Panel

**Files:**
- `FrontEnd/src/features/notifications/hooks/useNotifications.ts`
- `FrontEnd/src/features/notifications/api/notifications.api.ts`

Notifications are polled periodically (React Query `refetchInterval`) and displayed in a slide-over panel accessible from the top navigation bar.
