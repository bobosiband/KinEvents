#!/usr/bin/env bash
set -e

BASE_URL="${INTEGRATION_BASE_URL:-https://3lnnoggn81.execute-api.us-east-1.amazonaws.com/Prod}"
ADMIN_EMAIL="${ADMIN_EMAIL:-your-admin@example.com}"
ADMIN_TOKEN="${ADMIN_TOKEN:-}"

echo "=== Multi-user concurrency test ==="
echo "Base URL: $BASE_URL"

if [ -z "$ADMIN_TOKEN" ]; then
  echo "Fetching admin token..."
  ADMIN_TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\"}" | jq -r '.data.token')
fi

ADMIN_USER_ID=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\"}" | jq -r '.data.user.id')

echo "Admin user ID: $ADMIN_USER_ID"

# Step 1: Create a temporary member user
TEMP_EMAIL="concurrent-test-$(date +%s)@example.com"
echo "Creating temp user: $TEMP_EMAIL"

ACCESS_ID=$(curl -s -X POST "$BASE_URL/api/auth/request-access" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Concurrent Test User\",\"email\":\"$TEMP_EMAIL\",\"message\":\"concurrency test\"}" \
  | jq -r '.data.id')
echo "Access request ID: $ACCESS_ID"

APPROVE_RESP=$(curl -s -X POST "$BASE_URL/api/auth/approve-access" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"accessRequestId\":\"$ACCESS_ID\"}")
MEMBER_TOKEN=$(echo $APPROVE_RESP | jq -r '.data.token')
MEMBER_USER_ID=$(echo $APPROVE_RESP | jq -r '.data.user.id')
echo "Member user ID: $MEMBER_USER_ID"

# Step 2: Create an event as admin
EVENT_DATE=$(date -u -v+3d '+%Y-%m-%dT12:00:00Z' 2>/dev/null || date -u -d '+3 days' '+%Y-%m-%dT12:00:00Z')
EVENT_ID=$(curl -s -X POST "$BASE_URL/api/events" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Concurrent Test Event\",\"description\":\"For concurrency testing\",\"date\":\"$EVENT_DATE\",\"createdBy\":\"$ADMIN_USER_ID\",\"type\":\"custom\"}" \
  | jq -r '.data.id')
echo "Event ID: $EVENT_ID"

# Step 3: Simultaneously — admin updates event title, member RSVPs
echo "Running concurrent operations..."

curl -s -X PATCH "$BASE_URL/api/events/$EVENT_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Concurrent Test Event (renamed by admin)"}' > /tmp/admin_update.json &

curl -s -X POST "$BASE_URL/api/events/rsvp" \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"eventId\":\"$EVENT_ID\",\"userId\":\"$MEMBER_USER_ID\",\"status\":\"yes\"}" > /tmp/member_rsvp.json &

wait
echo "Admin update result:" && cat /tmp/admin_update.json | jq '{success, title: .data.title}'
echo "Member RSVP result:"  && cat /tmp/member_rsvp.json  | jq '{success, message}'

# Step 4: Both independently read the event — must see each other's changes
sleep 1

echo "=== Cross-user read consistency check ==="

ADMIN_READ=$(curl -s "$BASE_URL/api/events/$EVENT_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.')
MEMBER_READ=$(curl -s "$BASE_URL/api/events/$EVENT_ID" \
  -H "Authorization: Bearer $MEMBER_TOKEN" | jq '.')

ADMIN_SEES_TITLE=$(echo $ADMIN_READ | jq -r '.data.title')
MEMBER_SEES_TITLE=$(echo $MEMBER_READ | jq -r '.data.title')
ADMIN_SEES_RSVP=$(echo $ADMIN_READ | jq -r ".data.rsvps[\"$MEMBER_USER_ID\"]")
MEMBER_SEES_RSVP=$(echo $MEMBER_READ | jq -r ".data.rsvps[\"$MEMBER_USER_ID\"]")

echo "Admin sees title:  $ADMIN_SEES_TITLE"
echo "Member sees title: $MEMBER_SEES_TITLE"
echo "Admin sees member RSVP:  $ADMIN_SEES_RSVP"
echo "Member sees own RSVP:    $MEMBER_SEES_RSVP"

PASS=true
[ "$ADMIN_SEES_TITLE" != "Concurrent Test Event (renamed by admin)" ] && echo "FAIL: Admin cannot see updated title" && PASS=false
[ "$MEMBER_SEES_TITLE" != "Concurrent Test Event (renamed by admin)" ] && echo "FAIL: Member cannot see updated title" && PASS=false
[ "$ADMIN_SEES_RSVP" != "yes" ] && echo "FAIL: Admin cannot see member RSVP" && PASS=false
[ "$MEMBER_SEES_RSVP" != "yes" ] && echo "FAIL: Member cannot see own RSVP" && PASS=false
[ "$PASS" = true ] && echo "✅ PASS: All cross-user reads consistent"

# Step 5: Delete across cold starts — the original bug
echo ""
echo "=== Cold-start deletion persistence check ==="
curl -s -X DELETE "$BASE_URL/api/events/$EVENT_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '{success}'

# Hit the endpoint 5 times rapidly to force different Lambda instances
for i in 1 2 3 4 5; do
  RESULT=$(curl -s "$BASE_URL/api/events/$EVENT_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.success')
  if [ "$RESULT" = "true" ]; then
    echo "❌ FAIL attempt $i: Deleted event reappeared — readData() fix not working"
    PASS=false
  else
    echo "✅ PASS attempt $i: Event correctly gone"
  fi
done

# Cleanup
echo ""
echo "=== Cleanup ==="
curl -s -X DELETE "$BASE_URL/api/users/$MEMBER_USER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '{success}'

echo ""
[ "$PASS" = true ] && echo "✅ === ALL CONCURRENCY TESTS PASSED ===" || echo "❌ === CONCURRENCY TESTS FAILED — DO NOT SHIP ==="
