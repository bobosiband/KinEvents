# KinEvents Email Service

A standalone SAM stack (`kinevents-email-service`) that owns outbound email for KinEvents.

## Why it exists

Emails stopped sending for KinEvents in August 2026 because the main backend's
`sam deploy` overwrote the Lambda environment with `template.yaml`, which didn't
declare `GMAIL_USER` / `GMAIL_APP_PASSWORD` / `RESEND_API_KEY`. The Nodemailer
transport then silently became `null` and every dispatch was a no-op.

Extracting email into its own stack:

- isolates the email credentials so a backend redeploy can never wipe them again
- makes the transport verifiable via `GET /health` (`transporter.verify()`)
- moves email logs to DynamoDB with a TTL so they don't bloat MongoDB
- sits behind a shared API key — only the KinEvents backend can call it

## Public API

All endpoints are at the API Gateway URL output by `sam deploy`. `POST /emails`
and `GET /emails/logs` require header `X-Api-Key: <EMAIL_SERVICE_API_KEY>`.
`GET /health` is open so monitoring can poll it.

### `POST /emails`

```json
{
  "templateName": "access-approved",
  "recipient": { "name": "Alex", "email": "alex@example.com" },
  "recipientId": "user-123",
  "data": { "recipientName": "Alex", "loginUrl": "https://kinevents.vercel.app/login" },
  "replyTo": "support@kinevents.com"
}
```

Returns `{ success, logId, status, retryCount }`. Retries up to 3 times with
exponential backoff before giving up and writing a `failed` row to `EmailLogs`.

### `GET /health`

Returns `{ status: "ok" | "degraded", transportReady, error? }`.
Calls `transporter.verify()` so if Gmail credentials are rejected the service
fails loud rather than silently.

### `GET /emails/logs?recipientId=&limit=`

Admin-only listing. Default limit 50, max 200. Scans the `EmailLogs` table
(or queries the `byRecipient` index when `recipientId` is given).

## Templates

Templates are `BaseEmailTemplate` subclasses under `src/templates/`. Every
template declares its required data shape in `validate()`. Adding a new template
means: new file, new subclass, register it in `TemplateRegistry.default()`.

## Deploy

`.env` holds credentials — never committed. `scripts/deploy.sh` reads it,
fails loud if anything required is missing, and passes values as SAM
`NoEcho` parameter overrides:

```bash
cp .env.example .env    # fill in GMAIL_USER, GMAIL_APP_PASSWORD, EMAIL_SERVICE_API_KEY
npm install
npm run deploy
```

The stack is `kinevents-email-service` in `ap-southeast-2`.

## Logs

Every send attempt writes one row to the DynamoDB `EmailLogs` table with an
`expiresAt` TTL column. TTL deletes rows automatically after
`EMAIL_LOGS_RETENTION_DAYS` days (default 30). There's a `byRecipient` GSI for
filtering by user.
