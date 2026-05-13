#!/usr/bin/env bash
set -euo pipefail

# Simple deployment wrapper that relies on existing npm deploy scripts.
# Provide environment variables (e.g. AWS creds) in the environment or a .env file.

if [ -f ./.env ]; then
  # load .env into environment
  set -a
  # shellcheck disable=SC1091
  source ./.env
  set +a
fi

echo "Building and deploying backend..."

npm ci
npm run deploy

echo "Deployment finished."
