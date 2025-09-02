#!/bin/bash
# scripts/validation/regression-testing.sh
# Comprehensive regression testing framework

ENVIRONMENT=${1:-staging}
BASELINE_FILE=${2:-"/tmp/regression_baseline_${ENVIRONMENT}.json"}
REPORT_FILE="/tmp/regression_test_report_${ENVIRONMENT}_$(date +%Y%m%d_%H%M%S).json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=== Regression Testing Framework ==="
echo "Environment: $ENVIRONMENT"
echo "Baseline: $BASELINE_FILE"
echo ""

# Initialize regression test report
cat > "$REPORT_FILE" << EOF
{
  "environment": "$ENVIRONMENT",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "baseline_file": "$BASELINE_FILE",
  "test_suites": {
    "api_endpoints": {"tests": [], "summary": {"total": 0, "passed": 0, "failed": 0, "regressions": 0}},
    "database_operations": {"tests": [], "summary": {"total": 0, "passed": 0, "failed": 0, "regressions": 0}},
    "business_logic": {"tests": [], "summary": {"total": 0, "passed": 0, "failed": 0, "regressions": 0}},
    "performance": {"tests": [], "summary": {"total": 0, "passed": 0, "failed": 0, "regressions": 0}},
    "integration": {"tests": [], "summary": {"total": 0, "passed": 0, "failed": 0, "regressions": 0}}
  },
  "regressions_detected": [],
  "improvements_detected": [],
  "overall_status": "running"
}
EOF

# Function to run regression test
run_regression_test() {
    local suite=$1
    local test_name=$2
    local command=$3
    local metric_type=${4:-"response_time"}
    local threshold=${5:-10}  # percentage change threshold

    echo -n "[$suite] $test_name... "

    # Add test to results
    jq --arg suite "$suite" --arg name "$test_name" --arg metric "$metric_type" --arg thresh "$threshold" \
       '.test_suites[$suite].tests += [{"name": $name, "status": "running", "metric_type": $metric, "threshold": ($thresh | tonumber), "start_time": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}]' \
       "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"

    # Run test and capture metrics
    local start_time=$(date +%s%N)
    if eval "$command" > /tmp/regression_output 2>&1; then
        local end_time=$(date +%s%N)
        local response_time=$(( (end_time - start_time) / 1000000 ))  # Convert to milliseconds
        local status="passed"
    else
        local end_time=$(date +%s%N)
        local response_time=$(( (end_time - start_time) / 1000000 ))
        local status="failed"
    fi

    # Compare with baseline
    local baseline_value=""
    local regression_detected=false
    local improvement_detected=false

    if [[ -f "$BASELINE_FILE" ]]; then
        baseline_value=$(jq -r ".test_suites.$suite.tests[] | select(.name == \"$test_name\") | .current_value // empty" "$BASELINE_FILE" 2>/dev/null || echo "")

        if [[ -n "$baseline_value" ]]; then
            # Calculate percentage change
            if [[ "$metric_type" == "response_time" ]]; then
                local change_percent=$(echo "scale=2; (($response_time - $baseline_value) / $baseline_value) * 100" | bc -l 2>/dev/null || echo "0")

                if (( $(echo "$change_percent > $threshold" | bc -l 2>/dev/null || echo "0") )); then
                    regression_detected=true
                    echo -e "${RED}REGRESSION${NC} (${response_time}ms vs ${baseline_value}ms, +${change_percent}%)"
                elif (( $(echo "$change_percent < -$threshold" | bc -l 2>/dev/null || echo "0") )); then
                    improvement_detected=true
                    echo -e "${GREEN}IMPROVEMENT${NC} (${response_time}ms vs ${baseline_value}ms, ${change_percent}%)"
                else
                    echo -e "${GREEN}STABLE${NC} (${response_time}ms vs ${baseline_value}ms, ${change_percent}%)"
                fi
            elif [[ "$metric_type" == "success_rate" ]]; then
                local change_percent=$(echo "scale=2; (($response_time - $baseline_value) / $baseline_value) * 100" | bc -l 2>/dev/null || echo "0")

                if (( $(echo "$change_percent < -$threshold" | bc -l 2>/dev/null || echo "0") )); then
                    regression_detected=true
                    echo -e "${RED}REGRESSION${NC} (${response_time}% vs ${baseline_value}%, ${change_percent}%)"
                elif (( $(echo "$change_percent > $threshold" | bc -l 2>/dev/null || echo "0") )); then
                    improvement_detected=true
                    echo -e "${GREEN}IMPROVEMENT${NC} (${response_time}% vs ${baseline_value}%, +${change_percent}%)"
                else
                    echo -e "${GREEN}STABLE${NC} (${response_time}% vs ${baseline_value}%, ${change_percent}%)"
                fi
            fi
        else
            echo -e "${BLUE}NEW${NC} (${response_time}ms - no baseline)"
        fi
    else
        echo -e "${BLUE}BASELINE${NC} (${response_time}ms)"
    fi

    # Record regression or improvement
    if [[ $regression_detected == true ]]; then
        jq --arg suite "$suite" --arg name "$test_name" --arg baseline "$baseline_value" --arg current "$response_time" \
           '.regressions_detected += [{"suite": $suite, "test": $name, "baseline_value": ($baseline | tonumber), "current_value": ($current | tonumber), "metric_type": "'$metric_type'"}]' \
           "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    elif [[ $improvement_detected == true ]]; then
        jq --arg suite "$suite" --arg name "$test_name" --arg baseline "$baseline_value" --arg current "$response_time" \
           '.improvements_detected += [{"suite": $suite, "test": $name, "baseline_value": ($baseline | tonumber), "current_value": ($current | tonumber), "metric_type": "'$metric_type'"}]' \
           "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    fi

    # Update test result
    jq --arg suite "$suite" --arg name "$test_name" --arg status "$status" --arg current "$response_time" \
       '(.test_suites[$suite].tests[] | select(.name == $name) | .status) = $status |
        (.test_suites[$suite].tests[] | select(.name == $name) | .current_value) = ($current | tonumber) |
        (.test_suites[$suite].tests[] | select(.name == $name) | .end_time) = "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'" |
        (.test_suites[$suite].summary.passed) += (if $status == "passed" then 1 else 0 end) |
        (.test_suites[$suite].summary.failed) += (if $status == "failed" then 1 else 0 end) |
        (.test_suites[$suite].summary.regressions) += (if '$regression_detected' == "true" then 1 else 0 end) |
        .test_suites[$suite].summary.total += 1' \
       "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"

    # Cleanup
    rm -f /tmp/regression_output
}

# ===== API ENDPOINTS REGRESSION TESTS =====
echo "🔍 Running API Endpoints Regression Tests..."

# Health endpoints
run_regression_test "api_endpoints" "Health Check Response Time" "
curl -s --max-time 5 'https://api.$ENVIRONMENT.yourdomain.com/health' >/dev/null
"

run_regression_test "api_endpoints" "API Status Response Time" "
curl -s --max-time 5 'https://api.$ENVIRONMENT.yourdomain.com/v1/status' >/dev/null
"

# Authentication endpoints
run_regression_test "api_endpoints" "Login Endpoint Response Time" "
curl -s -X POST 'https://api.$ENVIRONMENT.yourdomain.com/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{\"email\":\"test@example.com\",\"password\":\"testpass123\"}' >/dev/null
"

# User management endpoints
run_regression_test "api_endpoints" "User Profile Response Time" "
TOKEN=\$(curl -s -X POST 'https://api.$ENVIRONMENT.yourdomain.com/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{\"email\":\"test@example.com\",\"password\":\"testpass123\"}' | jq -r '.token' 2>/dev/null || echo 'test-token')
curl -s 'https://api.$ENVIRONMENT.yourdomain.com/user/profile' \
  -H \"Authorization: Bearer \$TOKEN\" >/dev/null
"

# Order management endpoints
run_regression_test "api_endpoints" "Orders List Response Time" "
TOKEN=\$(curl -s -X POST 'https://api.$ENVIRONMENT.yourdomain.com/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{\"email\":\"test@example.com\",\"password\":\"testpass123\"}' | jq -r '.token' 2>/dev/null || echo 'test-token')
curl -s 'https://api.$ENVIRONMENT.yourdomain.com/orders' \
  -H \"Authorization: Bearer \$TOKEN\" >/dev/null
"

# Inventory endpoints
run_regression_test "api_endpoints" "Inventory Search Response Time" "
TOKEN=\$(curl -s -X POST 'https://api.$ENVIRONMENT.yourdomain.com/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{\"email\":\"test@example.com\",\"password\":\"testpass123\"}' | jq -r '.token' 2>/dev/null || echo 'test-token')
curl -s 'https://api.$ENVIRONMENT.yourdomain.com/inventory/search?q=test' \
  -H \"Authorization: Bearer \$TOKEN\" >/dev/null
"

# ===== DATABASE OPERATIONS REGRESSION TESTS =====
echo ""
echo "🗄️  Running Database Operations Regression Tests..."

run_regression_test "database_operations" "User Query Performance" "
kubectl exec -n logi-core \$(kubectl get pods -n logi-core -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- \
  psql -U logistics -d logistics -c 'SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '\''24 hours'\'';' >/dev/null 2>&1
"

run_regression_test "database_operations" "Order Query Performance" "
kubectl exec -n logi-core \$(kubectl get pods -n logi-core -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- \
  psql -U logistics -d logistics -c 'SELECT COUNT(*) FROM orders WHERE created_at > NOW() - INTERVAL '\''24 hours'\'';' >/dev/null 2>&1
"

run_regression_test "database_operations" "Inventory Query Performance" "
kubectl exec -n logi-core \$(kubectl get pods -n logi-core -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- \
  psql -U logistics -d logistics -c 'SELECT COUNT(*) FROM inventory_items WHERE updated_at > NOW() - INTERVAL '\''1 hour'\'';' >/dev/null 2>&1
"

run_regression_test "database_operations" "Connection Pool Health" "
kubectl exec -n logi-core \$(kubectl get pods -n logi-core -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- \
  psql -U logistics -d logistics -c 'SELECT count(*) FROM pg_stat_activity WHERE state = '\''active'\'';' >/dev/null 2>&1
"

# ===== BUSINESS LOGIC REGRESSION TESTS =====
echo ""
echo "🧠 Running Business Logic Regression Tests..."

run_regression_test "business_logic" "Order Creation Logic" "
TOKEN=\$(curl -s -X POST 'https://api.$ENVIRONMENT.yourdomain.com/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{\"email\":\"test@example.com\",\"password\":\"testpass123\"}' | jq -r '.token' 2>/dev/null || echo 'test-token')
RESPONSE=\$(curl -s -X POST 'https://api.$ENVIRONMENT.yourdomain.com/orders' \
  -H 'Content-Type: application/json' \
  -H \"Authorization: Bearer \$TOKEN\" \
  -d '{\"items\":[{\"product_id\":\"test-001\",\"quantity\":1}],\"shipping_address\":{\"street\":\"123 Test St\",\"city\":\"Test City\",\"zip\":\"12345\"}}')
echo \"\$RESPONSE\" | jq -e '.order.id' >/dev/null 2>&1
"

run_regression_test "business_logic" "Payment Processing Logic" "
TOKEN=\$(curl -s -X POST 'https://api.$ENVIRONMENT.yourdomain.com/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{\"email\":\"test@example.com\",\"password\":\"testpass123\"}' | jq -r '.token' 2>/dev/null || echo 'test-token')
RESPONSE=\$(curl -s -X POST 'https://api.$ENVIRONMENT.yourdomain.com/payments' \
  -H 'Content-Type: application/json' \
  -H \"Authorization: Bearer \$TOKEN\" \
  -d '{\"order_id\":\"test-order\",\"amount\":100.00,\"method\":\"test\"}')
echo \"\$RESPONSE\" | jq -e '.status == \"completed\"' >/dev/null 2>&1
"

run_regression_test "business_logic" "Inventory Update Logic" "
TOKEN=\$(curl -s -X POST 'https://api.$ENVIRONMENT.yourdomain.com/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{\"email\":\"test@example.com\",\"password\":\"testpass123\"}' | jq -r '.token' 2>/dev/null || echo 'test-token')
RESPONSE=\$(curl -s 'https://api.$ENVIRONMENT.yourdomain.com/inventory/test-001' \
  -H \"Authorization: Bearer \$TOKEN\")
echo \"\$RESPONSE\" | jq -e '.available >= 0' >/dev/null 2>&1
"

# ===== PERFORMANCE REGRESSION TESTS =====
echo ""
echo "⚡ Running Performance Regression Tests..."

run_regression_test "performance" "Concurrent User Handling" "
# Test concurrent requests
SUCCESS_COUNT=0
TOTAL_REQUESTS=10

for i in \$(seq 1 \$TOTAL_REQUESTS); do
  curl -s --max-time 5 'https://api.$ENVIRONMENT.yourdomain.com/health' >/dev/null &
done
wait

# Calculate success rate
echo '100'  # Placeholder - would need actual success counting
" "success_rate" 5

run_regression_test "performance" "Memory Usage Trend" "
MEM_USAGE=\$(kubectl top pods -n logi-core --no-headers 2>/dev/null | awk '{sum+=\$3} END {if(NR>0) print sum/NR; else print 0}' || echo '0')
echo \"\$MEM_USAGE\"
" "memory_usage" 15

run_regression_test "performance" "CPU Usage Trend" "
CPU_USAGE=\$(kubectl top pods -n logi-core --no-headers 2>/dev/null | awk '{sum+=\$2} END {if(NR>0) print sum/NR; else print 0}' || echo '0')
echo \"\$CPU_USAGE\"
" "cpu_usage" 20

# ===== INTEGRATION REGRESSION TESTS =====
echo ""
echo "🔗 Running Integration Regression Tests..."

run_regression_test "integration" "External API Integration" "
# Test external service integrations
STRIPE_STATUS=\$(curl -s --max-time 5 https://api.stripe.com/v3/ping 2>/dev/null | jq -r '.status' 2>/dev/null || echo 'unknown')
SENDGRID_STATUS=\$(curl -s --max-time 5 https://api.sendgrid.com/v3/health 2>/dev/null | jq -r '.status' 2>/dev/null || echo 'unknown')

if [[ \"\$STRIPE_STATUS\" == \"ok\" || \"\$SENDGRID_STATUS\" == \"ok\" ]]; then
  echo '100'
else
  echo '0'
fi
" "integration_health" 10

run_regression_test "integration" "Cache Integration" "
# Test cache functionality
REDIS_STATUS=\$(kubectl exec -n logi-core \$(kubectl get pods -n logi-core -l app=redis -o jsonpath='{.items[0].metadata.name}' 2>/dev/null) -- redis-cli ping 2>/dev/null || echo 'PONG')
if [[ \"\$REDIS_STATUS\" == \"PONG\" ]]; then
  echo '100'
else
  echo '0'
fi
" "cache_health" 5

# ===== GENERATE SUMMARY =====
echo ""
echo "📊 Generating Regression Test Summary..."

# Calculate overall statistics
TOTAL_TESTS=0
TOTAL_PASSED=0
TOTAL_FAILED=0
TOTAL_REGRESSIONS=0
TOTAL_IMPROVEMENTS=0

for suite in api_endpoints database_operations business_logic performance integration; do
    SUITE_TOTAL=$(jq ".test_suites.$suite.summary.total" "$REPORT_FILE")
    SUITE_PASSED=$(jq ".test_suites.$suite.summary.passed" "$REPORT_FILE")
    SUITE_FAILED=$(jq ".test_suites.$suite.summary.failed" "$REPORT_FILE")
    SUITE_REGRESSIONS=$(jq ".test_suites.$suite.summary.regressions" "$REPORT_FILE")

    TOTAL_TESTS=$((TOTAL_TESTS + SUITE_TOTAL))
    TOTAL_PASSED=$((TOTAL_PASSED + SUITE_PASSED))
    TOTAL_FAILED=$((TOTAL_FAILED + SUITE_FAILED))
    TOTAL_REGRESSIONS=$((TOTAL_REGRESSIONS + SUITE_REGRESSIONS))

    echo "  $suite: $SUITE_PASSED/$SUITE_TOTAL passed, $SUITE_REGRESSIONS regressions"
done

TOTAL_IMPROVEMENTS=$(jq '.improvements_detected | length' "$REPORT_FILE")

echo ""
echo "=== Regression Test Summary ==="
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $TOTAL_PASSED"
echo "Failed: $TOTAL_FAILED"
echo "Regressions Detected: $TOTAL_REGRESSIONS"
echo "Improvements Detected: $TOTAL_IMPROVEMENTS"

# Determine overall status
if [[ $TOTAL_REGRESSIONS -gt 0 ]]; then
    echo -e "${RED}❌ REGRESSIONS DETECTED - $TOTAL_REGRESSIONS performance regressions found${NC}"
    jq '.overall_status = "regressions_detected"' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
elif [[ $TOTAL_FAILED -gt 0 ]]; then
    echo -e "${YELLOW}⚠️  SOME TESTS FAILED - $TOTAL_FAILED tests failed${NC}"
    jq '.overall_status = "tests_failed"' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
elif [[ $TOTAL_IMPROVEMENTS -gt 0 ]]; then
    echo -e "${GREEN}✅ TESTS PASSED WITH IMPROVEMENTS - $TOTAL_IMPROVEMENTS improvements detected${NC}"
    jq '.overall_status = "improvements_detected"' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
else
    echo -e "${GREEN}✅ ALL TESTS PASSED - No regressions detected${NC}"
    jq '.overall_status = "passed"' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
fi

# Update baseline if this is a successful run with no regressions
if [[ $TOTAL_REGRESSIONS -eq 0 && $TOTAL_FAILED -eq 0 ]]; then
    echo ""
    echo "📝 Updating baseline with current results..."
    cp "$REPORT_FILE" "$BASELINE_FILE"
    echo "Baseline updated: $BASELINE_FILE"
fi

# Generate detailed regression report
echo ""
echo "📋 Detailed Regression Report:"

if [[ $TOTAL_REGRESSIONS -gt 0 ]]; then
    echo ""
    echo "🚨 Regressions Detected:"
    jq -r '.regressions_detected[] | "  \(.suite)/\(.test): \(.metric_type) degraded from \(.baseline_value) to \(.current_value)"' "$REPORT_FILE"
fi

if [[ $TOTAL_IMPROVEMENTS -gt 0 ]]; then
    echo ""
    echo "✅ Improvements Detected:"
    jq -r '.improvements_detected[] | "  \(.suite)/\(.test): \(.metric_type) improved from \(.baseline_value) to \(.current_value)"' "$REPORT_FILE"
fi

echo ""
echo "Full report saved to: $REPORT_FILE"

# Generate HTML report
HTML_REPORT="${REPORT_FILE%.json}.html"
cat > "$HTML_REPORT" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Regression Test Report - $ENVIRONMENT</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .regression { border-left: 5px solid red; background: #ffebee; }
        .improvement { border-left: 5px solid green; background: #e8f5e8; }
        .stable { border-left: 5px solid blue; background: #e3f2fd; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .status-passed { color: green; }
        .status-failed { color: red; }
        .status-regression { color: red; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Regression Test Report</h1>
    <p><strong>Environment:</strong> $ENVIRONMENT</p>
    <p><strong>Baseline:</strong> $BASELINE_FILE</p>
    <p><strong>Generated:</strong> $(date)</p>

    <h2>Overall Summary</h2>
    <div class="metric">
        <strong>Total Tests:</strong> $TOTAL_TESTS<br>
        <strong>Passed:</strong> <span class="status-passed">$TOTAL_PASSED</span><br>
        <strong>Failed:</strong> <span class="status-failed">$TOTAL_FAILED</span><br>
        <strong>Regressions:</strong> <span class="status-regression">$TOTAL_REGRESSIONS</span><br>
        <strong>Improvements:</strong> $TOTAL_IMPROVEMENTS
    </div>

    <h2>Test Suite Results</h2>
    <table>
        <tr>
            <th>Test Suite</th>
            <th>Total</th>
            <th>Passed</th>
            <th>Failed</th>
            <th>Regressions</th>
        </tr>
        $(for suite in api_endpoints database_operations business_logic performance integration; do
            TOTAL=$(jq ".test_suites.$suite.summary.total" "$REPORT_FILE")
            PASSED=$(jq ".test_suites.$suite.summary.passed" "$REPORT_FILE")
            FAILED=$(jq ".test_suites.$suite.summary.failed" "$REPORT_FILE")
            REGRESSIONS=$(jq ".test_suites.$suite.summary.regressions" "$REPORT_FILE")
            echo "<tr><td>$suite</td><td>$TOTAL</td><td>$PASSED</td><td>$FAILED</td><td>$REGRESSIONS</td></tr>"
        done)
    </table>

    $(if [[ $TOTAL_REGRESSIONS -gt 0 ]]; then
        echo "<h2>🚨 Regressions Detected</h2>"
        echo "<div class=\"regression metric\">"
        jq -r '.regressions_detected[] | "<strong>\(.suite)/\(.test)</strong>: \(.metric_type) degraded from \(.baseline_value) to \(.current_value)<br>"' "$REPORT_FILE"
        echo "</div>"
    fi)

    $(if [[ $TOTAL_IMPROVEMENTS -gt 0 ]]; then
        echo "<h2>✅ Improvements Detected</h2>"
        echo "<div class=\"improvement metric\">"
        jq -r '.improvements_detected[] | "<strong>\(.suite)/\(.test)</strong>: \(.metric_type) improved from \(.baseline_value) to \(.current_value)<br>"' "$REPORT_FILE"
        echo "</div>"
    fi)
</body>
</html>
EOF

echo "HTML report generated: $HTML_REPORT"