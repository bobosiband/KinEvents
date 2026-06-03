# Users & Family Management

## Overview

Every person in KinEvents is a user. Users have a role (admin, manager, member), a set of capabilities, notification preferences, and an optional birthday. The `/family` page shows all approved family members.

---

## Data Model

```typescript
interface IUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'member'
  capabilities: string[]            // fine-grained permissions
  accessStatus: AccessStatus
  birthday?: string                 // MM-DD format
  phone?: string
  phoneNumber?: string
  phoneVerified?: boolean
  notificationPrefs: NotificationPrefs
  createdAt: string
  updatedAt: string
}

type AccessStatus = 'pending' | 'approved' | 'rejected' | 'revoked'

interface NotificationPrefs {
  level: 'all' | 'important' | 'none'
  channels: Array<'email' | 'whatsapp' | 'push'>
}
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/users` | required | List all users |
| `GET` | `/api/users/:id` | required | Get a single user |
| `PUT` | `/api/users/:id` | owner or admin | Update profile |
| `POST` | `/api/users/promote` | `manage_users` | Change a user's role |

---

## Viewing Family Members

**Frontend files:**
- `FrontEnd/src/pages/user/Family.tsx`
- `FrontEnd/src/features/users/hooks/useUsers.ts`
- `FrontEnd/src/features/users/api/users.api.ts`

**Flow:**
1. `GET /api/users` returns all users where `accessStatus === 'approved'`
2. Frontend displays a card grid with each member's name, role badge, and birthday (if set)

---

## User Profile

**Frontend file:** `FrontEnd/src/pages/user/Profile.tsx`

A user can update their own profile:

| Field | Editable by |
|-------|-------------|
| Name | Self |
| Birthday | Self |
| Phone number | Self |
| Notification level | Self |
| Notification channels | Self |
| Role | Admin only (via promote endpoint) |
| Capabilities | Admin only |

**Flow:**
1. User navigates to `/profile`
2. `useProfile` hook loads their own user record
3. Edits are submitted via `PUT /api/users/:id`
4. Backend verifies the requester is the owner OR has `manage_users`

---

## Role Promotion

**Endpoint:** `POST /api/users/promote`

**Request:**
```json
{
  "userId": "abc123",
  "role": "manager"
}
```

Requires the `manage_users` capability (admin only). The promoted user's `role` and `capabilities` fields are updated. A notification can optionally be dispatched to inform the user of their new role.

---

## Notification Preferences

Users control how they receive notifications on their profile page:

**Level options:**
- `all` — receive every notification
- `important` — receive only high-priority notifications (birthday reminders, access approvals)
- `none` — receive no notifications

**Channel options (multi-select):**
- `email` — via SendGrid/Nodemailer
- `whatsapp` — via WhatsApp Business API
- `push` — placeholder (infrastructure ready, not yet wired to a push provider)

The `NotificationDispatcherService` reads these preferences before dispatching any notification and skips channels the user has not opted into.

---

## Admin: User Management

**Frontend file:** `FrontEnd/src/admin/pages/ManageUsers/ManageUsers.tsx`

The admin user management page supports:
- View all users (all statuses)
- Change a user's role
- Revoke access
- View access request history
- Approve/reject pending access requests (also available at `/admin/access-requests`)

---

## Access Requests

**Frontend file:** `FrontEnd/src/admin/pages/AccessRequests/AccessRequests.tsx`

New users arrive via the public `/request-access` page. Their request lands in the `accessRequests` array in the database with `status: 'pending'`. Admins see a badge count in the sidebar and can approve or reject from the access requests page.

Once approved the user is moved to the `users` array and their `accessStatus` is set to `'approved'`. The original request is archived to `accessRequestHistory`.
