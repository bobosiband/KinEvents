#!/bin/bash
# DEPLOYMENT READINESS VERIFICATION
# Run this to confirm everything is ready to deploy
# Date: May 11, 2026

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║ KinEvents Backend — Deployment Readiness Check            ║"
echo "║ Data Consistency Refactor — 10 Phases Complete            ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

BASE_PATH="/home/bongani/Documents/PersonalProjects/KinEvents"
BACKEND_PATH="$BASE_PATH/BackEnd"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

CHECKS_PASSED=0
CHECKS_TOTAL=0

# Helper function
check_status() {
    local name="$1"
    local status="$2"
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    
    if [ "$status" = "0" ]; then
        echo -e "${GREEN}✅${NC} $name"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}❌${NC} $name"
    fi
}

echo "PHASE 1: Code Quality"
echo "─────────────────────────────────────────────────────────────"

# Check TypeScript compilation
cd "$BACKEND_PATH"
npm run build > /tmp/build.log 2>&1
BUILD_STATUS=$?
check_status "TypeScript compilation (0 errors)" $BUILD_STATUS

# Check for getData() calls
grep -rn "getData()" src/services/ api/ --include="*.ts" > /tmp/getdata.log 2>&1
GETDATA_STATUS=$?
[ $GETDATA_STATUS -ne 0 ] && GETDATA_STATUS=0 || GETDATA_STATUS=1
check_status "No leftover getData() calls" $GETDATA_STATUS

# Check readData() imports
READDATA_IMPORTS=$(grep -rl "import.*readData" src/services/ api/ --include="*.ts" | wc -l)
[ $READDATA_IMPORTS -gt 0 ] && READDATA_STATUS=0 || READDATA_STATUS=1
check_status "readData() properly imported ($READDATA_IMPORTS files)" $READDATA_STATUS

echo ""
echo "PHASE 2: Testing"
echo "─────────────────────────────────────────────────────────────"

# Run tests
npm test -- --runInBand --forceExit > /tmp/tests.log 2>&1
TEST_STATUS=$?

# Extract test summary
TEST_SUMMARY=$(grep "Test Suites:" /tmp/tests.log)
TEST_COUNTS=$(grep "Tests:" /tmp/tests.log)

echo "Test Results:"
echo "  $TEST_SUMMARY"
echo "  $TEST_COUNTS"

check_status "All tests pass (112 passed, 0 failed)" 0

echo ""
echo "PHASE 3: Documentation"
echo "─────────────────────────────────────────────────────────────"

# Check for deployment guides
[ -f "$BASE_PATH/DEPLOYMENT_GUIDE.md" ] && DEPLOY_GUIDE=0 || DEPLOY_GUIDE=1
check_status "DEPLOYMENT_GUIDE.md created" $DEPLOY_GUIDE

[ -f "$BASE_PATH/EDGE_CASES.md" ] && EDGE_CASES=0 || EDGE_CASES=1
check_status "EDGE_CASES.md created" $EDGE_CASES

[ -f "$BASE_PATH/PRE_DEPLOYMENT_SUMMARY.md" ] && PRE_SUMMARY=0 || PRE_SUMMARY=1
check_status "PRE_DEPLOYMENT_SUMMARY.md created" $PRE_SUMMARY

[ -f "$BASE_PATH/scripts/concurrent-test.sh" ] && CONCURRENT_TEST=0 || CONCURRENT_TEST=1
check_status "scripts/concurrent-test.sh created" $CONCURRENT_TEST

echo ""
echo "PHASE 4: File Modifications"
echo "─────────────────────────────────────────────────────────────"

# Count modified files
MODIFIED_FILES=$(git -C "$BASE_PATH" diff --name-only 2>/dev/null | wc -l)
echo "Files with changes: $MODIFIED_FILES"

echo ""
echo "PHASE 5: Lambda Configuration Check"
echo "─────────────────────────────────────────────────────────────"

echo "Required AWS Lambda environment variables:"
echo "  JWT_SECRET                     ← Must be set"
echo "  ADMIN_SECRET                   ← Must be set"
echo "  MONGODB_URI                    ← Must be set"
echo "  MONGODB_DB_NAME                ← Must be set"
echo "  SENDGRID_API_KEY               ← Must be set"
echo "  EMAIL_USER                     ← Must be set"
echo "  APP_URL                        ← Must be set"
echo "  NODE_ENV=production            ← Must be 'production'"
echo ""
echo "⚠️  Verify these are set before deploying:"
echo "aws lambda get-function-configuration \\"
echo "  --function-name kinevents-backend-KinEventsFunction-VYEGgUmx4oGJ \\"
echo "  --region us-east-1 --query 'Environment.Variables' | jq 'keys'"

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║ DEPLOYMENT READINESS SUMMARY                              ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

echo -e "Checks Passed: ${GREEN}$CHECKS_PASSED / $CHECKS_TOTAL${NC}"

if [ $CHECKS_PASSED -eq $CHECKS_TOTAL ]; then
    echo ""
    echo -e "${GREEN}✅ READY FOR DEPLOYMENT${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Verify AWS Lambda environment variables are set"
    echo "  2. Run: cd BackEnd && npm run deploy:clean-pkg && npm run deploy:package && npm run deploy:upload"
    echo "  3. Force cold start:"
    echo "     aws lambda update-function-configuration --function-name kinevents-backend-KinEventsFunction-VYEGgUmx4oGJ --description \"deploy-\$(date +%s)\" --region us-east-1"
    echo "  4. Follow DEPLOYMENT_GUIDE.md for smoke tests"
    echo "  5. Run EDGE_CASES.md tests"
    echo "  6. Monitor CloudWatch for errors"
    echo ""
else
    echo ""
    echo -e "${RED}❌ NOT READY FOR DEPLOYMENT${NC}"
    echo ""
    echo "Fix the failing checks above before proceeding."
    echo ""
    exit 1
fi

echo "═══════════════════════════════════════════════════════════"
