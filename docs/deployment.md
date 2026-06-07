# Deployment & Configuration

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `development` or `production` |
| `JWT_SECRET` | Secret used to sign and verify JWTs (keep this long and random) |
| `APP_URL` | Public URL of the app (used in email links) |

### Database

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URI` | — | MongoDB connection string. If omitted, falls back to in-memory store. |
| `MONGODB_DB_NAME` | `kinevents` | Database name |

### Email

| Variable | Description |
|----------|-------------|
| `SENDGRID_API_KEY` | SendGrid API key (primary email transport) |
| `GMAIL_USER` | Gmail address (fallback transport) |
| `GMAIL_APP_PASSWORD` | Gmail app password (fallback transport) |
| `RESEND_API_KEY` | Resend API key (second fallback) |
| `EMAIL_FROM_NAME` | Display name for outgoing emails |
| `EMAIL_ENABLED` | Set to `false` to disable all outgoing email |

Email transport priority: **SendGrid → Nodemailer/Gmail → Resend**.

### WhatsApp

| Variable | Description |
|----------|-------------|
| `WHATSAPP_PHONE_ID` | WhatsApp Business API phone ID |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Business account ID |
| `WHATSAPP_TOKEN` | Bearer token for API requests |

---

## Frontend Environment

The frontend reads one env var at build time:

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Base URL of the backend API |

Set this in `FrontEnd/.env` (or `FrontEnd/.env.production` for production builds).

---

## Local Development

### Frontend

```bash
cd FrontEnd
npm install
npm run dev          # Vite dev server with HMR
```

### Backend

```bash
cd BackEnd
npm install
npm run dev          # ts-node local Express server
```

The local backend entry point is `BackEnd/src/local/server.ts`. It wraps the same handlers with a full Express router, so local and Lambda behaviour is identical.

---

## Production Builds

### Frontend

```bash
cd FrontEnd
npm run build        # TypeScript check → Vite build → dist/
```

Output goes to `FrontEnd/dist/`. Deploy the contents of `dist/` to any static host (Vercel, S3 + CloudFront, Netlify, etc.).

### Backend

```bash
cd BackEnd
npm run build        # tsc → dist/
```

---

## Deployment Targets

### AWS Lambda (primary)

The backend is packaged as a single Lambda function using `serverless-http`:

```
BackEnd/src/lambda.ts  → handler export consumed by Lambda
```

**Deploy steps:**

```bash
cd BackEnd
npm run sam:build      # SAM build (uses template.yaml)
npm run local          # Test locally with SAM Local
npm run deploy         # Package and upload to Lambda
```

SAM template: `BackEnd/template.yaml`

### Vercel

The API handlers in `BackEnd/api/` are compatible with Vercel's Node.js functions (they use Vercel-style `(req, res)` signatures).

Vercel config: `BackEnd/vercel.json`

Deploy with: `vercel --prod` from the `BackEnd/` directory.

### Local Express (development)

```bash
npm run dev
```

Runs `BackEnd/src/local/server.ts` which mounts all `api/` handlers on an Express router with the same paths.

---

## API Documentation

Swagger UI is available at `/api/docs` when running the Express server locally. The OpenAPI spec is generated from JSDoc comments in the handler files using `swagger-jsdoc`.

**Config:** `BackEnd/src/config/swagger.ts`

---

## Testing

```bash
cd BackEnd
npm test             # Run Jest suite
npm run test:watch   # Watch mode
npm run test:coverage
```

Test files live in `BackEnd/tests/`. Helpers for auth and database seeding are in `BackEnd/tests/helpers/`.

---

## Deployment Readiness Check

A shell script at the repo root checks that the codebase is ready to deploy:

```bash
./check-deployment-readiness.sh
```

It verifies that required env vars are set, builds succeed, and tests pass.
