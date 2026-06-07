# Authentication & Access Control

## Overview

KinEvents uses a two-step access model: users request access, an admin approves them, then they log in with a JWT-based session. Every protected API endpoint verifies the JWT and checks the user's live status and capabilities.

---

## Access Request Flow

```
1. User visits /request-access
2. Submits name, email, optional message
   → POST /api/auth/request-access
   → Creates AccessRequest record (status: 'pending')
   → Admin receives notification

3. Admin reviews at /admin/access-requests
   → POST /api/auth/approve-access  { requestId, userId }
   → User record updated: accessStatus = 'approved'
   → User receives approval email

4. User visits /login, enters email
   → POST /api/auth/login  { email }
   → JWT issued, returned to client
```

**Access status values:** `pending | approved | rejected | revoked`

---

## Login & Token Issuance

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{ "email": "user@example.com" }
```

**What happens:**
1. Looks up user by email in the database
2. Checks `accessStatus === 'approved'`
3. Signs a JWT with the user object as payload (`JWT_SECRET` env var)
4. Returns `{ token, user }`

**Frontend handling** (`FrontEnd/src/features/auth/api/auth.api.ts`):
- Stores `token` and `user` in Zustand `authStore` (persisted to `localStorage`)
- React Query cache is invalidated so fresh data loads

---

## JWT Verification Middleware

Every protected handler is wrapped with `withAuth`:

```
BackEnd/src/middleware/withAuth.ts
```

Steps performed on every request:

1. Reads `Authorization: Bearer <token>` from the request header
2. Verifies signature with `JWT_SECRET`
3. Loads the live user record from the database (detects role/status changes since token was issued)
4. Rejects with `401` if `accessStatus !== 'approved'`
5. Injects `req.user` (live user object) and calls the wrapped handler

The live lookup is the key detail — a revoked or role-changed user is blocked even if their token has not expired.

---

## Role-Based Access Control (RBAC)

Roles and their capabilities are defined in:

```
BackEnd/src/constants/roles.ts
```

### Roles

| Role | Capabilities |
|------|-------------|
| `admin` | All capabilities below |
| `manager` | `create_event`, `edit_own_event`, `delete_own_event` |
| `member` | None (can RSVP, chat, view) |

### Capability List

| Capability | Description |
|-----------|-------------|
| `create_event` | Create new events |
| `edit_any_event` | Edit events created by others |
| `delete_any_event` | Delete events created by others |
| `edit_locked_event` | Edit events with `locked: true` |
| `manage_users` | Change roles, approve/reject access |
| `edit_content` | Update site content blocks |

Capabilities are stored on the user record so they can be granted individually without a full role change.

---

## Frontend Auth State

**Store:** `FrontEnd/src/features/auth/store/authStore.ts`

```typescript
interface AuthState {
  user: IUser | null
  token: string | null
  isHydrated: boolean
}
```

- Persisted to `localStorage` via Zustand persistence middleware
- `isHydrated` prevents the app from rendering before the persisted state is loaded
- `AuthProvider` (`FrontEnd/src/app/providers/AuthProvider.tsx`) re-fetches the live user on mount and syncs role/status changes into the store

---

## Admin Operations

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/approve-access` | Approve a pending access request |
| `POST /api/auth/approve-access` (reject) | Reject a pending request |
| `POST /api/auth/revoke-access` | Revoke an approved user's access |
| `POST /api/users/promote` | Change a user's role |

All admin endpoints require the calling user to have `manage_users` capability (admin only).

---

## Route Guards

**Frontend:**

- `ProtectedRoute` — wraps all authenticated pages; redirects to `/login` when `token` is absent or `accessStatus` is not `approved`
- `AdminRoute` — wraps admin pages; redirects to home if the user's role is not `admin` or `manager`

**Route file:** `FrontEnd/src/app/router/router.tsx`
