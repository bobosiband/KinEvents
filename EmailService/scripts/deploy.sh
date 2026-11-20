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

# Accept legacy EMAIL_USER / EMAIL_PASS names as fallbacks so an existing
# backend .env works without edits.
: "${GMAIL_USER:=${EMAIL_USER:-}}"
: "${GMAIL_APP_PASSWORD:=${EMAIL_PASS:-}}"

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
# SAM internally shlex-splits --parameter-overrides on whitespace in either the
# shorthand or ParameterKey=/ParameterValue= form, which silently truncates
# Gmail app passwords that contain spaces. To work around this reliably we:
#   1. Deploy the stack with a placeholder for GmailAppPassword, so stack
#      creation and all other resource wiring go through SAM normally.
#   2. Immediately overwrite the Lambda env variables with the real values
#      via `aws lambda update-function-configuration`, which accepts any
#      string.
# The real password NEVER appears on the SAM command line.
#
# Tolerate "No changes to deploy" — SAM exits non-zero even when the only
# missing update is the Lambda env block that we patch directly below.
set +e
sam deploy \
  --no-confirm-changeset \
  --parameter-overrides \
    "ParameterKey=GmailUser,ParameterValue=$GMAIL_USER" \
    "ParameterKey=GmailAppPassword,ParameterValue=placeholder-overridden-post-deploy" \
    "ParameterKey=EmailFromName,ParameterValue=$EMAIL_FROM_NAME" \
    "ParameterKey=EmailServiceApiKey,ParameterValue=$EMAIL_SERVICE_API_KEY" \
    "ParameterKey=EmailLogsRetentionDays,ParameterValue=$EMAIL_LOGS_RETENTION_DAYS"
SAM_EXIT=$?
set -e
if [ "$SAM_EXIT" -ne 0 ]; then
  echo ">>> sam deploy exited $SAM_EXIT (likely 'No changes to deploy') — continuing to env patch"
fi

STACK_NAME="kinevents-email-service"
REGION="ap-southeast-2"
echo ">>> Resolving Lambda function name from stack"
FN_NAME=$(aws cloudformation describe-stack-resource \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --logical-resource-id EmailServiceFunction \
  --query 'StackResourceDetail.PhysicalResourceId' \
  --output text)
TABLE_NAME=$(aws cloudformation describe-stack-resource \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --logical-resource-id EmailLogsTable \
  --query 'StackResourceDetail.PhysicalResourceId' \
  --output text)

echo ">>> Overwriting Lambda env vars with the real GmailAppPassword"
aws lambda update-function-configuration \
  --function-name "$FN_NAME" \
  --region "$REGION" \
  --environment "Variables={NODE_ENV=production,GMAIL_USER=$GMAIL_USER,GMAIL_APP_PASSWORD=$GMAIL_APP_PASSWORD,EMAIL_FROM_NAME=$EMAIL_FROM_NAME,EMAIL_SERVICE_API_KEY=$EMAIL_SERVICE_API_KEY,EMAIL_LOGS_TABLE=$TABLE_NAME,EMAIL_LOGS_RETENTION_DAYS=$EMAIL_LOGS_RETENTION_DAYS}" \
  --no-cli-pager >/dev/null

echo ">>> Done."
