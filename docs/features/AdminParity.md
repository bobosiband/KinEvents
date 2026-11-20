# Admin is god: Swagger ↔ admin UI parity

## Goal

Every public API endpoint has a matching admin UI control. The admin can do, from the admin pages, anything a user can do — plus override it. A CI check fails any PR that adds a Swagger endpoint without a corresponding admin UI entry.

## Mechanism

Add `BackEnd/src/config/swagger.ts` tag `x-admin-ui`: a string per endpoint pointing at the admin page that exposes it.

```ts
'/api/events/{id}': {
  patch: {
    tags: ['events'],
    'x-admin-ui': '/admin/events/[id]',   // which admin page offers this action
    ...
  }
}
```

CI script `scripts/check-admin-parity.ts`:

1. Parses the generated Swagger JSON.
2. For every operation, reads `x-admin-ui`. Missing / empty → fail.
3. For each `x-admin-ui` value, greps `FrontEnd/src/admin/pages/**/*` for an HTML call that resolves to that operation. No match → fail.

Add to the backend CI workflow.

## Admin control map (initial seed)

| Admin page | Covers |
| ---------- | ------ |
| `/admin/users` | GET/PATCH /users, POST /users/promote, lock/unlock |
| `/admin/events` | full CRUD /events, lock/unlock |
| `/admin/access-requests` | approve, reject, revoke |
| `/admin/gift-pools` | all gift-pool endpoints incl. approve-contribution |
| `/admin/tributes` | all tribute endpoints |
| `/admin/photos` | album + photo mgmt |
| `/admin/invalid-phones` | 1.8 endpoint |
| `/admin/analytics` | analytics endpoints |

## Verdict

**Integration** into both the backend (Swagger extensions, CI script) and the frontend (admin pages) — no new service.
