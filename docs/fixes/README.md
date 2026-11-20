# Phase 1 remaining-fix plans

The repo-hygiene, Email Service extraction and retention branches have shipped. The remaining six Phase 1 items below are each sized as **one PR**, with concrete file-by-file steps so they can be picked up without re-discovery. All share the rules in [`../STYLE.md`](../STYLE.md) and the hard rules in the original brief.

| # | Plan | Branch |
| - | ---- | ------ |
| 1.3 | [data-split.md](./data-split.md) | `bongani/data-split` |
| 1.4 | [scheduled-jobs.md](./scheduled-jobs.md) | `bongani/scheduled-jobs` |
| 1.6 | [admin-pin-auth.md](./admin-pin-auth.md) | `bongani/admin-pin-auth` |
| 1.7 | [roles-policies.md](./roles-policies.md) | `bongani/roles` |
| 1.8 | [phone-validation.md](./phone-validation.md) | `bongani/phone-validation` |
| 1.9 | [mobile-polish.md](./mobile-polish.md) | `bongani/mobile-fixes` |

## Order

Do them in this order — later ones depend on earlier ones:

1. **1.3 data-split** — everything else benefits from targeted writes and soft-delete.
2. **1.4 scheduled-jobs** — depends on the new `events`/`notifications` repos.
3. **1.6 admin-pin-auth** — needs the new `users`, `authAttempts`, `trustedDevices` collections.
4. **1.7 roles-policies** — thin layer on top of the new auth.
5. **1.8 phone-validation** — independent, can slot in anywhere.
6. **1.9 mobile-polish** — does nothing to the backend; keep for last so the mobile tests run against the final behaviour.

Then the release/verify branch bundles the real-user verification against staging.
