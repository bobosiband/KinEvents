# Admin handover

## Goal

The current admin can nominate a successor and complete a handover in one session. The nominee receives credentials, becomes the owner, and the previous admin automatically steps down to manager (unless they leave entirely).

## Data model

New collection `adminHandovers`:

```ts
interface IAdminHandover {
  id: string
  initiatedBy: string           // current owner userId
  nomineeUserId: string
  nomineeConfirmationHash: string      // bcrypt of a one-time 8-char code
  expiresAt: string                    // 72 hours
  status: 'pending' | 'confirmed' | 'cancelled' | 'expired'
  completedAt?: string
  createdAt: string
}
```

## Flow

1. Owner opens `/admin/handover` → picks a nominee from existing admins/managers → requests handover.
2. System emails the nominee a one-time 8-char confirmation code with a 72-hour expiry.
3. Owner also sees the code in the UI (so they can confirm it over the phone if needed).
4. Nominee signs in, enters their PIN, pastes the code → `POST /api/admin/handover/confirm`.
5. Backend:
    - Flips `isOwner: true` on the nominee.
    - Flips `isOwner: false` on the previous owner. (They stay an admin by default.)
    - Writes an entry to `auditLogs`.
    - Sends a confirmation email to both parties.

## Endpoints

| Method | Path | Who |
| ------ | ---- | --- |
| `POST /api/admin/handover` | create | current owner only |
| `POST /api/admin/handover/confirm` | complete | nominee only |
| `POST /api/admin/handover/:id/cancel` | cancel | owner or nominee, before expiry |
| `GET /api/admin/handover` | list recent | admin / manager |

## Safety rails

- The owner cannot be deleted while a handover is pending (hard rule stays: never delete a user).
- At any time, the system guarantees exactly one `isOwner: true` user. Enforce with a Mongo partial unique index `{ isOwner: 1 } where isOwner: true`.
- If both parties leave, a break-glass CLI script (requires AWS console + MongoDB Atlas access) restores ownership. Document that script in `docs/deployment.md`.

## Verdict

**Integration** into the main backend. Needs a tightly-controlled owner invariant that belongs next to the user repository.
