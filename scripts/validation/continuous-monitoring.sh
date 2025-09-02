#!/bin/bash
# scripts/validation/continuous-monitoring.sh
# Continuous monitoring and alerting for deployed applications

ENVIRONMENT=${1:-production}
MONITORING_INTERVAL=${2:-300}  # 5 minutes default
ALERT_WEBHOOK=${3:-""}
REPORT_DIR="/tmp/monitoring_reports_${ENVIRONMENT}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=== Continuous Monitoring for $ENVIRONMENT ==="
echo "Monitoring Interval: ${MONITORING_INTERVAL}s"
echo "Report Directory: $REPORT_DIR"
echo ""

# Create report directory
mkdir -p "$REPORT_DIR"

# Initialize monitoring state
MONITORING_STATE_FILE="/tmp/monitoring_state_${ENVIRONMENT}.json"
cat > "$MONITORING_STATE_FILE" << EOF
{
  "environment": "$ENVIRONMENT",
  "start_time": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "last_check": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "alerts_sent": 0,
  "checks": {
    "api_health": {"status": "unknown", "last_success": null, "failures": 0},
    "database": {"status": "unknown", "last_success": null, "failures": 0},
    "services": {"status": "unknown", "last_success": null, "failures": 0},
    "performance": {"status": "unknown", "last_success": null, "failures": 0},
    "security": {"status": "unknown", "last_success": null, "failures": 0},
    "resources": {"status": "unknown", "last_success": null, "failures": 0}
  }
}
EOF

# Alert function
send_alert() {
    local alert_type=$1
    local message=$2
    local severity=${3:-warning}

    if [[ -n "$ALERT_WEBHOOK" ]]; then
        curl -X POST -H 'Content-type: application/json' \
             --data "{\"text\":\"🚨 [$severity] $ENVIRONMENT: $alert_type\",\"blocks\":[{\"type\":\"section\",\"text\":{\"type\":\"mrkdwn\",\"text\":\"*$alert_type*\n$message\"}}]}" \
             "$ALERT_WEBHOOK" >/dev/null 2>&1
    fi

    # Update alert count
    ALERTS_SENT=$(jq '.alerts_sent' "$MONITORING_STATE_FILE")
    jq --arg alerts "$((ALERTS_SENT + 1))" '.alerts_sent = ($alerts | tonumber)' "$MONITORING_STATE_FILE" > "${MONITORING_STATE_FILE}.tmp" && mv "${MONITORING_STATE_FILE}.tmp" "$MONITORING_STATE_FILE"

    echo -e "${RED}🚨 ALERT: $alert_type - $message${NC}"
}

# Health check function
perform_health_check() {
    local check_name=$1
    local command=$2
    local timeout=${3:-30}

    local start_time=$(date +%s)
    local report_file="$REPORT_DIR/${check_name}_$(date +%Y%m%d_%H%M%S).json"

    echo -n "Checking $check_name... "

    # Initialize check result
    cat > "$report_file" << EOF
{
  "check_name": "$check_name",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "running",
  "duration": 0,
  "details": {}
}
EOF

    # Run check with timeout
    if timeout $timeout bash -c "$command" > /tmp/check_output 2>&1; then
        local status="passed"
        local exit_code=0
    else
        local status="failed"
        local exit_code=$?
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    # Update check result
    jq --arg status "$status" --arg duration "$duration" --arg output "$(cat /tmp/check_output)" \
       '.status = $status | .duration = ($duration | tonumber) | .details.output = $output' \
       "$report_file" > "${report_file}.tmp" && mv "${report_file}.tmp" "$report_file"

    # Update monitoring state
    if [[ "$status" == "passed" ]]; then
        jq --arg check "$check_name" --arg time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
           '.checks[$check].status = "healthy" | .checks[$check].last_success = $time | .checks[$check].failures = 0' \
           "$MONITORING_STATE_FILE" > "${MONITORING_STATE_FILE}.tmp" && mv "${MONITORING_STATE_FILE}.tmp" "$MONITORING_STATE_FILE"
        echo -e "${GREEN}✅ PASSED${NC} (${duration}s)"
    else
        # Increment failure count
        local failures=$(jq ".checks.$check_name.failures" "$MONITORING_STATE_FILE")
        local new_failures=$((failures + 1))

        jq --arg check "$check_name" --arg failures "$new_failures" \
           '.checks[$check].status = "unhealthy" | .checks[$check].failures = ($failures | tonumber)' \
           "$MONITORING_STATE_FILE" > "${MONITORING_STATE_FILE}.tmp" && mv "${MONITORING_STATE_FILE}.tmp" "$MONITORING_STATE_FILE"

        echo -e "${RED}❌ FAILED${NC} (${duration}s)"

        # Send alert on first failure or every 5 failures
        if [[ $new_failures -eq 1 || $((new_failures % 5)) -eq 0 ]]; then
            send_alert "$check_name Health Check Failed" "Check failed $new_failures times. Last output: $(cat /tmp/check_output | head -3)" "error"
        fi
    fi

    # Cleanup
    rm -f /tmp/check_output
}

# ===== MONITORING LOOP =====
echo "Starting continuous monitoring... (Press Ctrl+C to stop)"
echo "Reports will be saved to: $REPORT_DIR"
echo ""

# Trap SIGINT for clean shutdown
trap 'echo -e "\n${BLUE}Monitoring stopped by user${NC}"; exit 0' INT

CYCLE_COUNT=0
while true; do
    CYCLE_COUNT=$((CYCLE_COUNT + 1))
    echo ""
    echo "=== Monitoring Cycle #$CYCLE_COUNT ($(date)) ==="

    # Update last check time
    jq --arg time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" '.last_check = $time' "$MONITORING_STATE_FILE" > "${MONITORING_STATE_FILE}.tmp" && mv "${MONITORING_STATE_FILE}.tmp" "$MONITORING_STATE_FILE"

    # ===== API HEALTH CHECKS =====
    perform_health_check "api_health" "
    # Check main API endpoints
    ENDPOINTS=(
        'https://api.$ENVIRONMENT.yourdomain.com/health'
        'https://api.$ENVIRONMENT.yourdomain.com/ready'
        'https://api.$ENVIRONMENT.yourdomain.com/v1/status'
    )

    FAILED_ENDPOINTS=0
    for endpoint in \"\${ENDPOINTS[@]}\"; do
        if ! curl -f -s --max-time 10 \"\$endpoint\" >/dev/null 2>&1; then
            FAILED_ENDPOINTS=\$((FAILED_ENDPOINTS + 1))
        fi
    done

    [[ \$FAILED_ENDPOINTS -eq 0 ]]
    "

    # ===== DATABASE HEALTH CHECKS =====
    perform_health_check "database" "
    # Check database connectivity and basic operations
    pg_isready -h \$DB_HOST -p \$DB_PORT -U \$DB_USER -d \$DB_NAME && \
    kubectl exec -n logi-core \$(kubectl get pods -n logi-core -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- \
      psql -U logistics -d logistics -c 'SELECT 1;' >/dev/null 2>&1
    "

    # ===== SERVICE HEALTH CHECKS =====
    perform_health_check "services" "
    # Check all microservices
    SERVICES=(api-gateway inventory-service order-service user-service)
    FAILED_SERVICES=0

    for service in \"\${SERVICES[@]}\"; do
        if ! curl -f -s --max-time 5 \"http://\$service:8000/health\" >/dev/null 2>&1; then
            FAILED_SERVICES=\$((FAILED_SERVICES + 1))
        fi
    done

    # Check Kubernetes pods
    UNHEALTHY_PODS=\$(kubectl get pods -n logi-core --field-selector=status.phase!=Running,status.phase!=Succeeded | wc -l)

    [[ \$FAILED_SERVICES -eq 0 && \$UNHEALTHY_PODS -eq 0 ]]
    "

    # ===== PERFORMANCE CHECKS =====
    perform_health_check "performance" "
    # Check response times and throughput
    TOTAL_TIME=0
    REQUESTS=5
    SUCCESS_COUNT=0

    for i in \$(seq 1 \$REQUESTS); do
        START=\$(date +%s%N)
        if curl -s --max-time 5 'https://api.$ENVIRONMENT.yourdomain.com/health' >/dev/null; then
            END=\$(date +%s%N)
            RESPONSE_TIME=\$(( (END - START) / 1000000 ))
            TOTAL_TIME=\$((TOTAL_TIME + RESPONSE_TIME))
            SUCCESS_COUNT=\$((SUCCESS_COUNT + 1))
        fi
    done

    if [[ \$SUCCESS_COUNT -gt 0 ]]; then
        AVG_TIME=\$((TOTAL_TIME / SUCCESS_COUNT))
        [[ \$AVG_TIME -lt 2000 ]]  # Less than 2 seconds average
    else
        false
    fi
    "

    # ===== SECURITY CHECKS =====
    perform_health_check "security" "
    # Check security configurations
    SECURITY_ISSUES=0

    # Check SSL certificate
    if ! openssl s_client -connect $ENVIRONMENT.yourdomain.com:443 -servername $ENVIRONMENT.yourdomain.com < /dev/null 2>/dev/null | openssl x509 -noout -checkend 86400 >/dev/null 2>&1; then
        SECURITY_ISSUES=\$((SECURITY_ISSUES + 1))
    fi

    # Check security headers
    HEADERS=\$(curl -s -I https://$ENVIRONMENT.yourdomain.com | grep -E '(X-Frame-Options|X-Content-Type-Options|X-XSS-Protection|Strict-Transport-Security)' | wc -l)
    if [[ \$HEADERS -lt 4 ]]; then
        SECURITY_ISSUES=\$((SECURITY_ISSUES + 1))
    fi

    [[ \$SECURITY_ISSUES -eq 0 ]]
    "

    # ===== RESOURCE CHECKS =====
    perform_health_check "resources" "
    # Check resource usage
    CPU_USAGE=\$(kubectl top pods -n logi-core --no-headers 2>/dev/null | awk '{sum+=\$2} END {if(NR>0) print sum/NR; else print 0}' || echo '0')
    MEM_USAGE=\$(kubectl top pods -n logi-core --no-headers 2>/dev/null | awk '{sum+=\$3} END {if(NR>0) print sum/NR; else print 0}' || echo '0')

    # Check disk usage
    DISK_USAGE=\$(df / | tail -1 | awk '{print \$5}' | sed 's/%//')

    [[ \$(echo \"\$CPU_USAGE < 85\" | bc -l 2>/dev/null) -eq 1 ]] && \
    [[ \$(echo \"\$MEM_USAGE < 85\" | bc -l 2>/dev/null) -eq 1 ]] && \
    [[ \$DISK_USAGE -lt 85 ]]
    "

    # ===== GENERATE CYCLE SUMMARY =====
    echo ""
    echo "Cycle Summary:"
    HEALTHY_CHECKS=$(jq '.checks | to_entries | map(select(.value.status == "healthy")) | length' "$MONITORING_STATE_FILE")
    TOTAL_CHECKS=$(jq '.checks | length' "$MONITORING_STATE_FILE")
    ALERTS_SENT=$(jq '.alerts_sent' "$MONITORING_STATE_FILE")

    echo "  Healthy Checks: $HEALTHY_CHECKS/$TOTAL_CHECKS"
    echo "  Alerts Sent: $ALERTS_SENT"

    # Overall health status
    if [[ $HEALTHY_CHECKS -eq $TOTAL_CHECKS ]]; then
        echo -e "${GREEN}✅ All systems healthy${NC}"
    elif [[ $HEALTHY_CHECKS -ge $((TOTAL_CHECKS * 3 / 4)) ]]; then
        echo -e "${YELLOW}⚠️  Most systems healthy${NC}"
    else
        echo -e "${RED}❌ Multiple systems unhealthy${NC}"
        send_alert "Overall Health Degraded" "$HEALTHY_CHECKS/$TOTAL_CHECKS checks are healthy" "error"
    fi

    # ===== CLEANUP OLD REPORTS =====
    # Keep only last 100 reports per check type
    for check_type in api_health database services performance security resources; do
        REPORT_COUNT=$(find "$REPORT_DIR" -name "${check_type}_*.json" | wc -l)
        if [[ $REPORT_COUNT -gt 100 ]]; then
            find "$REPORT_DIR" -name "${check_type}_*.json" -type f -printf '%T@ %p\n' | sort -n | head -n -$((REPORT_COUNT - 100)) | cut -d' ' -f2- | xargs rm -f
        fi
    done

    # Wait for next cycle
    echo ""
    echo "Waiting ${MONITORING_INTERVAL}s until next check... (Ctrl+C to stop)"
    sleep $MONITORING_INTERVAL
done