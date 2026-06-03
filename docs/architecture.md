# Architecture

## Tech Stack

### Frontend

| Layer | Technology |
|-------|-----------|
| Framework | React 18.3.1 + TypeScript 5.9.3 |
| Build | Vite 7.2.7 |
| Styling | Tailwind CSS 4.3.0 |
| Routing | React Router 6.30.2 |
| Server state | TanStack React Query 5.90.12 |
| Client state | Zustand 5.0.9 (with persistence) |
| HTTP client | Axios 1.13.2 |
| Animations | Motion 12.38.0 |
| Notifications | React Hot Toast 2.6.0 |
| Date utils | date-fns 4.1.0 |
| Icons | Lucide React 1.14.0 |

### Backend

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 22.x |
| Framework | Express.js 4.21.2 + TypeScript 5.8.3 |
| Database | MongoDB 7.2.0 |
| Auth | jsonwebtoken 9.0.2 |
| Validation | Zod 3.24.1 |
| Email | SendGrid, Nodemailer, Resend |
| Deployment | AWS Lambda (serverless-http) / Vercel |
| Testing | Jest 29 + Supertest |
| API docs | Swagger UI + swagger-jsdoc |

---

## Project Structure

```
FrontEnd/src/
├── app/
│   ├── providers/       # AuthProvider, QueryProvider, ThemeProvider
│   └── router/          # Route definitions, ProtectedRoute, AdminRoute
├── features/            # Feature modules (auth, events, gifts, chat, ...)
│   └── <feature>/
│       ├── api/         # Axios calls
│       ├── hooks/       # React Query custom hooks
│       ├── types/       # TypeScript interfaces
│       └── components/  # Feature-scoped UI components
├── pages/               # Page components (public, user, admin)
├── components/          # Shared/reusable UI components
├── layouts/             # Layout wrappers
├── hooks/               # Global hooks (useMobile, useTheme, ...)
├── services/            # Axios instance configuration
└── utils/               # Utility functions

BackEnd/
├── api/                 # Handler functions (one file per endpoint)
│   ├── auth/
│   ├── events/
│   ├── users/
│   ├── birthdays/
│   ├── notifications/
│   ├── gift-pools/
│   ├── chat/
│   └── admin/
├── src/
│   ├── services/        # Business logic layer
│   ├── interfaces/      # TypeScript data models
│   ├── config/          # DB, email, env, swagger setup
│   ├── constants/       # Roles, event types, notification types
│   ├── middleware/      # withAuth JWT guard
│   └── templates/email/ # Email template functions
└── tests/               # Jest test suite
```

---

## Frontend Architecture

### Feature-Based Organisation

Each feature lives in `FrontEnd/src/features/<name>/` and is fully self-contained:

```
features/events/
├── api/events.api.ts        # Axios functions (raw HTTP)
├── hooks/useEvents.ts       # React Query wrappers
├── hooks/useCreateEvent.ts
├── hooks/useRsvp.ts
├── types/event.types.ts     # Shared TypeScript interfaces
└── components/
    ├── EventForm/
    ├── EventCard/
    └── RsvpButton/
```

Pages import hooks, hooks call api functions, components receive data as props.

### State Management

- **Zustand** (`authStore`) — persisted to `localStorage`, holds `user` object and JWT `token`
- **React Query** — all server data (events, users, messages, etc.)

### Route Guards

- `ProtectedRoute` — redirects to `/login` if no valid auth token
- `AdminRoute` — redirects to home if user lacks admin/manager role

### Providers (load order)

```
<ThemeProvider>
  <QueryProvider>       ← React Query client
    <AuthProvider>      ← Hydrates auth, syncs live user data
      <RouterProvider>  ← App routes
```

---

## Backend Architecture

### Serverless-First Handler Pattern

Each file under `api/` exports a Vercel-compatible handler:

```typescript
// api/events/index.ts
export default async function handler(req, res) {
  await withAuth(req, res, async (user) => {
    // delegate to service
  });
}
```

The same handlers run on AWS Lambda via `serverless-http` and locally via Express.

### Service Layer

Business logic lives in `src/services/`. Handlers are kept thin — they validate input, call a service, and return a response:

```
Handler → Service → Database
               ↓
          NotificationDispatcher → EmailService / WhatsAppService
```

### Middleware

`withAuth(handler)` wraps any handler that requires authentication:

1. Reads `Authorization: Bearer <token>` header
2. Verifies JWT signature
3. Loads live user record from DB (catches revoked tokens)
4. Checks `accessStatus === 'approved'`
5. Injects `req.user` and calls the inner handler

---

## Key Architectural Patterns

### Single-Document Database

The entire app state is stored in one MongoDB document (`appdata` in the `datastore` collection). All reads use `readData()` and all writes use `persistData()` or `mutateData()`. See [Database](./database.md).

### Message Queue for Writes

A `persistQueue` serialises all write operations to prevent concurrent modifications to the single document:

```typescript
// One write at a time, queued if a write is in progress
await persistQueue.add(() => persistData(newState));
```

### Notification Dispatcher

When an event occurs (event created, RSVP, contribution verified, etc.) the service creates a `Notification` record then hands off to `NotificationDispatcherService` which reads the user's channel preferences and sends asynchronously via email or WhatsApp.

### Atomic Chat Operations

Chat messages use MongoDB's `$push` and `$set` with array filters directly rather than read-modify-write, avoiding race conditions in high-frequency chat scenarios.
