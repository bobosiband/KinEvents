#!/usr/bin/env bash
set -euo pipefail

# Usage: API_BASE_URL=https://... ./scripts/run_integration_tests.sh

if [ -z "${API_BASE_URL:-}" ]; then
  echo "Error: API_BASE_URL must be set (e.g. export API_BASE_URL=https://...)" >&2
  exit 2
fi

echo "Running integration tests against $API_BASE_URL"

export NODE_ENV=test
export API_BASE_URL

npm ci
npm run test:integration
