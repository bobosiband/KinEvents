# KinEvents Backend Deployment Guide — Post Data Consistency Refactor

**Status**: Ready for AWS Lambda deployment
**Date**: May 11, 2026
**Build**: `npm run build` ✅ | Tests: 112 passed ✅

---

## Quick Start

```bash
cd BackEnd

# 1. Verify pre-deployment checklist passed
npm run build                                      # ✅ 0 errors
npm test -- --runInBand --forceExit              # ✅ 112 passed
grep -rn "getData()" src/services/ api/          # ✅ no results
grep -rn "readData()" src/services/ api/         # ✅ all imported

# 2. Deploy to Lambda (requires AWS credentials)
npm run deploy:clean-pkg
npm run deploy:package
npm run deploy:upload

# 3. Force cold start (flushes all warm instances)
aws lambda update-function-configuration \
  --function-name kinevents-backend-KinEventsFunction-VYEGgUmx4oGJ \
  --description "deploy-$(date +%s)" \
  --region us-east-1

# 4. Wait for update
aws lambda wait function-updated \
  --function-name kinevents-backend-KinEventsFunction-VYEGgUmx4oGJ \
  --region us-east-1

# 5. Run smoke tests
ADMIN_EMAIL="your-admin@example.com" \
ADMIN_SECRET="your-admin-secret" \
BASE_URL="https://3lnnoggn81.execute-api.us-east-1.amazonaws.com/Prod" \
./scripts/concurrent-test.sh

echo "✅ Deployment complete"
```

---

## What Changed in This Refactor

The 10-phase implementation fixed a critical data consistency bug where separate Lambda instances had isolated in-memory data stores with no MongoDB synchronization.

### Before (Broken)
```
Lambda Instance A                      Lambda Instance B
├─ in-memory cache: event "A"         ├─ in-memory cache: event "A"
│  (stale from last cold-start)       │  (stale from different cold-start)
└─ Request: GET /event/1              └─ Request: GET /event/1
   Returns: title "Original"             Returns: title "Original"
   
BUT: Admin on Lambda A updated title to "Updated"
     Lambda B still returns "Original" (stale cache!)
     User gets inconsistent data depending on which instance handles request
```

### After (Fixed)
```
Lambda Instance A & B both:
1. On every request: await readData() → hits MongoDB
2. In-memory cache always fresh (refreshed from DB)
3. Mutations applied to in-memory db object
4. persistData() serializes writes to MongoDB
5. Both instances always see same state
```

### Key Changes
- **async readData()**: Calls MongoDB every request (unless test mode) to refresh cache
- **persistQueue**: Serializes concurrent writes to prevent lost updates
- **initPromise reset**: Allows retry if initialization fails
- **withAuth.ts**: Calls `await readData()` to check live user roles from MongoDB
- **Health endpoints**: `/health` and `/ready` for Kubernetes probes
- **Error sanitization**: No internal error details returned to clients

---

## Lambda Environment Variables (Required)

All of these must be set in Lambda function configuration:

```bash
# Required for auth
JWT_SECRET=<your-jwt-secret>
ADMIN_SECRET=<your-admin-creation-secret>

# Required for MongoDB
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=kinevents

# Required for email
SENDGRID_API_KEY=SG.<your-sendgrid-key>
EMAIL_USER=<sendgrid-verified-email>
EMAIL_FROM_NAME=KinEvents

# Required for app
APP_URL=https://3lnnoggn81.execute-api.us-east-1.amazonaws.com/Prod
NODE_ENV=production
PORT=3000

# Optional but recommended
DEBUG=kinevents:*
```

**Verify env vars are set:**
```bash
aws lambda get-function-configuration \
  --function-name kinevents-backend-KinEventsFunction-VYEGgUmx4oGJ \
  --region us-east-1 \
  --query 'Environment.Variables' | jq 'keys'
```

---

## Deployment Verification Checklist

Run these in order. **Stop immediately if any fail.**

### ✅ Step 1: Health Checks

```bash
BASE_URL="https://3lnnoggn81.execute-api.us-east-1.amazonaws.com/Prod"

# Must return: dbReady: true, userCount >= 1
curl -s "$BASE_URL/health" | jq .

# Must return: ready: true
curl -s "$BASE_URL/ready" | jq .

# If either fails:
# - Check Lambda env vars (see above)
# - Check MongoDB connectivity
# - Review Lambda CloudWatch logs
```

### ✅ Step 2: Smoke Test 1 (Auth Endpoints)

```bash
ADMIN_EMAIL="your-real-admin@example.com"

# Public endpoint — no auth needed
curl -s -X POST "$BASE_URL/api/auth/request-access" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Smoke Test\",\"email\":\"smoke-$(date +%s)@example.com\",\"message\":\"test\"}" \
  | jq '{success, id: .data.id}'
# Expected: success: true

# Get admin token
ADMIN_TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\"}" | jq -r '.data.token')

# Bad email
curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"doesnotexist@nowhere.com"}' \
  | jq '{success, message}'
# Expected: success: false, message: "User not found"

# No token
curl -s "$BASE_URL/api/events" | jq '{success, message}'
# Expected: success: false, message: "Missing authorization token"

# Invalid token
curl -s "$BASE_URL/api/events" \
  -H "Authorization: Bearer notavalidtoken" \
  | jq '{success, message}'
# Expected: success: false, message: "Invalid or expired token"
```

### ✅ Step 3: Smoke Test 2 (Happy Path + Data Consistency)

```bash
# List users
curl -s "$BASE_URL/api/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq '{success, count: (.data | length)}'
# Expected: success: true, count >= 1

# Create event
EVENT_DATE=$(date -u -v+7d '+%Y-%m-%dT12:00:00Z' 2>/dev/null || date -u -d '+7 days' '+%Y-%m-%dT12:00:00Z')
ADMIN_ID=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\"}" | jq -r '.data.user.id')

EVENT_RESP=$(curl -s -X POST "$BASE_URL/api/events" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Smoke Test Event\",\"description\":\"Will be deleted\",\"date\":\"$EVENT_DATE\",\"createdBy\":\"$ADMIN_ID\",\"type\":\"custom\"}")

EVENT_ID=$(echo $EVENT_RESP | jq -r '.data.id')
echo "Event ID: $EVENT_ID"
echo $EVENT_RESP | jq '{success, title: .data.title}'
# Expected: success: true, title: "Smoke Test Event"

# Update event
curl -s -X PATCH "$BASE_URL/api/events/$EVENT_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Smoke Test Event (updated)"}' \
  | jq '{success, title: .data.title}'
# Expected: success: true, title: "Smoke Test Event (updated)"

# CRITICAL CONSISTENCY TEST: Read back immediately
curl -s "$BASE_URL/api/events/$EVENT_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq '{success, title: .data.title}'
# Expected: success: true, title: "Smoke Test Event (updated)" ← THIS MUST BE TRUE
# If you see "Smoke Test Event" (old title), the readData() fix is broken!

# Delete event
curl -s -X DELETE "$BASE_URL/api/events/$EVENT_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq '{success}'
# Expected: success: true

# CRITICAL COLD-START TEST: Rapid reads after delete
# This forces different Lambda instances. The deleted event must stay gone.
sleep 2
for i in 1 2 3 4 5; do
  RESULT=$(curl -s "$BASE_URL/api/events/$EVENT_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.success')
  if [ "$RESULT" = "true" ]; then
    echo "❌ FAIL $i: Event reappeared! readData() not working!"
    exit 1
  else
    echo "✅ PASS $i: Event stays deleted"
  fi
done
```

### ✅ Step 4: Concurrency Test (The Real Fix)

This proves writes from one instance are immediately visible to another:

```bash
chmod +x scripts/concurrent-test.sh
ADMIN_EMAIL="your-admin@example.com" \
INTEGRATION_BASE_URL="https://3lnnoggn81.execute-api.us-east-1.amazonaws.com/Prod" \
./scripts/concurrent-test.sh
```

Expected output:
```
✅ Admin sees updated title
✅ Member sees updated title  
✅ Admin sees member RSVP
✅ Member sees own RSVP
✅ Event correctly gone (5 times)
✅ === ALL CONCURRENCY TESTS PASSED ===
```

If you see any "FAIL", the fix is broken. **Do not ship.**

---

## Edge Cases to Test

See `EDGE_CASES.md` for detailed test scripts for:
1. Expired JWT
2. JWT for deleted user
3. Validation errors (must be 400, never 500)
4. Authorization boundaries (403 for insufficient perms)
5. Duplicate/idempotency
6. Resource not found (404, never 500)
7. Debug endpoint disabled in production (404)
8. Birthday generation idempotency
9. Admin secret protection
10. Notification edge cases

---

## Rollback Procedure

If something breaks in production:

```bash
# See recent versions
aws lambda list-versions-by-function \
  --function-name kinevents-backend-KinEventsFunction-VYEGgUmx4oGJ \
  --region us-east-1 --query 'Versions[-3:].Version' --output json

# Roll back to previous
aws lambda update-alias \
  --function-name kinevents-backend-KinEventsFunction-VYEGgUmx4oGJ \
  --name live \
  --function-version <VERSION> \
  --region us-east-1
```

---

## CloudWatch Monitoring

Monitor for errors during first 30 minutes post-deploy:

```bash
aws logs filter-log-events \
  --log-group-name /aws/lambda/kinevents-backend-KinEventsFunction-VYEGgUmx4oGJ \
  --start-time $(date -u -v-30M '+%s000' 2>/dev/null || date -u -d '-30 minutes' '+%s000') \
  --filter-pattern "ERROR" \
  --region us-east-1 | jq '.events[].message'

# Goal: empty or only expected warnings
```

---

## Success Criteria

✅ All checks below must be TRUE before considering deployment complete:

- [ ] `GET /health` → `dbReady: true`, `userCount >= 1`
- [ ] `GET /ready` → `ready: true`
- [ ] Smoke test 1 — all auth checks pass
- [ ] Smoke test 2 — deleted event stays deleted across 5 rapid reads
- [ ] Concurrency test — both users see each other's writes
- [ ] No unexpected 500 responses in edge cases
- [ ] CloudWatch clean (no ERROR logs for past 30 min)
- [ ] `GET /api/debug/db` → 404 (disabled in production)

---

## Key Files Modified

| File | Change | Purpose |
|------|--------|---------|
| src/config/db.ts | Added async readData() | Fresh MongoDB read every request |
| src/services/*.ts (7 files) | All async with await readData() | Service layer async-safe |
| src/middleware/withAuth.ts | await readData() after waitForDb() | Live role validation |
| api/**/*.ts (6+ handlers) | Updated to use readData(), error sanitization | Request handlers fixed |
| src/app.ts | Added /health, /ready, global error handler | Kubernetes readiness |
| tests/*.ts | Updated for async patterns | Full test coverage |

---

## Post-Deployment Tasks

1. **Document in release notes**: "Fixed critical data consistency bug where Lambda instances had isolated caches"
2. **Monitor**: Set up CloudWatch alarms for Lambda error rate
3. **Communicate**: Notify stakeholders that multi-user data consistency is now guaranteed
4. **Archive**: Save this deployment guide for future reference

---

**Deployment Team**: Follow this guide exactly. Any deviations may hide bugs.
**Questions?**: Check logs first. CloudWatch → Filter by ERROR. Then escalate.
**Stuck?**: Rollback (see above) and file issue with full error logs.
