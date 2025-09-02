#!/bin/bash
# scripts/validation/integration-tests.sh
# Integration tests for post-deployment validation

ENVIRONMENT=${1:-staging}
TEST_USER=${2:-test-user-$(date +%s)@example.com}
REPORT_FILE="/tmp/integration_test_${ENVIRONMENT}_$(date +%Y%m%d_%H%M%S).json"

echo "=== Integration Tests for $ENVIRONMENT ==="
echo "Test User: $TEST_USER"
echo ""

# Initialize report
cat > "$REPORT_FILE" << EOF
{
  "environment": "$ENVIRONMENT",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "test_user": "$TEST_USER",
  "tests": [],
  "summary": {"total": 0, "passed": 0, "failed": 0}
}
EOF

# Test function
run_integration_test() {
    local test_name=$1
    local command=$2

    echo -n "Running $test_name... "

    jq --arg name "$test_name" '.tests += [{"name": $name, "status": "running", "start_time": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}]' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"

    if eval "$command"; then
        echo -e "${GREEN}PASSED${NC}"
        jq --arg name "$test_name" '(.tests[] | select(.name == $name) | .status) = "passed" | (.tests[] | select(.name == $name) | .end_time) = "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'" | .summary.passed += 1 | .summary.total += 1' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
        return 0
    else
        echo -e "${RED}FAILED${NC}"
        jq --arg name "$test_name" '(.tests[] | select(.name == $name) | .status) = "failed" | (.tests[] | select(.name == $name) | .end_time) = "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'" | .summary.failed += 1 | .summary.total += 1' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
        return 1
    fi
}

# User Registration Test
run_integration_test "User Registration" "
curl -s -X POST 'https://api.$ENVIRONMENT.yourdomain.com/auth/register' \
  -H 'Content-Type: application/json' \
  -d '{\"email\":\"$TEST_USER\",\"password\":\"TestPass123!\",\"name\":\"Test User\"}' | jq -e '.success == true'
"

# User Login Test
run_integration_test "User Login" "
TOKEN=\$(curl -s -X POST 'https://api.$ENVIRONMENT.yourdomain.com/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{\"email\":\"$TEST_USER\",\"password\":\"TestPass123!\"}' | jq -r '.token')
[[ -n \"\$TOKEN\" && \"\$TOKEN\" != \"null\" ]]
"

# Get authentication token for subsequent tests
TOKEN=$(curl -s -X POST "https://api.$ENVIRONMENT.yourdomain.com/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$TEST_USER\",\"password\":\"TestPass123!\"}" | jq -r '.token')

if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
    echo "Failed to obtain authentication token"
    exit 1
fi

# Order Creation Test
run_integration_test "Order Creation" "
ORDER_ID=\$(curl -s -X POST 'https://api.$ENVIRONMENT.yourdomain.com/orders' \
  -H 'Content-Type: application/json' \
  -H \"Authorization: Bearer \$TOKEN\" \
  -d '{\"items\":[{\"product_id\":\"test-product\",\"quantity\":1}],\"shipping_address\":{\"street\":\"123 Test St\",\"city\":\"Test City\",\"zip\":\"12345\"}}' | jq -r '.order.id')
[[ -n \"\$ORDER_ID\" && \"\$ORDER_ID\" != \"null\" ]]
"

# Inventory Check Test
run_integration_test "Inventory Synchronization" "
curl -s 'https://api.$ENVIRONMENT.yourdomain.com/inventory/test-product' \
  -H \"Authorization: Bearer \$TOKEN\" | jq -e '.available > 0'
"

# Payment Processing Test (mock)
run_integration_test "Payment Processing" "
curl -s -X POST 'https://api.$ENVIRONMENT.yourdomain.com/payments' \
  -H 'Content-Type: application/json' \
  -H \"Authorization: Bearer \$TOKEN\" \
  -d '{\"order_id\":\"test-order\",\"amount\":100.00,\"payment_method\":\"credit_card\"}' | jq -e '.status == \"completed\"'
"

# Notification Delivery Test
run_integration_test "Notification Delivery" "
sleep 2  # Wait for async processing
curl -s 'https://api.$ENVIRONMENT.yourdomain.com/notifications' \
  -H \"Authorization: Bearer \$TOKEN\" | jq -e 'length > 0'
"

# Data Consistency Test
run_integration_test "Data Consistency" "
USER_DATA=\$(curl -s 'https://api.$ENVIRONMENT.yourdomain.com/user/profile' \
  -H \"Authorization: Bearer \$TOKEN\" | jq -r '.email')
[[ \"\$USER_DATA\" == \"$TEST_USER\" ]]
"

# Cleanup test data
echo "Cleaning up test data..."
curl -s -X DELETE "https://api.$ENVIRONMENT.yourdomain.com/user/profile" \
  -H "Authorization: Bearer $TOKEN" >/dev/null 2>&1 || true

# Summary
TOTAL=$(jq '.summary.total' "$REPORT_FILE")
PASSED=$(jq '.summary.passed' "$REPORT_FILE")
FAILED=$(jq '.summary.failed' "$REPORT_FILE")

echo ""
echo "=== Integration Test Summary ==="
echo "Total Tests: $TOTAL"
echo "Passed: $PASSED"
echo "Failed: $FAILED"

SUCCESS_RATE=$((PASSED * 100 / TOTAL))

if [[ $FAILED -eq 0 ]]; then
    echo -e "${GREEN}✅ All integration tests PASSED!${NC}"
    jq '.overall_status = "passed"' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    exit 0
elif [[ $SUCCESS_RATE -ge 70 ]]; then
    echo -e "${YELLOW}⚠️  Integration tests mostly PASSED ($SUCCESS_RATE%)${NC}"
    jq '.overall_status = "warning"' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    exit 0
else
    echo -e "${RED}❌ Integration tests FAILED ($SUCCESS_RATE%)${NC}"
    jq '.overall_status = "failed"' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    exit 1
fi