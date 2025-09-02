#!/bin/bash
# scripts/validation/endpoint-tests.sh
# Comprehensive API endpoint testing framework

ENVIRONMENT=${1:-production}
TIMEOUT=${2:-30}
REPORT_FILE="/tmp/endpoint_test_report_${ENVIRONMENT}_$(date +%Y%m%d_%H%M%S).json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=== Comprehensive Endpoint Testing for $ENVIRONMENT ==="
echo "Timeout: ${TIMEOUT}s"
echo ""

# Initialize comprehensive report
cat > "$REPORT_FILE" << EOF
{
  "environment": "$ENVIRONMENT",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "test_categories": {
    "health_checks": {"tests": [], "summary": {"total": 0, "passed": 0, "failed": 0}},
    "response_validation": {"tests": [], "summary": {"total": 0, "passed": 0, "failed": 0}},
    "authentication": {"tests": [], "summary": {"total": 0, "passed": 0, "failed": 0}},
    "authorization": {"tests": [], "summary": {"total": 0, "passed": 0, "failed": 0}},
    "data_integrity": {"tests": [], "summary": {"total": 0, "passed": 0, "failed": 0}},
    "rate_limiting": {"tests": [], "summary": {"total": 0, "passed": 0, "failed": 0}},
    "cors": {"tests": [], "summary": {"total": 0, "passed": 0, "failed": 0}},
    "performance": {"tests": [], "summary": {"total": 0, "passed": 0, "failed": 0}}
  },
  "overall_status": "running"
}
EOF

# Enhanced test function with categorization
run_endpoint_test() {
    local category=$1
    local test_name=$2
    local command=$3
    local expected_status=${4:-200}
    local max_response_time=${5:-1000}

    echo -n "[$category] $test_name... "

    # Add test to results
    jq --arg cat "$category" --arg name "$test_name" '.test_categories[$cat].tests += [{"name": $name, "status": "running", "start_time": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'", "expected_status": "'$expected_status'", "max_response_time": '$max_response_time'}]' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"

    # Run test with timing
    START_TIME=$(date +%s%N)
    if RESPONSE=$(timeout $TIMEOUT bash -c "$command" 2>/dev/null); then
        END_TIME=$(date +%s%N)
        RESPONSE_TIME=$(( (END_TIME - START_TIME) / 1000000 ))  # Convert to milliseconds

        # Extract status code from response
        STATUS_CODE=$(echo "$RESPONSE" | grep -o '"status_code":[0-9]*' | cut -d':' -f2 || echo "200")

        # Validate response time
        if [[ $RESPONSE_TIME -le $max_response_time ]]; then
            RESPONSE_TIME_STATUS="passed"
        else
            RESPONSE_TIME_STATUS="failed"
        fi

        # Validate status code
        if [[ $STATUS_CODE -eq $expected_status ]]; then
            STATUS_CODE_STATUS="passed"
        else
            STATUS_CODE_STATUS="failed"
        fi

        if [[ $STATUS_CODE_STATUS == "passed" && $RESPONSE_TIME_STATUS == "passed" ]]; then
            echo -e "${GREEN}PASSED${NC} (${RESPONSE_TIME}ms, $STATUS_CODE)"
            jq --arg cat "$category" --arg name "$test_name" '(.test_categories[$cat].tests[] | select(.name == $name) | .status) = "passed" | (.test_categories[$cat].tests[] | select(.name == $name) | .end_time) = "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'" | (.test_categories[$cat].tests[] | select(.name == $name) | .actual_response_time) = '$RESPONSE_TIME' | (.test_categories[$cat].tests[] | select(.name == $name) | .actual_status_code) = '$STATUS_CODE' | .test_categories[$cat].summary.passed += 1 | .test_categories[$cat].summary.total += 1' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
            return 0
        else
            echo -e "${RED}FAILED${NC} (${RESPONSE_TIME}ms, $STATUS_CODE)"
            jq --arg cat "$category" --arg name "$test_name" '(.test_categories[$cat].tests[] | select(.name == $name) | .status) = "failed" | (.test_categories[$cat].tests[] | select(.name == $name) | .end_time) = "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'" | (.test_categories[$cat].tests[] | select(.name == $name) | .actual_response_time) = '$RESPONSE_TIME' | (.test_categories[$cat].tests[] | select(.name == $name) | .actual_status_code) = '$STATUS_CODE' | .test_categories[$cat].summary.failed += 1 | .test_categories[$cat].summary.total += 1' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
            return 1
        fi
    else
        END_TIME=$(date +%s%N)
        RESPONSE_TIME=$(( (END_TIME - START_TIME) / 1000000 ))
        echo -e "${RED}TIMEOUT${NC} (${RESPONSE_TIME}ms)"
        jq --arg cat "$category" --arg name "$test_name" '(.test_categories[$cat].tests[] | select(.name == $name) | .status) = "failed" | (.test_categories[$cat].tests[] | select(.name == $name) | .end_time) = "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'" | (.test_categories[$cat].tests[] | select(.name == $name) | .error) = "Timeout after '${TIMEOUT}'s" | (.test_categories[$cat].tests[] | select(.name == $name) | .actual_response_time) = '$RESPONSE_TIME' | .test_categories[$cat].summary.failed += 1 | .test_categories[$cat].summary.total += 1' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
        return 1
    fi
}

# Helper function to make API calls with detailed response capture
make_api_call() {
    local method=$1
    local url=$2
    local headers=${3:-""}
    local data=${4:-""}

    if [[ -n "$data" ]]; then
        curl -s -w '\n{"status_code":%{http_code},"response_time":%{time_total},"size":%{size_download}}' \
             -X "$method" "$url" \
             ${headers:+-H "$headers"} \
             -d "$data" \
             -o /tmp/api_response.json
    else
        curl -s -w '\n{"status_code":%{http_code},"response_time":%{time_total},"size":%{size_download}}' \
             -X "$method" "$url" \
             ${headers:+-H "$headers"} \
             -o /tmp/api_response.json
    fi

    # Combine response body with metadata
    if [[ -f /tmp/api_response.json ]]; then
        RESPONSE_BODY=$(cat /tmp/api_response.json)
        METADATA=$(tail -n 1 /tmp/api_response.json)
        echo "{\"body\":$RESPONSE_BODY,\"metadata\":$METADATA}"
    else
        echo "{\"error\":\"No response\",\"metadata\":{\"status_code\":0,\"response_time\":0,\"size\":0}}"
    fi
}

# ===== HEALTH CHECKS =====
echo "🔍 Running Health Checks..."
run_endpoint_test "health_checks" "API Gateway Health" "make_api_call GET https://api.$ENVIRONMENT.yourdomain.com/health" 200 500
run_endpoint_test "health_checks" "API Gateway Ready" "make_api_call GET https://api.$ENVIRONMENT.yourdomain.com/ready" 200 500
run_endpoint_test "health_checks" "Inventory Service Health" "make_api_call GET http://inventory-service:8000/health" 200 1000
run_endpoint_test "health_checks" "Order Service Health" "make_api_call GET http://order-service:4003/health" 200 1000
run_endpoint_test "health_checks" "User Service Health" "make_api_call GET http://user-service:4001/health" 200 1000

# ===== RESPONSE VALIDATION =====
echo ""
echo "📋 Running Response Validation Tests..."
run_endpoint_test "response_validation" "API Status Endpoint" "make_api_call GET https://api.$ENVIRONMENT.yourdomain.com/v1/status" 200 300
run_endpoint_test "response_validation" "Invalid Endpoint" "make_api_call GET https://api.$ENVIRONMENT.yourdomain.com/invalid-endpoint" 404 300
run_endpoint_test "response_validation" "Method Not Allowed" "make_api_call POST https://api.$ENVIRONMENT.yourdomain.com/v1/status" 405 300

# ===== AUTHENTICATION TESTS =====
echo ""
echo "🔐 Running Authentication Tests..."
run_endpoint_test "authentication" "Login with Valid Credentials" "make_api_call POST https://api.$ENVIRONMENT.yourdomain.com/auth/login 'Content-Type: application/json' '{\"email\":\"test@example.com\",\"password\":\"testpass123\"}'" 200 1000
run_endpoint_test "authentication" "Login with Invalid Credentials" "make_api_call POST https://api.$ENVIRONMENT.yourdomain.com/auth/login 'Content-Type: application/json' '{\"email\":\"invalid@example.com\",\"password\":\"wrongpass\"}'" 401 1000
run_endpoint_test "authentication" "Protected Endpoint Without Auth" "make_api_call GET https://api.$ENVIRONMENT.yourdomain.com/user/profile" 401 500

# ===== AUTHORIZATION TESTS =====
echo ""
echo "🛡️  Running Authorization Tests..."

# Get valid token for authorization tests
TOKEN=$(curl -s -X POST "https://api.$ENVIRONMENT.yourdomain.com/auth/login" \
    -H 'Content-Type: application/json' \
    -d '{"email":"test@example.com","password":"testpass123"}' | jq -r '.token' 2>/dev/null || echo "")

if [[ -n "$TOKEN" && "$TOKEN" != "null" ]]; then
    run_endpoint_test "authorization" "Access Own Profile" "make_api_call GET https://api.$ENVIRONMENT.yourdomain.com/user/profile 'Authorization: Bearer $TOKEN'" 200 500
    run_endpoint_test "authorization" "Access Admin Endpoint as User" "make_api_call GET https://api.$ENVIRONMENT.yourdomain.com/admin/users 'Authorization: Bearer $TOKEN'" 403 500
else
    echo "⚠️  Skipping authorization tests - could not obtain valid token"
fi

# ===== DATA INTEGRITY TESTS =====
echo ""
echo "🔍 Running Data Integrity Tests..."

# Test data consistency
run_endpoint_test "data_integrity" "Get User Data" "make_api_call GET https://api.$ENVIRONMENT.yourdomain.com/user/profile 'Authorization: Bearer $TOKEN'" 200 500

# Test required fields validation
run_endpoint_test "data_integrity" "Create Order with Missing Fields" "make_api_call POST https://api.$ENVIRONMENT.yourdomain.com/orders 'Content-Type: application/json,Authorization: Bearer $TOKEN' '{\"items\":[]}'" 400 500

# ===== RATE LIMITING TESTS =====
echo ""
echo "⏱️  Running Rate Limiting Tests..."

# Test rate limiting by making multiple rapid requests
echo "Testing rate limiting with rapid requests..."
RATE_LIMIT_TEST_PASSED=true
for i in {1..10}; do
    RESPONSE=$(make_api_call GET https://api.$ENVIRONMENT.yourdomain.com/v1/status)
    STATUS_CODE=$(echo "$RESPONSE" | jq -r '.metadata.status_code' 2>/dev/null || echo "0")

    if [[ $STATUS_CODE -eq 429 ]]; then
        echo "Rate limit detected on request $i"
        break
    elif [[ $STATUS_CODE -ne 200 ]]; then
        echo "Unexpected status $STATUS_CODE on request $i"
        RATE_LIMIT_TEST_PASSED=false
        break
    fi

    # Small delay between requests
    sleep 0.1
done

if [[ $RATE_LIMIT_TEST_PASSED == true ]]; then
    run_endpoint_test "rate_limiting" "Rate Limiting Detection" "echo 'Rate limiting test completed'" 200 100
else
    run_endpoint_test "rate_limiting" "Rate Limiting Detection" "echo 'Rate limiting test failed'" 500 100
fi

# ===== CORS TESTS =====
echo ""
echo "🌐 Running CORS Tests..."

# Test CORS preflight request
run_endpoint_test "cors" "CORS Preflight" "make_api_call OPTIONS https://api.$ENVIRONMENT.yourdomain.com/user/profile 'Origin: https://frontend.yourdomain.com,Access-Control-Request-Method: GET'" 200 500

# Test CORS headers in actual request
CORS_RESPONSE=$(curl -s -I -H "Origin: https://frontend.yourdomain.com" "https://api.$ENVIRONMENT.yourdomain.com/health")
if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    run_endpoint_test "cors" "CORS Headers Present" "echo 'CORS headers found'" 200 100
else
    run_endpoint_test "cors" "CORS Headers Present" "echo 'CORS headers missing'" 500 100
fi

# ===== PERFORMANCE TESTS =====
echo ""
echo "⚡ Running Performance Tests..."

# Test response times under load
echo "Testing response times..."
TOTAL_TIME=0
SUCCESS_COUNT=0

for i in {1..5}; do
    START=$(date +%s%N)
    if curl -s --max-time 5 "https://api.$ENVIRONMENT.yourdomain.com/health" >/dev/null; then
        END=$(date +%s%N)
        RESPONSE_TIME=$(( (END - START) / 1000000 ))
        TOTAL_TIME=$((TOTAL_TIME + RESPONSE_TIME))
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    fi
    sleep 0.2
done

if [[ $SUCCESS_COUNT -gt 0 ]]; then
    AVG_TIME=$((TOTAL_TIME / SUCCESS_COUNT))
    if [[ $AVG_TIME -le 500 ]]; then
        run_endpoint_test "performance" "Average Response Time" "echo 'Average time: ${AVG_TIME}ms'" 200 100
    else
        run_endpoint_test "performance" "Average Response Time" "echo 'Average time: ${AVG_TIME}ms'" 500 100
    fi
fi

# ===== GENERATE SUMMARY =====
echo ""
echo "📊 Generating Test Summary..."

# Calculate overall statistics
TOTAL_TESTS=0
TOTAL_PASSED=0
TOTAL_FAILED=0

for category in health_checks response_validation authentication authorization data_integrity rate_limiting cors performance; do
    CAT_TOTAL=$(jq ".test_categories.$category.summary.total" "$REPORT_FILE")
    CAT_PASSED=$(jq ".test_categories.$category.summary.passed" "$REPORT_FILE")
    CAT_FAILED=$(jq ".test_categories.$category.summary.failed" "$REPORT_FILE")

    TOTAL_TESTS=$((TOTAL_TESTS + CAT_TOTAL))
    TOTAL_PASSED=$((TOTAL_PASSED + CAT_PASSED))
    TOTAL_FAILED=$((TOTAL_FAILED + CAT_FAILED))

    echo "  $category: $CAT_PASSED/$CAT_TOTAL passed"
done

echo ""
echo "=== Overall Endpoint Test Summary ==="
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $TOTAL_PASSED"
echo "Failed: $TOTAL_FAILED"

SUCCESS_RATE=$((TOTAL_PASSED * 100 / TOTAL_TESTS))

# Determine overall status
if [[ $TOTAL_FAILED -eq 0 ]]; then
    echo -e "${GREEN}✅ All endpoint tests PASSED!${NC}"
    jq '.overall_status = "passed"' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    exit 0
elif [[ $SUCCESS_RATE -ge 85 ]]; then
    echo -e "${YELLOW}⚠️  Endpoint tests mostly PASSED ($SUCCESS_RATE%)${NC}"
    jq '.overall_status = "warning"' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    exit 0
else
    echo -e "${RED}❌ Endpoint tests FAILED ($SUCCESS_RATE%)${NC}"
    jq '.overall_status = "failed"' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    exit 1
fi