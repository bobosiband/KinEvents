# Edge Case Tests for KinEvents Backend Deployment

Run these after smoke tests 1 & 2 pass. Each test must complete without unexpected 500 errors.

## Edge Case 1: Expired JWT

```bash
BASE_URL="https://3lnnoggn81.execute-api.us-east-1.amazonaws.com/Prod"

EXPIRED_TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
console.log(jwt.sign(
  {id:'test',role:'member',email:'x@x.com',accessStatus:'approved',capabilities:[],notificationPrefs:{level:'all',channels:['email']},name:'x',createdAt:'',updatedAt:''},
  process.env.JWT_SECRET || 'test',
  {expiresIn:'1s'}
));
")

sleep 3

curl -s "$BASE_URL/api/events" \
  -H "Authorization: Bearer $EXPIRED_TOKEN" \
  | jq '{success, message}'

# ✅ Expected: success: false, message: "Invalid or expired token"
# ❌ Unexpected: 500 status
```

---

## Edge Case 2: JWT for Deleted User

```bash
ADMIN_EMAIL="your-admin@example.com"
ADMIN_TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\"}" | jq -r '.data.token')

# Create a ghost user
GHOST_EMAIL="ghost-$(date +%s)@example.com"
ACCESS_ID=$(curl -s -X POST "$BASE_URL/api/auth/request-access" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Ghost\",\"email\":\"$GHOST_EMAIL\"}" | jq -r '.data.id')

GHOST_RESP=$(curl -s -X POST "$BASE_URL/api/auth/approve-access" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"accessRequestId\":\"$ACCESS_ID\"}")

GHOST_TOKEN=$(echo $GHOST_RESP | jq -r '.data.token')
GHOST_ID=$(echo $GHOST_RESP | jq -r '.data.user.id')

# Delete the user
curl -s -X DELETE "$BASE_URL/api/users/$GHOST_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null

# Try to use ghost's token
curl -s "$BASE_URL/api/events" \
  -H "Authorization: Bearer $GHOST_TOKEN" \
  | jq '{success, message}'

# ✅ Expected: success: false, message contains "no longer exists"
# ❌ Unexpected: 500 status
```

---

## Edge Case 3: Validation Errors (Must Be 400, Never 500)

```bash
# Invalid email format
curl -s -X POST "$BASE_URL/api/auth/request-access" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"notanemail"}' \
  | jq '{success, message}'
# ✅ Expected: 400 Validation failed

# Invalid date format
curl -s -X POST "$BASE_URL/api/events" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"X","description":"X","date":"25-12-2026","createdBy":"'$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid)'"}' \
  | jq '{success, message}'
# ✅ Expected: 400 Validation failed

# Invalid URL on event
curl -s -X POST "$BASE_URL/api/events" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"X","description":"X","date":"2026-12-25T12:00:00Z","createdBy":"'$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid)'","onlineLink":"not-a-url"}' \
  | jq '{success, message}'
# ✅ Expected: 400 Validation failed

# Missing required fields
curl -s -X POST "$BASE_URL/api/events" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Only a title"}' \
  | jq '{success, message}'
# ✅ Expected: 400 Validation failed

# Empty body
curl -s -X POST "$BASE_URL/api/events" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' \
  | jq '{success, message}'
# ✅ Expected: 400 Validation failed

# Wrong HTTP method
curl -s -X DELETE "$BASE_URL/api/auth/login" | jq '{success, message}'
# ✅ Expected: 405 Method not allowed
```

---

## Edge Case 4: Authorization Boundaries

```bash
# Create a member token
MEMBER_EMAIL="boundary-$(date +%s)@example.com"
MEMBER_ACCESS=$(curl -s -X POST "$BASE_URL/api/auth/request-access" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Boundary\",\"email\":\"$MEMBER_EMAIL\"}" | jq -r '.data.id')

MEMBER_RESP=$(curl -s -X POST "$BASE_URL/api/auth/approve-access" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"accessRequestId\":\"$MEMBER_ACCESS\"}")

MEMBER_TOKEN=$(echo $MEMBER_RESP | jq -r '.data.token')
MEMBER_ID=$(echo $MEMBER_RESP | jq -r '.data.user.id')

# Member cannot promote users
curl -s -X POST "$BASE_URL/api/users/promote" \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$MEMBER_ID\",\"role\":\"admin\"}" \
  | jq '{success, message}'
# ✅ Expected: 403 Insufficient permissions

# Member cannot access admin dashboard
curl -s "$BASE_URL/api/admin/dashboard" \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  | jq '{success, message}'
# ✅ Expected: 403 Insufficient permissions

# Member cannot RSVP for another user
OTHER_USER_ID="00000000-0000-0000-0000-000000000099"
EVENT_DATE=$(date -u -v+7d '+%Y-%m-%dT12:00:00Z' 2>/dev/null || date -u -d '+7 days' '+%Y-%m-%dT12:00:00Z')
RSVP_EVENT=$(curl -s -X POST "$BASE_URL/api/events" \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"RSVP Test\",\"description\":\"X\",\"date\":\"$EVENT_DATE\",\"createdBy\":\"$MEMBER_ID\",\"type\":\"custom\"}" \
  | jq -r '.data.id')

curl -s -X POST "$BASE_URL/api/events/rsvp" \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"eventId\":\"$RSVP_EVENT\",\"userId\":\"$OTHER_USER_ID\",\"status\":\"yes\"}" \
  | jq '{success, message}'
# ✅ Expected: 403 You can only RSVP for yourself

# Member CAN RSVP for themselves
curl -s -X POST "$BASE_URL/api/events/rsvp" \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"eventId\":\"$RSVP_EVENT\",\"userId\":\"$MEMBER_ID\",\"status\":\"yes\"}" \
  | jq '{success, message}'
# ✅ Expected: success: true

# Member cannot update another user's profile
curl -s -X PATCH "$BASE_URL/api/users/00000000-0000-0000-0000-000000000001" \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Hacked"}' \
  | jq '{success, message}'
# ✅ Expected: 403 Insufficient permissions (or 404 if user not found)

# Cleanup
curl -s -X DELETE "$BASE_URL/api/events/$RSVP_EVENT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null
curl -s -X DELETE "$BASE_URL/api/users/$MEMBER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null
```

---

## Edge Case 5: Duplicate and Idempotency

```bash
# Duplicate access request for same email (must return same request, not error)
DUP_EMAIL="dup-$(date +%s)@example.com"
FIRST=$(curl -s -X POST "$BASE_URL/api/auth/request-access" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Dup\",\"email\":\"$DUP_EMAIL\"}" | jq -r '.data.id')

SECOND=$(curl -s -X POST "$BASE_URL/api/auth/request-access" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Dup\",\"email\":\"$DUP_EMAIL\"}" | jq -r '.data.id')

[ "$FIRST" = "$SECOND" ] && echo "✅ PASS: Duplicate request idempotent" || echo "❌ FAIL: Created duplicate"

# Approve same request twice (second must 404 gracefully, not 500)
curl -s -X POST "$BASE_URL/api/auth/approve-access" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"accessRequestId\":\"$FIRST\"}" > /dev/null

curl -s -X POST "$BASE_URL/api/auth/approve-access" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"accessRequestId\":\"$FIRST\"}" | jq '{success, message}'
# ✅ Expected: success: false, message contains "not found" — NOT 500

# RSVP update (same user, different status — must overwrite, not duplicate)
EVENT_DATE=$(date -u -v+7d '+%Y-%m-%dT12:00:00Z' 2>/dev/null || date -u -d '+7 days' '+%Y-%m-%dT12:00:00Z')
ADMIN_ID=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\"}" | jq -r '.data.user.id')

RSVP_EVT=$(curl -s -X POST "$BASE_URL/api/events" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Idempotent RSVP\",\"description\":\"X\",\"date\":\"$EVENT_DATE\",\"createdBy\":\"$ADMIN_ID\",\"type\":\"custom\"}" \
  | jq -r '.data.id')

curl -s -X POST "$BASE_URL/api/events/rsvp" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"eventId\":\"$RSVP_EVT\",\"userId\":\"$ADMIN_ID\",\"status\":\"yes\"}" > /dev/null

FINAL=$(curl -s -X POST "$BASE_URL/api/events/rsvp" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"eventId\":\"$RSVP_EVT\",\"userId\":\"$ADMIN_ID\",\"status\":\"no\"}" | jq -r ".data.rsvps[\"$ADMIN_ID\"]")

[ "$FINAL" = "no" ] && echo "✅ PASS: RSVP updated correctly" || echo "❌ FAIL: RSVP not updated, got: $FINAL"
curl -s -X DELETE "$BASE_URL/api/events/$RSVP_EVT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null
```

---

## Edge Case 6: Resource Not Found (404, Never 500)

```bash
FAKE_UUID="00000000-0000-0000-0000-000000000000"

curl -s "$BASE_URL/api/events/$FAKE_UUID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '{success, message}'
# ✅ Expected: 404 Event not found

curl -s "$BASE_URL/api/users/$FAKE_UUID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '{success, message}'
# ✅ Expected: 404 User not found

curl -s -X DELETE "$BASE_URL/api/events/$FAKE_UUID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '{success, message}'
# ✅ Expected: 404 Event not found

curl -s -X PATCH "$BASE_URL/api/events/$FAKE_UUID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Ghost update"}' | jq '{success, message}'
# ✅ Expected: 404 Event not found

curl -s -X POST "$BASE_URL/api/auth/approve-access" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"accessRequestId\":\"$FAKE_UUID\"}" | jq '{success, message}'
# ✅ Expected: 404 Access request not found
```

---

## Edge Case 7: Debug Endpoint Disabled in Production

```bash
curl -s "$BASE_URL/api/debug/db" | jq '{success}'
# ✅ Expected: 404 Not found
# Debug endpoint must be disabled when NODE_ENV=production
```

---

## Edge Case 8: Birthday Generation Idempotency

```bash
# Generate twice — second call must skip duplicates, not create doubles
RESULT1=$(curl -s -X POST "$BASE_URL/api/birthdays/generate" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}')

echo "First generation:" && echo $RESULT1 | jq '{success, generated: (.data | length)}'

RESULT2=$(curl -s -X POST "$BASE_URL/api/birthdays/generate" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}')

echo "Second generation:" && echo $RESULT2 | jq '{success, generated: (.data | length), message}'
# ✅ Expected second call: generated: 0 (or same as first), message contains "skipped"
```

---

## Edge Case 9: Admin Secret Protection

```bash
# Wrong admin secret must 403
curl -s -X POST "$BASE_URL/api/admin/create-admin" \
  -H "Content-Type: application/json" \
  -d '{"name":"Evil","email":"evil@evil.com","secret":"wrongsecret"}' \
  | jq '{success, message}'
# ✅ Expected: 403 Invalid admin secret

# No secret field at all — must 400 not 500
curl -s -X POST "$BASE_URL/api/admin/create-admin" \
  -H "Content-Type: application/json" \
  -d '{"name":"Evil","email":"evil@evil.com"}' \
  | jq '{success, message}'
# ✅ Expected: 400 Validation failed
```

---

## Edge Case 10: Notification and Email Edge Cases

```bash
# Notification to non-existent user
curl -s -X POST "$BASE_URL/api/notifications/send" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"event_created","recipientId":"00000000-0000-0000-0000-000000000000","payload":{"eventId":"test"}}' \
  | jq '{success}'
# ✅ Expected: success: true (notification stored) or success: false (not 500)

# Invalid notification type
curl -s -X POST "$BASE_URL/api/notifications/send" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"not_a_real_type","recipientId":"00000000-0000-0000-0000-000000000001","payload":{}}' \
  | jq '{success, message}'
# ✅ Expected: 400 Validation failed
```

---

## Summary

Run all 10 edge cases. Count passes:

```bash
EDGE_CASES_PASSED=0
# ... run all tests above ...
# Count each ✅ PASS or expected response

echo "Edge cases passed: $EDGE_CASES_PASSED / 30"
# Goal: 30/30 (all edge cases pass)
# Minimum to ship: 25/30 (with only non-critical failures)
```

**If any returns unexpected 500**: Stop, fix, re-test.
**If all pass**: Proceed to integration test suite.
