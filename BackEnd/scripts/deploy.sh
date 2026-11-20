#!/usr/bin/env bash
set -euo pipefail

# Deploys the KinEvents backend SAM stack. Reads credentials from .env and
# passes them as NoEcho parameter overrides. Aborts loudly before touching AWS
# if anything required is missing — so a redeploy can NEVER silently wipe the
# Lambda's env vars again (what happened in August 2026).

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env ]; then
  echo "ERROR: $ROOT/.env is missing. Copy .env.example to .env and fill it in." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

REQUIRED=(JWT_SECRET MONGODB_URI)
MISSING=()
for v in "${REQUIRED[@]}"; do
  if [ -z "${!v:-}" ]; then
    MISSING+=("$v")
  fi
done
if [ "${#MISSING[@]}" -gt 0 ]; then
  echo "ERROR: deploy aborted — missing required env vars: ${MISSING[*]}" >&2
  exit 1
fi

# If EMAIL_SERVICE_URL is set, the backend routes email via the EmailService
# stack and the Nodemailer credentials are not required here. If it is NOT
# set, the backend still tries to send mail directly via Nodemailer, so those
# credentials must be present.
if [ -z "${EMAIL_SERVICE_URL:-}" ]; then
  EMAIL_MISSING=()
  for v in GMAIL_USER GMAIL_APP_PASSWORD; do
    if [ -z "${!v:-}" ]; then
      EMAIL_MISSING+=("$v")
    fi
  done
  if [ "${#EMAIL_MISSING[@]}" -gt 0 ]; then
    echo "ERROR: deploy aborted — EMAIL_SERVICE_URL is unset AND direct email credentials are missing: ${EMAIL_MISSING[*]}" >&2
    echo "       Either point EMAIL_SERVICE_URL at the deployed EmailService stack or fill in GMAIL_USER / GMAIL_APP_PASSWORD." >&2
    exit 1
  fi
fi

# Tolerate blanks for optional params — SAM treats empty string as valid.
SENDGRID_API_KEY="${SENDGRID_API_KEY:-unused}"
APP_URL="${APP_URL:-https://kinevents.vercel.app}"
MONGODB_DB_NAME="${MONGODB_DB_NAME:-kinevents}"
GMAIL_USER="${GMAIL_USER:-}"
GMAIL_APP_PASSWORD="${GMAIL_APP_PASSWORD:-}"
RESEND_API_KEY="${RESEND_API_KEY:-}"
EMAIL_FROM_NAME="${EMAIL_FROM_NAME:-KinEvents}"
EMAIL_SERVICE_URL="${EMAIL_SERVICE_URL:-}"
EMAIL_SERVICE_API_KEY="${EMAIL_SERVICE_API_KEY:-}"

echo ">>> Building TypeScript"
npm run build

echo ">>> Preparing .lambda-pkg (production deps only)"
rm -rf .lambda-pkg
mkdir -p .lambda-pkg
cp -r dist data .lambda-pkg/
cp package.json package-lock.json .lambda-pkg/
(cd .lambda-pkg && npm ci --omit=dev --no-audit --no-fund)

echo ">>> Running sam deploy"
sam deploy \
  --no-confirm-changeset \
  --parameter-overrides \
    "JwtSecret=$JWT_SECRET" \
    "SendgridApiKey=$SENDGRID_API_KEY" \
    "AppUrl=$APP_URL" \
    "MongoDbUri=$MONGODB_URI" \
    "MongoDbName=$MONGODB_DB_NAME" \
    "GmailUser=$GMAIL_USER" \
    "GmailAppPassword=$GMAIL_APP_PASSWORD" \
    "ResendApiKey=$RESEND_API_KEY" \
    "EmailFromName=$EMAIL_FROM_NAME" \
    "EmailServiceUrl=$EMAIL_SERVICE_URL" \
    "EmailServiceApiKey=$EMAIL_SERVICE_API_KEY"

echo ">>> Done."
