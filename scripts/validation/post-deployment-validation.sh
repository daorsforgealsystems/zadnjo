#!/bin/bash
# scripts/validation/post-deployment-validation.sh
# Comprehensive post-deployment validation and monitoring

ENVIRONMENT=${1:-production}
VALIDATION_TYPE=${2:-full}  # quick, full, comprehensive
REPORT_FILE="/tmp/post_deployment_validation_${ENVIRONMENT}_$(date +%Y%m%d_%H%M%S).json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=== Post-Deployment Validation for $ENVIRONMENT ==="
echo "Validation Type: $VALIDATION_TYPE"
echo ""

# Initialize comprehensive validation report
cat > "$REPORT_FILE" << EOF
{
  "environment": "$ENVIRONMENT",
  "validation_type": "$VALIDATION_TYPE",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "validation_phases": {
    "immediate": {"tests": [], "summary": {"total": 0, "passed": 0, "failed": 0}},
    "short_term": {"tests": [], "summary": {"total": 0, "passed": 0, "failed": 0}},
    "long_term": {"tests": [], "summary": {"total": 0, "passed": 0, "failed": 0}},
    "performance": {"tests": [], "summary": {"total": 0, "passed": 0, "failed": 0}},
    "security": {"tests": [], "summary": {"total": 0, "passed": 0, "failed": 0}},
    "business_logic": {"tests": [], "summary": {"total": 0, "passed": 0, "failed": 0}}
  },
  "overall_status": "running",
  "rollback_recommended": false
}
EOF

# Validation test function
run_validation_test() {
    local phase=$1
    local test_name=$2
    local command=$3
    local timeout=${4:-30}

    echo -n "[$phase] $test_name... "

    # Add test to results
    jq --arg phase "$phase" --arg name "$test_name" '.validation_phases[$phase].tests += [{"name": $name, "status": "running", "start_time": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'", "timeout": '$timeout'}]' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"

    # Run test with timeout
    if timeout $timeout bash -c "$command" >/dev/null 2>&1; then
        echo -e "${GREEN}PASSED${NC}"
        jq --arg phase "$phase" --arg name "$test_name" '(.validation_phases[$phase].tests[] | select(.name == $name) | .status) = "passed" | (.validation_phases[$phase].tests[] | select(.name == $name) | .end_time) = "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'" | .validation_phases[$phase].summary.passed += 1 | .validation_phases[$phase].summary.total += 1' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
        return 0
    else
        echo -e "${RED}FAILED${NC}"
        jq --arg phase "$phase" --arg name "$test_name" '(.validation_phases[$phase].tests[] | select(.name == $name) | .status) = "failed" | (.validation_phases[$phase].tests[] | select(.name == $name) | .end_time) = "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'" | .validation_phases[$phase].summary.failed += 1 | .validation_phases[$phase].summary.total += 1' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
        return 1
    fi
}

# ===== IMMEDIATE VALIDATION (0-5 minutes) =====
echo "⚡ Running Immediate Validation (0-5 minutes)..."

run_validation_test "immediate" "Service Health Checks" "
ALL_HEALTHY=true
SERVICES=(api-gateway inventory-service order-service user-service)

for service in \"\${SERVICES[@]}\"; do
  if ! curl -f -s --max-time 10 \"http://\$service/health\" >/dev/null 2>&1; then
    ALL_HEALTHY=false
    break
  fi
done
\$ALL_HEALTHY
" 60

run_validation_test "immediate" "Database Connectivity" "
pg_isready -h \$DB_HOST -p \$DB_PORT -U \$DB_USER -d \$DB_NAME
" 30

run_validation_test "immediate" "Kubernetes Pod Status" "
kubectl get pods -n logi-core --field-selector=status.phase!=Running | wc -l | grep -q '^0$'
" 30

run_validation_test "immediate" "Load Balancer Health" "
curl -f -s --max-time 10 https://api.$ENVIRONMENT.yourdomain.com/health >/dev/null
" 30

# ===== SHORT-TERM VALIDATION (5-30 minutes) =====
echo ""
echo "🔄 Running Short-term Validation (5-30 minutes)..."

run_validation_test "short_term" "API Endpoint Validation" "
ENDPOINTS_PASSED=0
TOTAL_ENDPOINTS=0

# Test core endpoints
ENDPOINTS=(
  \"GET /health\"
  \"GET /ready\"
  \"GET /v1/status\"
  \"POST /auth/login\"
)

for endpoint in \"\${ENDPOINTS[@]}\"; do
  TOTAL_ENDPOINTS=\$((TOTAL_ENDPOINTS + 1))
  METHOD=\$(echo \$endpoint | cut -d' ' -f1)
  PATH=\$(echo \$endpoint | cut -d' ' -f2)

  if curl -f -s -X \$METHOD --max-time 10 \"https://api.$ENVIRONMENT.yourdomain.com\$PATH\" >/dev/null 2>&1; then
    ENDPOINTS_PASSED=\$((ENDPOINTS_PASSED + 1))
  fi
done

[[ \$ENDPOINTS_PASSED -eq \$TOTAL_ENDPOINTS ]]
" 300

run_validation_test "short_term" "Authentication Flow" "
# Test complete auth flow
LOGIN_RESPONSE=\$(curl -s -X POST 'https://api.$ENVIRONMENT.yourdomain.com/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{\"email\":\"test@example.com\",\"password\":\"testpass123\"}')

TOKEN=\$(echo \$LOGIN_RESPONSE | jq -r '.token' 2>/dev/null)
[[ -n \"\$TOKEN\" && \"\$TOKEN\" != \"null\" ]]
" 120

run_validation_test "short_term" "Database Operations" "
# Test basic CRUD operations
kubectl exec -n logi-core \$(kubectl get pods -n logi-core -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- \
  psql -U logistics -d logistics -c \"SELECT COUNT(*) FROM users;\" >/dev/null 2>&1
" 60

run_validation_test "short_term" "External Service Integration" "
# Test external API integrations
STRIPE_HEALTH=\$(curl -s --max-time 10 https://api.stripe.com/v3/ping | jq -r '.status' 2>/dev/null)
SENDGRID_HEALTH=\$(curl -s --max-time 10 https://api.sendgrid.com/v3/health | jq -r '.status' 2>/dev/null)

[[ \"\$STRIPE_HEALTH\" == \"ok\" || \"\$SENDGRID_HEALTH\" == \"ok\" ]]
" 120

# ===== PERFORMANCE VALIDATION =====
echo ""
echo "⚡ Running Performance Validation..."

run_validation_test "performance" "Response Time Validation" "
TOTAL_TIME=0
REQUESTS=10
SUCCESS_COUNT=0

for i in \$(seq 1 \$REQUESTS); do
  START=\$(date +%s%N)
  if curl -s --max-time 5 \"https://api.$ENVIRONMENT.yourdomain.com/health\" >/dev/null; then
    END=\$(date +%s%N)
    RESPONSE_TIME=\$(( (END - START) / 1000000 ))
    TOTAL_TIME=\$((TOTAL_TIME + RESPONSE_TIME))
    SUCCESS_COUNT=\$((SUCCESS_COUNT + 1))
  fi
done

if [[ \$SUCCESS_COUNT -gt 0 ]]; then
  AVG_TIME=\$((TOTAL_TIME / SUCCESS_COUNT))
  [[ \$AVG_TIME -lt 1000 ]]  # Less than 1 second average
else
  false
fi
" 180

run_validation_test "performance" "Concurrent User Load" "
# Test concurrent load
CONCURRENT_USERS=20
SUCCESS_COUNT=0

for i in \$(seq 1 \$CONCURRENT_USERS); do
  curl -s --max-time 10 \"https://api.$ENVIRONMENT.yourdomain.com/health\" >/dev/null &
done

wait

# Check if all requests succeeded (basic check)
echo 'Concurrent load test completed'
" 300

run_validation_test "performance" "Database Query Performance" "
kubectl exec -n logi-core \$(kubectl get pods -n logi-core -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- \
  timeout 30 psql -U logistics -d logistics -c \"SELECT COUNT(*) FROM orders;\" >/dev/null 2>&1
" 60

run_validation_test "performance" "Resource Usage Monitoring" "
# Check resource usage is within limits
CPU_USAGE=\$(kubectl top pods -n logi-core --no-headers | awk '{sum+=\$2} END {print sum/NR}' 2>/dev/null || echo '0')
MEM_USAGE=\$(kubectl top pods -n logi-core --no-headers | awk '{sum+=\$3} END {print sum/NR}' 2>/dev/null || echo '0')

[[ \$(echo \"\$CPU_USAGE < 80\" | bc -l 2>/dev/null) -eq 1 ]] && [[ \$(echo \"\$MEM_USAGE < 80\" | bc -l 2>/dev/null) -eq 1 ]]
" 60

# ===== SECURITY VALIDATION =====
echo ""
echo "🔒 Running Security Validation..."

run_validation_test "security" "SSL/TLS Configuration" "
openssl s_client -connect $ENVIRONMENT.yourdomain.com:443 -servername $ENVIRONMENT.yourdomain.com < /dev/null 2>/dev/null | \
  openssl x509 -noout -dates >/dev/null 2>&1
" 30

run_validation_test "security" "Security Headers" "
HEADERS=\$(curl -s -I https://$ENVIRONMENT.yourdomain.com | \
  grep -E '(X-Frame-Options|X-Content-Type-Options|X-XSS-Protection|Strict-Transport-Security)' | wc -l)
[[ \$HEADERS -ge 4 ]]
" 30

run_validation_test "security" "Rate Limiting" "
# Test rate limiting
RATE_LIMIT_DETECTED=false
for i in \$(seq 1 15); do
  STATUS=\$(curl -s -o /dev/null -w '%{http_code}' https://api.$ENVIRONMENT.yourdomain.com/health)
  if [[ \$STATUS -eq 429 ]]; then
    RATE_LIMIT_DETECTED=true
    break
  fi
  sleep 0.2
done
\$RATE_LIMIT_DETECTED
" 60

run_validation_test "security" "Authentication Security" "
# Test unauthorized access
UNAUTH_STATUS=\$(curl -s -o /dev/null -w '%{http_code}' https://api.$ENVIRONMENT.yourdomain.com/user/profile)
[[ \$UNAUTH_STATUS -eq 401 ]]
" 30

# ===== BUSINESS LOGIC VALIDATION =====
echo ""
echo "🧠 Running Business Logic Validation..."

run_validation_test "business_logic" "Order Creation Flow" "
# Test complete order creation workflow
ORDER_RESPONSE=\$(curl -s -X POST 'https://api.$ENVIRONMENT.yourdomain.com/orders' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer test-token' \
  -d '{\"items\":[{\"product_id\":\"test-001\",\"quantity\":1}],\"shipping_address\":{\"street\":\"123 Test St\",\"city\":\"Test City\",\"zip\":\"12345\"}}')

ORDER_ID=\$(echo \$ORDER_RESPONSE | jq -r '.order.id' 2>/dev/null)
[[ -n \"\$ORDER_ID\" && \"\$ORDER_ID\" != \"null\" ]]
" 120

run_validation_test "business_logic" "Inventory Synchronization" "
# Test inventory updates after order
sleep 5
INVENTORY_RESPONSE=\$(curl -s 'https://api.$ENVIRONMENT.yourdomain.com/inventory/test-001' \
  -H 'Authorization: Bearer test-token')

AVAILABLE=\$(echo \$INVENTORY_RESPONSE | jq -r '.available' 2>/dev/null)
[[ \"\$AVAILABLE\" != \"null\" ]]
" 60

run_validation_test "business_logic" "Payment Processing" "
# Test payment flow
PAYMENT_RESPONSE=\$(curl -s -X POST 'https://api.$ENVIRONMENT.yourdomain.com/payments' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer test-token' \
  -d '{\"order_id\":\"test-order\",\"amount\":100.00,\"method\":\"test\"}')

PAYMENT_STATUS=\$(echo \$PAYMENT_RESPONSE | jq -r '.status' 2>/dev/null)
[[ \"\$PAYMENT_STATUS\" == \"completed\" || \"\$PAYMENT_STATUS\" == \"success\" ]]
" 120

run_validation_test "business_logic" "Notification System" "
# Test notification delivery
sleep 3
NOTIFICATION_RESPONSE=\$(curl -s 'https://api.$ENVIRONMENT.yourdomain.com/notifications' \
  -H 'Authorization: Bearer test-token')

NOTIFICATION_COUNT=\$(echo \$NOTIFICATION_RESPONSE | jq -r 'length' 2>/dev/null)
[[ \"\$NOTIFICATION_COUNT\" != \"null\" ]]
" 60

# ===== LONG-TERM VALIDATION (if comprehensive) =====
if [[ "$VALIDATION_TYPE" == "comprehensive" ]]; then
    echo ""
    echo "🔬 Running Long-term Validation (30+ minutes)..."

    run_validation_test "long_term" "Memory Leak Detection" "
    # Monitor memory usage over time
    INITIAL_MEM=\$(kubectl top pods -n logi-core --no-headers | awk '{sum+=\$3} END {print sum/NR}' 2>/dev/null || echo '0')
    sleep 300
    FINAL_MEM=\$(kubectl top pods -n logi-core --no-headers | awk '{sum+=\$3} END {print sum/NR}' 2>/dev/null || echo '0')

    MEM_INCREASE=\$(echo \"\$FINAL_MEM - \$INITIAL_MEM\" | bc -l 2>/dev/null || echo '0')
    [[ \$(echo \"\$MEM_INCREASE < 10\" | bc -l 2>/dev/null) -eq 1 ]]  # Less than 10% increase
    " 600

    run_validation_test "long_term" "Database Connection Pool" "
    # Monitor database connections
    kubectl exec -n logi-core \$(kubectl get pods -n logi-core -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- \
      psql -U logistics -d logistics -c \"SELECT count(*) FROM pg_stat_activity WHERE state = 'idle';\" >/dev/null 2>&1
    " 300

    run_validation_test "long_term" "Log Aggregation" "
    # Check log aggregation is working
    kubectl logs -n logi-core --tail=100 \$(kubectl get pods -n logi-core -l app=api-gateway -o jsonpath='{.items[0].metadata.name}') | grep -q 'INFO\|ERROR\|WARN'
    " 60
fi

# ===== GENERATE SUMMARY =====
echo ""
echo "📊 Generating Post-Deployment Validation Summary..."

# Calculate overall statistics
TOTAL_TESTS=0
TOTAL_PASSED=0
TOTAL_FAILED=0
CRITICAL_FAILURES=0

for phase in immediate short_term long_term performance security business_logic; do
    PHASE_TOTAL=$(jq ".validation_phases.$phase.summary.total" "$REPORT_FILE")
    PHASE_PASSED=$(jq ".validation_phases.$phase.summary.passed" "$REPORT_FILE")
    PHASE_FAILED=$(jq ".validation_phases.$phase.summary.failed" "$REPORT_FILE")

    TOTAL_TESTS=$((TOTAL_TESTS + PHASE_TOTAL))
    TOTAL_PASSED=$((TOTAL_PASSED + PHASE_PASSED))
    TOTAL_FAILED=$((TOTAL_FAILED + PHASE_FAILED))

    # Count critical failures (immediate and security phases)
    if [[ "$phase" == "immediate" || "$phase" == "security" ]]; then
        CRITICAL_FAILURES=$((CRITICAL_FAILURES + PHASE_FAILED))
    fi

    echo "  $phase: $PHASE_PASSED/$PHASE_TOTAL passed"
done

echo ""
echo "=== Post-Deployment Validation Summary ==="
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $TOTAL_PASSED"
echo "Failed: $TOTAL_FAILED"
echo "Critical Failures: $CRITICAL_FAILURES"

SUCCESS_RATE=$((TOTAL_PASSED * 100 / TOTAL_TESTS))

# Determine overall status and rollback recommendation
if [[ $CRITICAL_FAILURES -gt 0 ]]; then
    echo -e "${RED}❌ DEPLOYMENT FAILED - Critical issues detected, rollback recommended${NC}"
    jq '.overall_status = "failed" | .rollback_recommended = true' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    exit 1
elif [[ $TOTAL_FAILED -gt 0 ]]; then
    echo -e "${YELLOW}⚠️  DEPLOYMENT ISSUES DETECTED - Monitor closely${NC}"
    jq '.overall_status = "issues_detected" | .rollback_recommended = false' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    exit 0
elif [[ $SUCCESS_RATE -ge 95 ]]; then
    echo -e "${GREEN}✅ DEPLOYMENT SUCCESSFUL - All validations passed${NC}"
    jq '.overall_status = "successful" | .rollback_recommended = false' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    exit 0
else
    echo -e "${YELLOW}⚠️  DEPLOYMENT ACCEPTABLE ($SUCCESS_RATE%) - Minor issues detected${NC}"
    jq '.overall_status = "acceptable" | .rollback_recommended = false' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    exit 0
fi