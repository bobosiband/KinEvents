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
# SAM shlex-splits --parameter-overrides on whitespace. Any value with a
# space in it (Gmail app passwords, secrets with punctuation, etc.) gets
# silently truncated to the first whitespace-delimited token. We deploy
# stack scaffolding with placeholders and then overwrite the Lambda env
# directly via `aws lambda update-function-configuration`.
sam deploy \
  --no-confirm-changeset \
  --parameter-overrides \
    "ParameterKey=JwtSecret,ParameterValue=placeholder-overridden-post-deploy" \
    "ParameterKey=SendgridApiKey,ParameterValue=placeholder-overridden-post-deploy" \
    "ParameterKey=AppUrl,ParameterValue=$APP_URL" \
    "ParameterKey=MongoDbUri,ParameterValue=placeholder-overridden-post-deploy" \
    "ParameterKey=MongoDbName,ParameterValue=$MONGODB_DB_NAME" \
    "ParameterKey=GmailUser,ParameterValue=$GMAIL_USER" \
    "ParameterKey=GmailAppPassword,ParameterValue=placeholder-overridden-post-deploy" \
    "ParameterKey=ResendApiKey,ParameterValue=placeholder-overridden-post-deploy" \
    "ParameterKey=EmailFromName,ParameterValue=$EMAIL_FROM_NAME" \
    "ParameterKey=EmailServiceUrl,ParameterValue=$EMAIL_SERVICE_URL" \
    "ParameterKey=EmailServiceApiKey,ParameterValue=placeholder-overridden-post-deploy"

STACK_NAME="kinevents-backend"
REGION="ap-southeast-2"
echo ">>> Resolving backend Lambda function name"
FN_NAME=$(aws cloudformation describe-stack-resource \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --logical-resource-id KinEventsFunction \
  --query 'StackResourceDetail.PhysicalResourceId' \
  --output text)

echo ">>> Overwriting Lambda env vars with real values"
aws lambda update-function-configuration \
  --function-name "$FN_NAME" \
  --region "$REGION" \
  --environment "Variables={NODE_ENV=production,JWT_SECRET=$JWT_SECRET,SENDGRID_API_KEY=$SENDGRID_API_KEY,APP_URL=$APP_URL,MONGODB_URI=$MONGODB_URI,MONGODB_DB_NAME=$MONGODB_DB_NAME,GMAIL_USER=$GMAIL_USER,GMAIL_APP_PASSWORD=$GMAIL_APP_PASSWORD,RESEND_API_KEY=$RESEND_API_KEY,EMAIL_FROM_NAME=$EMAIL_FROM_NAME,EMAIL_SERVICE_URL=$EMAIL_SERVICE_URL,EMAIL_SERVICE_API_KEY=$EMAIL_SERVICE_API_KEY}" \
  --no-cli-pager >/dev/null

echo ">>> Done."
