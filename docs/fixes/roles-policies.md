# 1.7 — Roles via PermissionPolicy classes

**Branch:** `bongani/roles`  
**Depends on:** 1.6 admin-pin-auth.

## Problem

Roles exist today (admin, manager, member) but are enforced in the UI and ad-hoc in a few handlers. Members can hit backend endpoints the frontend hides from them — in particular, gift-pool management and user promotion.

## Fix

Every API endpoint declares a `PermissionPolicy` subclass. The framework rejects any request that doesn't satisfy it before the handler body runs.

```
src/auth/policies/
  PermissionPolicy.ts            // abstract { check(ctx: RequestContext): void }
  RolePolicy.ts                  // "role >= X"
  SelfOrRolePolicy.ts            // "own resource OR role >= X"
  OwnerOnlyPolicy.ts             // for owner-exclusive mutations
  OrPolicy.ts                    // combinator
  AndPolicy.ts                   // combinator
```

Every endpoint in `BackEnd/api/**/*.ts` imports a policy and the common `applyPolicy(req, policy)` helper. Example:

```ts
import { RolePolicy } from '../../src/auth/policies/RolePolicy'
import { applyPolicy } from '../../src/middleware/applyPolicy'

export default async function (req, res) {
  await applyPolicy(req, new RolePolicy('manager'))
  // ... handler ...
}
```

## Role matrix (enforced in backend)

| Area | Admin | Manager | Member |
| ---- | ----- | ------- | ------ |
| Create / update / cancel event | yes | yes | self-only |
| Lock event | yes | no | no |
| RSVP | yes | yes | yes |
| View gift pool for an event | yes | yes | yes |
| Create / close gift pool | yes | yes | no |
| Approve / reject contributions | yes | yes | no |
| Record own contribution | yes | yes | yes |
| Record contribution on behalf of another | yes | yes | no |
| Create user / change role | yes | no | no |
| Lock / unlock user | yes | no | no |
| Delete user | **no — never** | no | no |
| Promote/demote owner | **no — never** | no | no |

## Frontend

- `useCan(action, resource?)` hook reads the user's role and applies the same table. UI hides elements members can't touch (gift-pool management, admin pages), but **the backend policies are the source of truth** — any UI slip still gets a 403.

## Tests

- One test per policy covering grant and deny.
- One integration test per endpoint that attempts it as each role; asserts 200 / 403 per the matrix above.
