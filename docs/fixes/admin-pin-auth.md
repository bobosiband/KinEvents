# 1.6 — Admin / manager PIN auth

**Branch:** `bongani/admin-pin-auth`  
**Depends on:** 1.3 data-split.

## Behaviour

- Members keep email-only login and stay signed in.
- Admins and managers additionally require a 6-digit PIN after email authentication.
- First-time PIN setup is only possible via a one-time code emailed to the admin's inbox. The code expires in 10 minutes and is single-use.
- 5 wrong PIN attempts within 15 minutes locks the account for 15 minutes. Blocked attempts do not count. A successful login resets the counter.
- After a successful PIN login from a new device, the device fingerprint is stored and trusted for 30 days — during that window the PIN is not required from that device.
- Every new-device login triggers a `new-device-alert` email to the admin.
- An `isOwner` admin (set from env `OWNER_EMAIL` at bootstrap) can never be demoted, locked, or deleted. Enforced on every mutation.

## Collections

New collection `trustedDevices`:

```ts
interface ITrustedDevice {
  id: string
  userId: string
  deviceFingerprint: string       // sha256(userAgent + Sec-CH-UA + salt)
  label: string                   // "Chrome on macOS" (parsed)
  firstSeenAt: string
  lastSeenAt: string
  expiresAt: string               // trusted until this ISO date (now + 30 days on each successful PIN)
  revokedAt?: string
  deletedAt?: string
}
```

New collection `pinSetupCodes`:

```ts
interface IPinSetupCode {
  id: string
  userId: string
  codeHash: string                // bcrypt hash of the 6-digit code
  expiresAt: string
  consumedAt?: string
}
```

`users` gets new fields:

- `pinHash?: string` — bcryptjs hash, `null` when not set
- `failedPinAttempts: number` — resets on success
- `firstFailedPinAttemptAt?: string` — rolling 15-minute window
- `lockedUntil?: string`
- `isOwner: boolean`

## Code

```
src/auth/
  AuthService.ts              // existing; email-only path still works for members
  PinAuthService.ts           // new; all admin/manager PIN flows
  AuthThrottleService.ts      // existing; per-email rate limiting (see 1.6 rate limit below)
  DeviceTrustService.ts       // new; fingerprint + expiry
  OwnerPolicy.ts              // enforces isOwner invariants on every mutation
```

Handlers:

- `POST /api/auth/login` — unchanged for members; for admin/manager, returns `pinRequired: true` plus a short-lived PIN-challenge token.
- `POST /api/auth/pin/verify` — body `{ challengeToken, pin, deviceFingerprint, deviceLabel }` → full session JWT on success.
- `POST /api/auth/pin/setup/request` — sends `login-pin` email with a one-time code.
- `POST /api/auth/pin/setup/confirm` — `{ code, newPin }` → sets pinHash.
- `POST /api/auth/pin/change` — authenticated; requires current PIN.
- `POST /api/auth/devices/forget` — revoke a trusted device.
- `GET /api/auth/devices` — list the admin's own trusted devices.

## Rate limiting

- `AuthThrottleService` keys attempts by **email**, not IP (families share Wi-Fi). After 10 fails in 10 minutes → lock the email for 15 minutes. Successful login resets.
- Separately, cap IP attempts at 200 per minute to catch obvious scans, without affecting normal families.
- Blocked attempts (coming from a locked email) do **not** count toward the counter.

## Frontend

- Silent re-login via a stored session token MUST now be gated by a PIN challenge if the user's role is admin or manager AND the device fingerprint is not trusted.
- Store the PIN-challenge token only in memory, never `localStorage`.
- The PIN input is a numeric keypad on mobile (`inputmode="numeric"` + autocomplete `off`).

## Tests

- Unit tests for bcrypt hash+verify, lockout window, trusted-device expiry.
- Integration tests: happy path PIN setup, lockout after 5 fails, successful retry resets.
- An `OwnerPolicy` test asserting the owner cannot be demoted/locked/deleted via any mutation handler.
