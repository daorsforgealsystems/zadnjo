#!/bin/bash
# scripts/validation/smoke-tests.sh
# Automated smoke tests for post-deployment validation

ENVIRONMENT=${1:-production}
TIMEOUT=${2:-30}
TEST_RESULTS="/tmp/smoke_test_results_${ENVIRONMENT}_$(date +%Y%m%d_%H%M%S).json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Initialize results
cat > "$TEST_RESULTS" << EOF
{
  "environment": "$ENVIRONMENT",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "tests": [],
  "summary": {"total": 0, "passed": 0, "failed": 0, "skipped": 0}
}
EOF

# Test function
run_test() {
    local test_name=$1
    local command=$2
    local expected_exit=${3:-0}

    echo -n "Running $test_name... "

    # Add test to results
    jq --arg name "$test_name" '.tests += [{"name": $name, "status": "running", "start_time": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}]' "$TEST_RESULTS" > "${TEST_RESULTS}.tmp" && mv "${TEST_RESULTS}.tmp" "$TEST_RESULTS"

    # Run test with timeout
    if timeout $TIMEOUT bash -c "$command" >/dev/null 2>&1; then
        local actual_exit=$?
        if [[ $actual_exit -eq $expected_exit ]]; then
            echo -e "${GREEN}PASSED${NC}"
            jq --arg name "$test_name" '(.tests[] | select(.name == $name) | .status) = "passed" | (.tests[] | select(.name == $name) | .end_time) = "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'" | .summary.passed += 1 | .summary.total += 1' "$TEST_RESULTS" > "${TEST_RESULTS}.tmp" && mv "${TEST_RESULTS}.tmp" "$TEST_RESULTS"
            return 0
        else
            echo -e "${RED}FAILED${NC} (exit code: $actual_exit)"
            jq --arg name "$test_name" --arg error "Exit code $actual_exit" '(.tests[] | select(.name == $name) | .status) = "failed" | (.tests[] | select(.name == $name) | .error) = $error | (.tests[] | select(.name == $name) | .end_time) = "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'" | .summary.failed += 1 | .summary.total += 1' "$TEST_RESULTS" > "${TEST_RESULTS}.tmp" && mv "${TEST_RESULTS}.tmp" "$TEST_RESULTS"
            return 1
        fi
    else
        echo -e "${RED}TIMEOUT${NC}"
        jq --arg name "$test_name" '(.tests[] | select(.name == $name) | .status) = "failed" | (.tests[] | select(.name == $name) | .error) = "Timeout after '${TIMEOUT}'s" | (.tests[] | select(.name == $name) | .end_time) = "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'" | .summary.failed += 1 | .summary.total += 1' "$TEST_RESULTS" > "${TEST_RESULTS}.tmp" && mv "${TEST_RESULTS}.tmp" "$TEST_RESULTS"
        return 1
    fi
}

echo "=== Smoke Tests for $ENVIRONMENT ==="
echo "Timeout: ${TIMEOUT}s"
echo ""

# API Health Tests
run_test "API Gateway Health" "curl -f -s --max-time 10 https://api.$ENVIRONMENT.yourdomain.com/health"
run_test "API Gateway Ready" "curl -f -s --max-time 10 https://api.$ENVIRONMENT.yourdomain.com/ready"

# Service Health Tests
run_test "Inventory Service Health" "curl -f -s --max-time 10 http://inventory-service:8000/health"
run_test "Order Service Health" "curl -f -s --max-time 10 http://order-service:4003/health"
run_test "User Service Health" "curl -f -s --max-time 10 http://user-service:4001/health"

# Database Tests
run_test "Database Connection" "pg_isready -h \$DB_HOST -p \$DB_PORT -U \$DB_USER -d \$DB_NAME"

# Authentication Tests
run_test "Auth Endpoint" "curl -f -s --max-time 10 -X POST https://api.$ENVIRONMENT.yourdomain.com/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"password\":\"test\"}'"

# Frontend Tests
run_test "Frontend Loading" "curl -f -s --max-time 15 https://$ENVIRONMENT.yourdomain.com/ | grep -q '<!DOCTYPE html>'"
run_test "Frontend Assets" "curl -f -s --max-time 10 https://$ENVIRONMENT.yourdomain.com/static/js/main.js | head -c 100 | grep -q 'function\|const\|var'"

# Kubernetes Tests
run_test "All Pods Ready" "kubectl get pods -n logi-core -o jsonpath='{.items[*].status.conditions[?(@.type==\"Ready\")].status}' | grep -v True | wc -l | grep -q '^0$'"
run_test "No Failed Pods" "kubectl get pods -n logi-core --field-selector=status.phase=Failed -o jsonpath='{.items[*].metadata.name}' | wc -l | grep -q '^0$'"

# Load Balancer Tests
run_test "Ingress Accessible" "curl -f -s --max-time 10 https://api.$ENVIRONMENT.yourdomain.com/v1/status"

# Summary
TOTAL=$(jq '.summary.total' "$TEST_RESULTS")
PASSED=$(jq '.summary.passed' "$TEST_RESULTS")
FAILED=$(jq '.summary.failed' "$TEST_RESULTS")

echo ""
echo "=== Test Summary ==="
echo "Total Tests: $TOTAL"
echo "Passed: $PASSED"
echo "Failed: $FAILED"

SUCCESS_RATE=$((PASSED * 100 / TOTAL))

if [[ $FAILED -eq 0 ]]; then
    echo -e "${GREEN}✅ All smoke tests PASSED!${NC}"
    jq '.overall_status = "passed"' "$TEST_RESULTS" > "${TEST_RESULTS}.tmp" && mv "${TEST_RESULTS}.tmp" "$TEST_RESULTS"
    exit 0
elif [[ $SUCCESS_RATE -ge 80 ]]; then
    echo -e "${YELLOW}⚠️  Smoke tests mostly PASSED ($SUCCESS_RATE%)${NC}"
    jq '.overall_status = "warning"' "$TEST_RESULTS" > "${TEST_RESULTS}.tmp" && mv "${TEST_RESULTS}.tmp" "$TEST_RESULTS"
    exit 0
else
    echo -e "${RED}❌ Smoke tests FAILED ($SUCCESS_RATE%)${NC}"
    jq '.overall_status = "failed"' "$TEST_RESULTS" > "${TEST_RESULTS}.tmp" && mv "${TEST_RESULTS}.tmp" "$TEST_RESULTS"
    exit 1
fi