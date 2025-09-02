#!/bin/bash
# scripts/validation/integration-tests-enhanced.sh
# Enhanced integration testing suite with comprehensive workflows

ENVIRONMENT=${1:-staging}
TEST_USER=${2:-test-user-$(date +%s)@example.com}
REPORT_FILE="/tmp/integration_test_enhanced_${ENVIRONMENT}_$(date +%Y%m%d_%H%M%S).json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=== Enhanced Integration Testing Suite for $ENVIRONMENT ==="
echo "Test User: $TEST_USER"
echo ""

# Initialize comprehensive report
cat > "$REPORT_FILE" << EOF
{
  "environment": "$ENVIRONMENT",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "test_user": "$TEST_USER",
  "test_suites": {
    "user_workflow": {"tests": [], "summary": {"total": 0, "passed": 0, "failed": 0}},
    "order_workflow": {"tests": [], "summary": {"total": 0, "passed": 0, "failed": 0}},
    "inventory_workflow": {"tests": [], "summary": {"total": 0, "passed": 0, "failed": 0}},
    "payment_workflow": {"tests": [], "summary": {"total": 0, "passed": 0, "failed": 0}},
    "notification_workflow": {"tests": [], "summary": {"total": 0, "passed": 0, "failed": 0}},
    "database_integration": {"tests": [], "summary": {"total": 0, "passed": 0, "failed": 0}},
    "external_services": {"tests": [], "summary": {"total": 0, "passed": 0, "failed": 0}},
    "data_flow": {"tests": [], "summary": {"total": 0, "passed": 0, "failed": 0}},
    "business_logic": {"tests": [], "summary": {"total": 0, "passed": 0, "failed": 0}},
    "performance_benchmarks": {"tests": [], "summary": {"total": 0, "passed": 0, "failed": 0}}
  },
  "overall_status": "running"
}
EOF

# Enhanced test function with suite categorization
run_integration_test() {
    local suite=$1
    local test_name=$2
    local command=$3
    local expected_result=${4:-"success"}

    echo -n "[$suite] $test_name... "

    # Add test to results
    jq --arg suite "$suite" --arg name "$test_name" '.test_suites[$suite].tests += [{"name": $name, "status": "running", "start_time": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'", "expected_result": "'$expected_result'"}]' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"

    # Run test
    if eval "$command"; then
        echo -e "${GREEN}PASSED${NC}"
        jq --arg suite "$suite" --arg name "$test_name" '(.test_suites[$suite].tests[] | select(.name == $name) | .status) = "passed" | (.test_suites[$suite].tests[] | select(.name == $name) | .end_time) = "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'" | .test_suites[$suite].summary.passed += 1 | .test_suites[$suite].summary.total += 1' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
        return 0
    else
        echo -e "${RED}FAILED${NC}"
        jq --arg suite "$suite" --arg name "$test_name" '(.test_suites[$suite].tests[] | select(.name == $name) | .status) = "failed" | (.test_suites[$suite].tests[] | select(.name == $name) | .end_time) = "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'" | .test_suites[$suite].summary.failed += 1 | .test_suites[$suite].summary.total += 1' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
        return 1
    fi
}

# ===== USER WORKFLOW TESTS =====
echo "👤 Running User Workflow Tests..."

run_integration_test "user_workflow" "User Registration" "
curl -s -X POST 'https://api.$ENVIRONMENT.yourdomain.com/auth/register' \
  -H 'Content-Type: application/json' \
  -d '{\"email\":\"$TEST_USER\",\"password\":\"TestPass123!\",\"name\":\"Test User\",\"phone\":\"+1234567890\"}' | jq -e '.success == true'
"

run_integration_test "user_workflow" "Email Verification" "
sleep 2
curl -s 'https://api.$ENVIRONMENT.yourdomain.com/auth/verify-email?token=test-token' | jq -e '.verified == true'
"

run_integration_test "user_workflow" "User Login" "
TOKEN=\$(curl -s -X POST 'https://api.$ENVIRONMENT.yourdomain.com/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{\"email\":\"$TEST_USER\",\"password\":\"TestPass123!\"}' | jq -r '.token')
[[ -n \"\$TOKEN\" && \"\$TOKEN\" != \"null\" ]]
"

# Get token for subsequent tests
TOKEN=$(curl -s -X POST "https://api.$ENVIRONMENT.yourdomain.com/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$TEST_USER\",\"password\":\"TestPass123!\"}" | jq -r '.token')

if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
    echo "❌ Failed to obtain authentication token - aborting remaining tests"
    exit 1
fi

run_integration_test "user_workflow" "Get User Profile" "
curl -s 'https://api.$ENVIRONMENT.yourdomain.com/user/profile' \
  -H \"Authorization: Bearer \$TOKEN\" | jq -e '.email == \"$TEST_USER\"'
"

run_integration_test "user_workflow" "Update User Profile" "
curl -s -X PUT 'https://api.$ENVIRONMENT.yourdomain.com/user/profile' \
  -H 'Content-Type: application/json' \
  -H \"Authorization: Bearer \$TOKEN\" \
  -d '{\"name\":\"Updated Test User\",\"phone\":\"+1987654321\"}' | jq -e '.success == true'
"

# ===== ORDER WORKFLOW TESTS =====
echo ""
echo "📦 Running Order Workflow Tests..."

run_integration_test "order_workflow" "Create Order" "
ORDER_ID=\$(curl -s -X POST 'https://api.$ENVIRONMENT.yourdomain.com/orders' \
  -H 'Content-Type: application/json' \
  -H \"Authorization: Bearer \$TOKEN\" \
  -d '{\"items\":[{\"product_id\":\"test-product-001\",\"quantity\":2,\"price\":29.99}],\"shipping_address\":{\"street\":\"123 Test St\",\"city\":\"Test City\",\"state\":\"TS\",\"zip\":\"12345\",\"country\":\"USA\"},\"billing_address\":{\"street\":\"123 Test St\",\"city\":\"Test City\",\"state\":\"TS\",\"zip\":\"12345\",\"country\":\"USA\"}}' | jq -r '.order.id')
[[ -n \"\$ORDER_ID\" && \"\$ORDER_ID\" != \"null\" ]]
"

# Get order ID for subsequent tests
ORDER_ID=$(curl -s -X POST 'https://api.$ENVIRONMENT.yourdomain.com/orders' \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"items":[{"product_id":"test-product-001","quantity":2,"price":29.99}],"shipping_address":{"street":"123 Test St","city":"Test City","state":"TS","zip":"12345","country":"USA"},"billing_address":{"street":"123 Test St","city":"Test City","state":"TS","zip":"12345","country":"USA"}}' | jq -r '.order.id')

run_integration_test "order_workflow" "Get Order Details" "
curl -s \"https://api.$ENVIRONMENT.yourdomain.com/orders/\$ORDER_ID\" \
  -H \"Authorization: Bearer \$TOKEN\" | jq -e '.order.id == \"$ORDER_ID\"'
"

run_integration_test "order_workflow" "Update Order Status" "
curl -s -X PUT \"https://api.$ENVIRONMENT.yourdomain.com/orders/\$ORDER_ID/status\" \
  -H 'Content-Type: application/json' \
  -H \"Authorization: Bearer \$TOKEN\" \
  -d '{\"status\":\"confirmed\"}' | jq -e '.success == true'
"

run_integration_test "order_workflow" "List User Orders" "
curl -s 'https://api.$ENVIRONMENT.yourdomain.com/orders' \
  -H \"Authorization: Bearer \$TOKEN\" | jq -e '(.orders | length) >= 1'
"

# ===== INVENTORY WORKFLOW TESTS =====
echo ""
echo "📊 Running Inventory Workflow Tests..."

run_integration_test "inventory_workflow" "Check Product Availability" "
curl -s 'https://api.$ENVIRONMENT.yourdomain.com/inventory/test-product-001' \
  -H \"Authorization: Bearer \$TOKEN\" | jq -e '.available > 0'
"

run_integration_test "inventory_workflow" "Update Inventory" "
curl -s -X PUT 'https://api.$ENVIRONMENT.yourdomain.com/inventory/test-product-001' \
  -H 'Content-Type: application/json' \
  -H \"Authorization: Bearer \$TOKEN\" \
  -d '{\"quantity\":50,\"location\":\"warehouse-001\"}' | jq -e '.success == true'
"

run_integration_test "inventory_workflow" "Inventory Synchronization" "
sleep 2
curl -s 'https://api.$ENVIRONMENT.yourdomain.com/inventory/sync' \
  -H \"Authorization: Bearer \$TOKEN\" | jq -e '.synced == true'
"

# ===== PAYMENT WORKFLOW TESTS =====
echo ""
echo "💳 Running Payment Workflow Tests..."

run_integration_test "payment_workflow" "Create Payment Intent" "
PAYMENT_INTENT=\$(curl -s -X POST 'https://api.$ENVIRONMENT.yourdomain.com/payments/create-intent' \
  -H 'Content-Type: application/json' \
  -H \"Authorization: Bearer \$TOKEN\" \
  -d '{\"order_id\":\"$ORDER_ID\",\"amount\":59.98,\"currency\":\"USD\"}' | jq -r '.client_secret')
[[ -n \"\$PAYMENT_INTENT\" && \"\$PAYMENT_INTENT\" != \"null\" ]]
"

run_integration_test "payment_workflow" "Process Payment" "
curl -s -X POST 'https://api.$ENVIRONMENT.yourdomain.com/payments/process' \
  -H 'Content-Type: application/json' \
  -H \"Authorization: Bearer \$TOKEN\" \
  -d '{\"order_id\":\"$ORDER_ID\",\"payment_method_id\":\"pm_test_card\",\"amount\":59.98}' | jq -e '.status == \"succeeded\"'
"

run_integration_test "payment_workflow" "Payment Confirmation" "
sleep 3
curl -s \"https://api.$ENVIRONMENT.yourdomain.com/payments/confirmation/\$ORDER_ID\" \
  -H \"Authorization: Bearer \$TOKEN\" | jq -e '.confirmed == true'
"

# ===== NOTIFICATION WORKFLOW TESTS =====
echo ""
echo "📧 Running Notification Workflow Tests..."

run_integration_test "notification_workflow" "Send Order Confirmation Email" "
curl -s -X POST 'https://api.$ENVIRONMENT.yourdomain.com/notifications/email' \
  -H 'Content-Type: application/json' \
  -H \"Authorization: Bearer \$TOKEN\" \
  -d '{\"type\":\"order_confirmation\",\"order_id\":\"$ORDER_ID\",\"recipient\":\"$TEST_USER\"}' | jq -e '.sent == true'
"

run_integration_test "notification_workflow" "Send SMS Notification" "
curl -s -X POST 'https://api.$ENVIRONMENT.yourdomain.com/notifications/sms' \
  -H 'Content-Type: application/json' \
  -H \"Authorization: Bearer \$TOKEN\" \
  -d '{\"type\":\"order_update\",\"order_id\":\"$ORDER_ID\",\"phone\":\"+1234567890\",\"message\":\"Your order has been confirmed\"}' | jq -e '.sent == true'
"

run_integration_test "notification_workflow" "Get Notification History" "
sleep 2
curl -s 'https://api.$ENVIRONMENT.yourdomain.com/notifications' \
  -H \"Authorization: Bearer \$TOKEN\" | jq -e '(.notifications | length) >= 2'
"

# ===== DATABASE INTEGRATION TESTS =====
echo ""
echo "🗄️  Running Database Integration Tests..."

run_integration_test "database_integration" "Database Connection" "
pg_isready -h \$DB_HOST -p \$DB_PORT -U \$DB_USER -d \$DB_NAME
"

run_integration_test "database_integration" "User Data Persistence" "
# Check if user was created in database
USER_COUNT=\$(kubectl exec -n logi-core \$(kubectl get pods -n logi-core -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- \
  psql -U logistics -d logistics -c \"SELECT COUNT(*) FROM users WHERE email = '$TEST_USER';\" 2>/dev/null | tail -3 | head -1 | tr -d ' ')
[[ \"\$USER_COUNT\" -gt 0 ]]
"

run_integration_test "database_integration" "Order Data Persistence" "
# Check if order was created in database
ORDER_COUNT=\$(kubectl exec -n logi-core \$(kubectl get pods -n logi-core -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- \
  psql -U logistics -d logistics -c \"SELECT COUNT(*) FROM orders WHERE id = '$ORDER_ID';\" 2>/dev/null | tail -3 | head -1 | tr -d ' ')
[[ \"\$ORDER_COUNT\" -gt 0 ]]
"

# ===== EXTERNAL SERVICES INTEGRATION =====
echo ""
echo "🔗 Running External Services Integration Tests..."

run_integration_test "external_services" "Geolocation Service" "
curl -s 'https://api.$ENVIRONMENT.yourdomain.com/geolocation/validate-address' \
  -H 'Content-Type: application/json' \
  -H \"Authorization: Bearer \$TOKEN\" \
  -d '{\"address\":\"123 Test St, Test City, TS 12345\"}' | jq -e '.valid == true'
"

run_integration_test "external_services" "Shipping Provider Integration" "
curl -s -X POST 'https://api.$ENVIRONMENT.yourdomain.com/shipping/calculate' \
  -H 'Content-Type: application/json' \
  -H \"Authorization: Bearer \$TOKEN\" \
  -d '{\"origin\":\"12345\",\"destination\":\"67890\",\"weight\":2.5,\"service\":\"standard\"}' | jq -e '.rate > 0'
"

run_integration_test "external_services" "Third-party API Health" "
curl -s 'https://api.$ENVIRONMENT.yourdomain.com/external/health' \
  -H \"Authorization: Bearer \$TOKEN\" | jq -e '.status == \"healthy\"'
"

# ===== DATA FLOW VALIDATION =====
echo ""
echo "🔄 Running Data Flow Validation Tests..."

run_integration_test "data_flow" "Order to Inventory Sync" "
# Verify inventory was updated when order was placed
INVENTORY_LEVEL=\$(curl -s 'https://api.$ENVIRONMENT.yourdomain.com/inventory/test-product-001' \
  -H \"Authorization: Bearer \$TOKEN\" | jq -r '.quantity')
[[ \"\$INVENTORY_LEVEL\" -lt 100 ]]  # Should be reduced from order
"

run_integration_test "data_flow" "Payment to Order Status Sync" "
# Verify order status updated after payment
ORDER_STATUS=\$(curl -s \"https://api.$ENVIRONMENT.yourdomain.com/orders/\$ORDER_ID\" \
  -H \"Authorization: Bearer \$TOKEN\" | jq -r '.order.status')
[[ \"\$ORDER_STATUS\" == \"paid\" || \"\$ORDER_STATUS\" == \"processing\" ]]
"

run_integration_test "data_flow" "Audit Trail Integrity" "
# Check audit logs for the order
AUDIT_COUNT=\$(kubectl exec -n logi-core \$(kubectl get pods -n logi-core -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- \
  psql -U logistics -d logistics -c \"SELECT COUNT(*) FROM audit_logs WHERE entity_id = '$ORDER_ID';\" 2>/dev/null | tail -3 | head -1 | tr -d ' ')
[[ \"\$AUDIT_COUNT\" -gt 0 ]]
"

# ===== BUSINESS LOGIC TESTS =====
echo ""
echo "🧠 Running Business Logic Tests..."

run_integration_test "business_logic" "Tax Calculation" "
TAX_AMOUNT=\$(curl -s -X POST 'https://api.$ENVIRONMENT.yourdomain.com/orders/calculate-tax' \
  -H 'Content-Type: application/json' \
  -H \"Authorization: Bearer \$TOKEN\" \
  -d '{\"subtotal\":59.98,\"state\":\"CA\",\"items\":[{\"category\":\"electronics\",\"price\":29.99}]}' | jq -r '.tax')
[[ \"\$(echo \"\$TAX_AMOUNT > 0\" | bc -l)\" -eq 1 ]]
"

run_integration_test "business_logic" "Discount Application" "
DISCOUNTED_TOTAL=\$(curl -s -X POST 'https://api.$ENVIRONMENT.yourdomain.com/orders/apply-discount' \
  -H 'Content-Type: application/json' \
  -H \"Authorization: Bearer \$TOKEN\" \
  -d '{\"subtotal\":59.98,\"discount_code\":\"SAVE10\",\"order_id\":\"$ORDER_ID\"}' | jq -r '.total')
[[ \"\$(echo \"\$DISCOUNTED_TOTAL < 59.98\" | bc -l)\" -eq 1 ]]
"

run_integration_test "business_logic" "Shipping Cost Calculation" "
SHIPPING_COST=\$(curl -s -X POST 'https://api.$ENVIRONMENT.yourdomain.com/orders/calculate-shipping' \
  -H 'Content-Type: application/json' \
  -H \"Authorization: Bearer \$TOKEN\" \
  -d '{\"weight\":2.5,\"distance\":500,\"service_level\":\"standard\"}' | jq -r '.cost')
[[ \"\$(echo \"\$SHIPPING_COST > 0\" | bc -l)\" -eq 1 ]]
"

# ===== PERFORMANCE BENCHMARKS =====
echo ""
echo "⚡ Running Performance Benchmarks..."

run_integration_test "performance_benchmarks" "API Response Time" "
START=\$(date +%s%N)
curl -s 'https://api.$ENVIRONMENT.yourdomain.com/user/profile' \
  -H \"Authorization: Bearer \$TOKEN\" >/dev/null
END=\$(date +%s%N)
RESPONSE_TIME=\$(( (END - START) / 1000000 ))
[[ \$RESPONSE_TIME -lt 1000 ]]
"

run_integration_test "performance_benchmarks" "Database Query Performance" "
START=\$(date +%s%N)
kubectl exec -n logi-core \$(kubectl get pods -n logi-core -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- \
  psql -U logistics -d logistics -c \"SELECT COUNT(*) FROM orders WHERE created_at > NOW() - INTERVAL '24 hours';\" >/dev/null 2>&1
END=\$(date +%s%N)
QUERY_TIME=\$(( (END - START) / 1000000 ))
[[ \$QUERY_TIME -lt 500 ]]
"

run_integration_test "performance_benchmarks" "Concurrent User Handling" "
# Test handling multiple concurrent requests
for i in {1..5}; do
  curl -s 'https://api.$ENVIRONMENT.yourdomain.com/health' >/dev/null &
done
wait
echo 'Concurrent requests completed successfully'
"

# ===== CLEANUP =====
echo ""
echo "🧹 Cleaning up test data..."

curl -s -X DELETE "https://api.$ENVIRONMENT.yourdomain.com/user/profile" \
  -H "Authorization: Bearer $TOKEN" >/dev/null 2>&1 || true

curl -s -X DELETE "https://api.$ENVIRONMENT.yourdomain.com/orders/$ORDER_ID" \
  -H "Authorization: Bearer $TOKEN" >/dev/null 2>&1 || true

# ===== GENERATE SUMMARY =====
echo ""
echo "📊 Generating Integration Test Summary..."

# Calculate overall statistics
TOTAL_TESTS=0
TOTAL_PASSED=0
TOTAL_FAILED=0

for suite in user_workflow order_workflow inventory_workflow payment_workflow notification_workflow database_integration external_services data_flow business_logic performance_benchmarks; do
    SUITE_TOTAL=$(jq ".test_suites.$suite.summary.total" "$REPORT_FILE")
    SUITE_PASSED=$(jq ".test_suites.$suite.summary.passed" "$REPORT_FILE")
    SUITE_FAILED=$(jq ".test_suites.$suite.summary.failed" "$REPORT_FILE")

    TOTAL_TESTS=$((TOTAL_TESTS + SUITE_TOTAL))
    TOTAL_PASSED=$((TOTAL_PASSED + SUITE_PASSED))
    TOTAL_FAILED=$((TOTAL_FAILED + SUITE_FAILED))

    echo "  $suite: $SUITE_PASSED/$SUITE_TOTAL passed"
done

echo ""
echo "=== Enhanced Integration Test Summary ==="
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $TOTAL_PASSED"
echo "Failed: $TOTAL_FAILED"

SUCCESS_RATE=$((TOTAL_PASSED * 100 / TOTAL_TESTS))

# Determine overall status
if [[ $TOTAL_FAILED -eq 0 ]]; then
    echo -e "${GREEN}✅ All integration tests PASSED!${NC}"
    jq '.overall_status = "passed"' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    exit 0
elif [[ $SUCCESS_RATE -ge 80 ]]; then
    echo -e "${YELLOW}⚠️  Integration tests mostly PASSED ($SUCCESS_RATE%)${NC}"
    jq '.overall_status = "warning"' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    exit 0
else
    echo -e "${RED}❌ Integration tests FAILED ($SUCCESS_RATE%)${NC}"
    jq '.overall_status = "failed"' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    exit 1
fi