#!/usr/bin/env bash
set -euo pipefail

# Deploys the EmailService SAM stack. Reads credentials from the local .env and
# passes them as NoEcho parameters so a redeploy can NEVER silently reset them.
# Any missing required variable aborts the deploy before AWS is touched.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env ]; then
  echo "ERROR: $ROOT/.env is missing. Copy .env.example to .env and fill in the values." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

REQUIRED_VARS=(GMAIL_USER GMAIL_APP_PASSWORD EMAIL_SERVICE_API_KEY)
MISSING=()
for v in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!v:-}" ]; then
    MISSING+=("$v")
  fi
done
if [ "${#MISSING[@]}" -gt 0 ]; then
  echo "ERROR: deploy aborted — missing required env vars: ${MISSING[*]}" >&2
  echo "       Populate them in $ROOT/.env before re-running." >&2
  exit 1
fi

EMAIL_FROM_NAME="${EMAIL_FROM_NAME:-KinEvents}"
EMAIL_LOGS_RETENTION_DAYS="${EMAIL_LOGS_RETENTION_DAYS:-30}"

echo ">>> Building TypeScript"
npm run build

echo ">>> Preparing .lambda-pkg (production deps only)"
rm -rf .lambda-pkg
mkdir -p .lambda-pkg
cp -r dist .lambda-pkg/
cp package.json package-lock.json .lambda-pkg/
(cd .lambda-pkg && npm ci --omit=dev --no-audit --no-fund)

echo ">>> Running sam deploy"
sam deploy \
  --no-confirm-changeset \
  --parameter-overrides \
    "GmailUser=$GMAIL_USER" \
    "GmailAppPassword=$GMAIL_APP_PASSWORD" \
    "EmailFromName=$EMAIL_FROM_NAME" \
    "EmailServiceApiKey=$EMAIL_SERVICE_API_KEY" \
    "EmailLogsRetentionDays=$EMAIL_LOGS_RETENTION_DAYS"

echo ">>> Done."
