# KinEvents
Family Events Management system

## Development

- Backend: see `BackEnd/` for API, tests and local server instructions.
- Frontend: see `FrontEnd/` for the React app powered by Vite.

## Gift Pool: Payment Verification Workflow

We added a verification workflow for `GiftPool` contributions to ensure payments are audited and only counted after an admin confirms receipt.

Key points:
- Contributions are created with `status: PENDING_VERIFICATION` and a `submittedAt` timestamp.
- Admins may `approve` or `reject` pending contributions. Approved contributions are marked `CONFIRMED` and included in `totalRaised` calculations. Rejected contributions are marked `REJECTED` with an optional `rejectionReason`.
- Audit logs are stored in the backend DB under the `auditLogs` array (each entry records action, actorId, contributionId, poolId, and timestamp).
- Notifications are created for contributors on approval and rejection using the existing `notificationService`.

Backend changes and endpoints:
- `GET /api/gift-pools/:id/pending-contributions` — lists pending contributions (admin only)
- `POST /api/gift-pools/:id/approve-contribution` — approve contribution (body: `{ contributionId }`) (admin only)
- `POST /api/gift-pools/:id/reject-contribution` — reject contribution (body: `{ contributionId, reason? }`) (admin only)

DB migration notes:
- The seed file `BackEnd/data/db.json` now includes empty arrays for `giftPools`, `giftContributions`, and `auditLogs`. Ensure any production migration preserves existing contribution records and populates missing fields (`status`, `submittedAt`, etc.).

Frontend integration:
- Frontend endpoint constants and API helpers were added in `FrontEnd/src/services/api/endpoints.ts` and `FrontEnd/src/features/gifts/api/gifts.api.ts`.
- Admin UI: a simple pending contributions admin view is available at `/admin/pending-contributions` and contribution status/badges are shown in the `GiftPoolWidget` component.

Running tests:
Backend (run from project root):
```bash
cd BackEnd
npm test --silent
```

Frontend:
The Frontend currently uses Vite; there isn't a test runner configured by default. If you want unit tests for React components, I can add Vitest and a few tests for the admin flows — say if you'd like me to scaffold that next.

