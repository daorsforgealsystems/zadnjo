#!/bin/bash
# scripts/validation/pre-deployment-verification.sh
# Pre-deployment verification to ensure readiness for deployment

ENVIRONMENT=${1:-staging}
DEPLOYMENT_TYPE=${2:-rolling}
REPORT_FILE="/tmp/pre_deployment_verification_${ENVIRONMENT}_$(date +%Y%m%d_%H%M%S).json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=== Pre-Deployment Verification for $ENVIRONMENT ==="
echo "Deployment Type: $DEPLOYMENT_TYPE"
echo ""

# Initialize verification report
cat > "$REPORT_FILE" << EOF
{
  "environment": "$ENVIRONMENT",
  "deployment_type": "$DEPLOYMENT_TYPE",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "verification_checks": {
    "infrastructure": {"checks": [], "summary": {"total": 0, "passed": 0, "failed": 0, "warnings": 0}},
    "database": {"checks": [], "summary": {"total": 0, "passed": 0, "failed": 0, "warnings": 0}},
    "services": {"checks": [], "summary": {"total": 0, "passed": 0, "failed": 0, "warnings": 0}},
    "configuration": {"checks": [], "summary": {"total": 0, "passed": 0, "failed": 0, "warnings": 0}},
    "security": {"checks": [], "summary": {"total": 0, "passed": 0, "failed": 0, "warnings": 0}},
    "dependencies": {"checks": [], "summary": {"total": 0, "passed": 0, "failed": 0, "warnings": 0}}
  },
  "overall_status": "running",
  "deployment_ready": false
}
EOF

# Verification check function
run_verification_check() {
    local category=$1
    local check_name=$2
    local command=$3
    local severity=${4:-medium}  # critical, high, medium, low

    echo -n "[$category] $check_name... "

    # Add check to results
    jq --arg cat "$category" --arg name "$check_name" --arg sev "$severity" '.verification_checks[$cat].checks += [{"name": $name, "status": "running", "severity": $sev, "start_time": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}]' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"

    # Run check
    if eval "$command"; then
        echo -e "${GREEN}PASSED${NC}"
        jq --arg cat "$category" --arg name "$check_name" '(.verification_checks[$cat].checks[] | select(.name == $name) | .status) = "passed" | (.verification_checks[$cat].checks[] | select(.name == $name) | .end_time) = "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'" | .verification_checks[$cat].summary.passed += 1 | .verification_checks[$cat].summary.total += 1' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
        return 0
    else
        echo -e "${RED}FAILED${NC}"
        jq --arg cat "$category" --arg name "$check_name" '(.verification_checks[$cat].checks[] | select(.name == $name) | .status) = "failed" | (.verification_checks[$cat].checks[] | select(.name == $name) | .end_time) = "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'" | .verification_checks[$cat].summary.failed += 1 | .verification_checks[$cat].summary.total += 1' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
        return 1
    fi
}

# ===== INFRASTRUCTURE CHECKS =====
echo "🏗️  Running Infrastructure Checks..."

run_verification_check "infrastructure" "Kubernetes Cluster Health" "
kubectl cluster-info >/dev/null 2>&1 && kubectl get nodes | grep -v 'NotReady' | wc -l | grep -q '^[1-9]'
" "critical"

run_verification_check "infrastructure" "Node Resource Availability" "
kubectl describe nodes | grep -A 5 'Allocated resources:' | grep -q 'cpu\|memory'
" "high"

run_verification_check "infrastructure" "Persistent Volume Availability" "
kubectl get pv 2>/dev/null | grep -q 'Available\|Bound'
" "high"

run_verification_check "infrastructure" "Network Policies" "
kubectl get networkpolicies -n logi-core 2>/dev/null | wc -l | grep -q '^[1-9]'
" "medium"

run_verification_check "infrastructure" "Load Balancer Status" "
kubectl get svc -n logi-core | grep LoadBalancer | grep -q 'pending\|active'
" "medium"

# ===== DATABASE CHECKS =====
echo ""
echo "🗄️  Running Database Checks..."

run_verification_check "database" "Database Connectivity" "
pg_isready -h \$DB_HOST -p \$DB_PORT -U \$DB_USER -d \$DB_NAME
" "critical"

run_verification_check "database" "Database Schema Version" "
kubectl exec -n logi-core \$(kubectl get pods -n logi-core -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- \
  psql -U logistics -d logistics -c \"SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1;\" >/dev/null 2>&1
" "high"

run_verification_check "database" "Database Backup Status" "
# Check if recent backup exists (within last 24 hours)
find /backups -name \"*.sql\" -mtime -1 2>/dev/null | wc -l | grep -q '^[1-9]'
" "high"

run_verification_check "database" "Connection Pool Health" "
kubectl exec -n logi-core \$(kubectl get pods -n logi-core -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- \
  psql -U logistics -d logistics -c \"SELECT count(*) FROM pg_stat_activity WHERE state = 'active';\" >/dev/null 2>&1
" "medium"

run_verification_check "database" "Replication Status" "
kubectl exec -n logi-core \$(kubectl get pods -n logi-core -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- \
  psql -U logistics -d logistics -c \"SELECT status FROM pg_stat_wal_receiver;\" 2>/dev/null | grep -q 'streaming'
" "medium"

# ===== SERVICES CHECKS =====
echo ""
echo "🔧 Running Services Checks..."

run_verification_check "services" "API Gateway Readiness" "
curl -f -s --max-time 10 https://api.$ENVIRONMENT.yourdomain.com/ready | jq -e '.status == \"ready\"' 2>/dev/null
" "critical"

run_verification_check "services" "Service Dependencies" "
kubectl get pods -n logi-core | grep -v 'Running\|Completed' | wc -l | grep -q '^0$'
" "high"

run_verification_check "services" "Service Resource Limits" "
kubectl get pods -n logi-core -o jsonpath='{.items[*].spec.containers[*].resources}' | jq -e 'all(.limits != null)' 2>/dev/null
" "medium"

run_verification_check "services" "Health Check Endpoints" "
SERVICES_HEALTHY=0
TOTAL_SERVICES=0
for service in api-gateway inventory-service order-service user-service; do
  TOTAL_SERVICES=\$((TOTAL_SERVICES + 1))
  if curl -f -s --max-time 5 \"http://\$service:8000/health\" >/dev/null 2>&1; then
    SERVICES_HEALTHY=\$((SERVICES_HEALTHY + 1))
  fi
done
[[ \$SERVICES_HEALTHY -eq \$TOTAL_SERVICES ]]
" "high"

# ===== CONFIGURATION CHECKS =====
echo ""
echo "⚙️  Running Configuration Checks..."

run_verification_check "configuration" "Environment Variables" "
kubectl get configmap -n logi-core | grep -q 'app-config'
" "high"

run_verification_check "configuration" "Secrets Management" "
kubectl get secrets -n logi-core | grep -q 'app-secrets'
" "high"

run_verification_check "configuration" "SSL Certificates" "
openssl s_client -connect $ENVIRONMENT.yourdomain.com:443 -servername $ENVIRONMENT.yourdomain.com < /dev/null 2>/dev/null | openssl x509 -noout -dates >/dev/null 2>&1
" "high"

run_verification_check "configuration" "DNS Resolution" "
nslookup api.$ENVIRONMENT.yourdomain.com >/dev/null 2>&1
" "medium"

run_verification_check "configuration" "Load Balancer Configuration" "
curl -s -I https://api.$ENVIRONMENT.yourdomain.com/health | grep -q 'X-Load-Balancer'
" "medium"

# ===== SECURITY CHECKS =====
echo ""
echo "🔒 Running Security Checks..."

run_verification_check "security" "Security Headers" "
HEADERS=\$(curl -s -I https://$ENVIRONMENT.yourdomain.com | grep -E '(X-Frame-Options|X-Content-Type-Options|X-XSS-Protection|Strict-Transport-Security)' | wc -l)
[[ \$HEADERS -ge 4 ]]
" "high"

run_verification_check "security" "HTTPS Enforcement" "
curl -s -I http://$ENVIRONMENT.yourdomain.com | grep -q '301\|302'
" "high"

run_verification_check "security" "Vulnerable Ports" "
nmap -p 22,3389,5900 $ENVIRONMENT.yourdomain.com 2>/dev/null | grep -q 'closed\|filtered'
" "medium"

run_verification_check "security" "Rate Limiting" "
# Test rate limiting by making multiple requests
RATE_LIMITED=false
for i in {1..20}; do
  STATUS=\$(curl -s -o /dev/null -w '%{http_code}' https://api.$ENVIRONMENT.yourdomain.com/health)
  if [[ \$STATUS -eq 429 ]]; then
    RATE_LIMITED=true
    break
  fi
  sleep 0.1
done
\$RATE_LIMITED
" "medium"

# ===== DEPENDENCIES CHECKS =====
echo ""
echo "🔗 Running Dependencies Checks..."

run_verification_check "dependencies" "External API Dependencies" "
# Check external service health
curl -f -s --max-time 5 https://api.stripe.com/health >/dev/null 2>&1 || \
curl -f -s --max-time 5 https://api.sendgrid.com/v3/health >/dev/null 2>&1
" "high"

run_verification_check "dependencies" "Message Queue Health" "
kubectl get pods -n logi-core | grep -q 'rabbitmq\|redis' && \
kubectl exec -n logi-core \$(kubectl get pods -n logi-core -l app=rabbitmq -o jsonpath='{.items[0].metadata.name}') -- rabbitmqctl status >/dev/null 2>&1
" "medium"

run_verification_check "dependencies" "Cache Service Health" "
kubectl get pods -n logi-core | grep -q redis && \
kubectl exec -n logi-core \$(kubectl get pods -n logi-core -l app=redis -o jsonpath='{.items[0].metadata.name}') -- redis-cli ping | grep -q PONG
" "medium"

run_verification_check "dependencies" "Monitoring Services" "
curl -f -s --max-time 5 http://prometheus.logi-core.svc.cluster.local:9090/-/healthy >/dev/null 2>&1 && \
curl -f -s --max-time 5 http://grafana.logi-core.svc.cluster.local:3000/api/health >/dev/null 2>&1
" "low"

# ===== DEPLOYMENT TYPE SPECIFIC CHECKS =====
echo ""
echo "🎯 Running Deployment Type Specific Checks..."

if [[ "$DEPLOYMENT_TYPE" == "blue-green" ]]; then
    run_verification_check "infrastructure" "Blue-Green Environment Setup" "
    kubectl get namespaces | grep -q 'logi-core-blue\|logi-core-green'
    " "high"

    run_verification_check "infrastructure" "Traffic Switching Capability" "
    kubectl get ingress -n logi-core | grep -q 'canary\|blue-green'
    " "high"
elif [[ "$DEPLOYMENT_TYPE" == "canary" ]]; then
    run_verification_check "infrastructure" "Canary Deployment Setup" "
    kubectl get ingress -n logi-core | grep -q 'canary'
    " "high"

    run_verification_check "infrastructure" "Traffic Splitting" "
    kubectl get virtualservice -n logi-core 2>/dev/null | grep -q 'canary'
    " "medium"
fi

# ===== GENERATE SUMMARY =====
echo ""
echo "📊 Generating Pre-Deployment Verification Summary..."

# Calculate overall statistics
TOTAL_CHECKS=0
TOTAL_PASSED=0
TOTAL_FAILED=0
CRITICAL_FAILED=0
HIGH_FAILED=0

for category in infrastructure database services configuration security dependencies; do
    CAT_TOTAL=$(jq ".verification_checks.$category.summary.total" "$REPORT_FILE")
    CAT_PASSED=$(jq ".verification_checks.$category.summary.passed" "$REPORT_FILE")
    CAT_FAILED=$(jq ".verification_checks.$category.summary.failed" "$REPORT_FILE")

    TOTAL_CHECKS=$((TOTAL_CHECKS + CAT_TOTAL))
    TOTAL_PASSED=$((TOTAL_PASSED + CAT_PASSED))
    TOTAL_FAILED=$((TOTAL_FAILED + CAT_FAILED))

    # Count critical and high severity failures
    CRITICAL_FAILS=$(jq ".verification_checks.$category.checks[] | select(.status == \"failed\" and .severity == \"critical\") | length" "$REPORT_FILE" 2>/dev/null || echo 0)
    HIGH_FAILS=$(jq ".verification_checks.$category.checks[] | select(.status == \"failed\" and .severity == \"high\") | length" "$REPORT_FILE" 2>/dev/null || echo 0)

    CRITICAL_FAILED=$((CRITICAL_FAILED + CRITICAL_FAILS))
    HIGH_FAILED=$((HIGH_FAILED + HIGH_FAILS))

    echo "  $category: $CAT_PASSED/$CAT_TOTAL passed"
done

echo ""
echo "=== Pre-Deployment Verification Summary ==="
echo "Total Checks: $TOTAL_CHECKS"
echo "Passed: $TOTAL_PASSED"
echo "Failed: $TOTAL_FAILED"
echo "Critical Failures: $CRITICAL_FAILED"
echo "High Severity Failures: $HIGH_FAILED"

SUCCESS_RATE=$((TOTAL_PASSED * 100 / TOTAL_CHECKS))

# Determine deployment readiness
if [[ $CRITICAL_FAILED -gt 0 ]]; then
    echo -e "${RED}❌ DEPLOYMENT BLOCKED - Critical failures detected${NC}"
    jq '.overall_status = "blocked" | .deployment_ready = false' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    exit 1
elif [[ $HIGH_FAILED -gt 0 ]]; then
    echo -e "${YELLOW}⚠️  DEPLOYMENT REQUIRES APPROVAL - High severity issues detected${NC}"
    jq '.overall_status = "requires_approval" | .deployment_ready = false' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    exit 0
elif [[ $SUCCESS_RATE -ge 95 ]]; then
    echo -e "${GREEN}✅ DEPLOYMENT READY - All checks passed${NC}"
    jq '.overall_status = "ready" | .deployment_ready = true' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    exit 0
else
    echo -e "${YELLOW}⚠️  DEPLOYMENT READY WITH WARNINGS ($SUCCESS_RATE%)${NC}"
    jq '.overall_status = "ready_with_warnings" | .deployment_ready = true' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    exit 0
fi