#!/bin/bash
# scripts/validation/generate-validation-report.sh
# Automated report generation and notification system

ENVIRONMENT=${1:-production}
REPORT_TYPE=${2:-comprehensive}  # quick, comprehensive, summary
NOTIFICATION_CHANNELS=${3:-"slack"}  # slack,email,sms
REPORT_DIR="/tmp/validation_reports_${ENVIRONMENT}_$(date +%Y%m%d_%H%M%S)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=== Automated Report Generation & Notifications ==="
echo "Environment: $ENVIRONMENT"
echo "Report Type: $REPORT_TYPE"
echo "Notification Channels: $NOTIFICATION_CHANNELS"
echo ""

# Create report directory
mkdir -p "$REPORT_DIR"

# Initialize comprehensive report
REPORT_FILE="$REPORT_DIR/validation_report.json"
cat > "$REPORT_FILE" << EOF
{
  "environment": "$ENVIRONMENT",
  "report_type": "$REPORT_TYPE",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "generated_at": "$(date)",
  "test_results": {
    "smoke_tests": null,
    "endpoint_tests": null,
    "integration_tests": null,
    "performance_tests": null,
    "security_scan": null,
    "load_tests": null,
    "regression_tests": null
  },
  "system_metrics": {},
  "overall_status": "generating",
  "recommendations": [],
  "notifications_sent": []
}
EOF

# Function to collect test results
collect_test_results() {
    local test_type=$1
    local pattern=$2
    local max_age=${3:-3600}  # 1 hour default

    echo "Collecting $test_type results..."

    # Find the most recent result file
    local result_file=$(find /tmp -name "*${pattern}*.json" -type f -mmin -$(($max_age / 60)) 2>/dev/null | head -1)

    if [[ -f "$result_file" ]]; then
        # Extract key metrics from the result file
        case $test_type in
            "smoke_tests")
                local status=$(jq -r '.overall_status // "unknown"' "$result_file")
                local total=$(jq -r '.summary.total // 0' "$result_file")
                local passed=$(jq -r '.summary.passed // 0' "$result_file")
                local failed=$(jq -r '.summary.failed // 0' "$result_file")

                jq --arg status "$status" --arg total "$total" --arg passed "$passed" --arg failed "$failed" \
                   '.test_results.smoke_tests = {"status": $status, "total": ($total | tonumber), "passed": ($passed | tonumber), "failed": ($failed | tonumber), "file": "'$result_file'"}' \
                   "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
                ;;

            "endpoint_tests")
                local status=$(jq -r '.overall_status // "unknown"' "$result_file")
                local total=$(jq -r '.summary.total // 0' "$result_file")
                local passed=$(jq -r '.summary.passed // 0' "$result_file")
                local failed=$(jq -r '.summary.failed // 0' "$result_file")
                local avg_response=$(jq -r '.summary.average_response_time // 0' "$result_file")

                jq --arg status "$status" --arg total "$total" --arg passed "$passed" --arg failed "$failed" --arg avg "$avg" \
                   '.test_results.endpoint_tests = {"status": $status, "total": ($total | tonumber), "passed": ($passed | tonumber), "failed": ($failed | tonumber), "avg_response_time": ($avg | tonumber), "file": "'$result_file'"}' \
                   "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
                ;;

            "integration_tests")
                local status=$(jq -r '.overall_status // "unknown"' "$result_file")
                local total=$(jq -r '.summary.total // 0' "$result_file")
                local passed=$(jq -r '.summary.passed // 0' "$result_file")
                local failed=$(jq -r '.summary.failed // 0' "$result_file")

                jq --arg status "$status" --arg total "$total" --arg passed "$passed" --arg failed "$failed" \
                   '.test_results.integration_tests = {"status": $status, "total": ($total | tonumber), "passed": ($passed | tonumber), "failed": ($failed | tonumber), "file": "'$result_file'"}' \
                   "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
                ;;

            "performance_tests")
                local status=$(jq -r '.overall_status // "unknown"' "$result_file")
                local avg_response=$(jq -r '.summary.average_response_time // 0' "$result_file")
                local throughput=$(jq -r '.summary.requests_per_second // 0' "$result_file")

                jq --arg status "$status" --arg avg "$avg_response" --arg throughput "$throughput" \
                   '.test_results.performance_tests = {"status": $status, "avg_response_time": ($avg | tonumber), "throughput": ($throughput | tonumber), "file": "'$result_file'"}' \
                   "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
                ;;

            "security_scan")
                local status=$(jq -r '.overall_status // "unknown"' "$result_file")
                local critical=$(jq -r '.summary.critical // 0' "$result_file")
                local high=$(jq -r '.summary.high // 0' "$result_file")
                local total=$(jq -r '.summary.total // 0' "$result_file")

                jq --arg status "$status" --arg critical "$critical" --arg high "$high" --arg total "$total" \
                   '.test_results.security_scan = {"status": $status, "critical_vulns": ($critical | tonumber), "high_vulns": ($high | tonumber), "total_vulns": ($total | tonumber), "file": "'$result_file'"}' \
                   "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
                ;;

            "load_tests")
                local status=$(jq -r '.overall_status // "unknown"' "$result_file")
                local total_requests=$(jq -r '.summary.total_requests // 0' "$result_file")
                local error_rate=$(jq -r '.summary.error_rate // 0' "$result_file")
                local avg_response=$(jq -r '.summary.average_response_time // 0' "$result_file")

                jq --arg status "$status" --arg requests "$total_requests" --arg error_rate "$error_rate" --arg avg "$avg_response" \
                   '.test_results.load_tests = {"status": $status, "total_requests": ($requests | tonumber), "error_rate": ($error_rate | tonumber), "avg_response_time": ($avg | tonumber), "file": "'$result_file'"}' \
                   "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
                ;;

            "regression_tests")
                local status=$(jq -r '.overall_status // "unknown"' "$result_file")
                local regressions=$(jq '.regressions_detected | length' "$result_file")
                local improvements=$(jq '.improvements_detected | length' "$result_file")

                jq --arg status "$status" --arg regressions "$regressions" --arg improvements "$improvements" \
                   '.test_results.regression_tests = {"status": $status, "regressions": ($regressions | tonumber), "improvements": ($improvements | tonumber), "file": "'$result_file'"}' \
                   "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
                ;;
        esac

        echo "  ✅ Collected $test_type results from: $(basename "$result_file")"
    else
        echo "  ⚠️  No recent $test_type results found"
        jq --arg type "$test_type" '.test_results[$type] = {"status": "no_data", "message": "No recent test results found"}' \
           "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    fi
}

# Function to collect system metrics
collect_system_metrics() {
    echo "Collecting system metrics..."

    # Kubernetes metrics
    local pod_count=$(kubectl get pods -n logi-core --no-headers 2>/dev/null | wc -l)
    local running_pods=$(kubectl get pods -n logi-core --field-selector=status.phase=Running --no-headers 2>/dev/null | wc -l)
    local cpu_usage=$(kubectl top pods -n logi-core --no-headers 2>/dev/null | awk '{sum+=$2} END {if(NR>0) print sum/NR; else print 0}' || echo '0')
    local mem_usage=$(kubectl top pods -n logi-core --no-headers 2>/dev/null | awk '{sum+=$3} END {if(NR>0) print sum/NR; else print 0}' || echo '0')

    # Database metrics
    local db_connections=$(kubectl exec -n logi-core $(kubectl get pods -n logi-core -l app=postgres -o jsonpath='{.items[0].metadata.name}' 2>/dev/null) -- \
        psql -U logistics -d logistics -c 'SELECT count(*) FROM pg_stat_activity;' 2>/dev/null | tail -3 | head -1 | tr -d ' ' || echo '0')

    # System resources
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | cut -d',' -f1 | tr -d ' ')

    jq --arg pods "$pod_count" --arg running "$running_pods" --arg cpu "$cpu_usage" --arg mem "$mem_usage" \
       --arg db_conn "$db_connections" --arg disk "$disk_usage" --arg load "$load_avg" \
       '.system_metrics = {
         "kubernetes": {"total_pods": ($pods | tonumber), "running_pods": ($running | tonumber), "avg_cpu": ($cpu | tonumber), "avg_memory": ($mem | tonumber)},
         "database": {"active_connections": ($db_conn | tonumber)},
         "system": {"disk_usage_percent": ($disk | tonumber), "load_average": ($load | tonumber)}
       }' \
       "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
}

# Function to generate recommendations
generate_recommendations() {
    echo "Generating recommendations..."

    local recommendations=()

    # Analyze test results and generate recommendations
    local smoke_status=$(jq -r '.test_results.smoke_tests.status // "unknown"' "$REPORT_FILE")
    if [[ "$smoke_status" != "passed" && "$smoke_status" != "unknown" ]]; then
        recommendations+=("❌ Critical: Smoke tests failing - immediate investigation required")
    fi

    local endpoint_failed=$(jq -r '.test_results.endpoint_tests.failed // 0' "$REPORT_FILE")
    if [[ $endpoint_failed -gt 0 ]]; then
        recommendations+=("⚠️  High: $endpoint_failed endpoint tests failing - API issues detected")
    fi

    local security_critical=$(jq -r '.test_results.security_scan.critical_vulns // 0' "$REPORT_FILE")
    if [[ $security_critical -gt 0 ]]; then
        recommendations+=("🚨 Critical: $security_critical critical security vulnerabilities found")
    fi

    local regressions=$(jq -r '.test_results.regression_tests.regressions // 0' "$REPORT_FILE")
    if [[ $regressions -gt 0 ]]; then
        recommendations+=("📉 Medium: $regressions performance regressions detected")
    fi

    local load_error_rate=$(jq -r '.test_results.load_tests.error_rate // 0' "$REPORT_FILE")
    if (( $(echo "$load_error_rate > 0.05" | bc -l 2>/dev/null || echo "0") )); then
        recommendations+=("⚡ High: Load test error rate $(echo "scale=1; $load_error_rate * 100" | bc -l 2>/dev/null || echo "0")% exceeds 5% threshold")
    fi

    local avg_response=$(jq -r '.test_results.endpoint_tests.avg_response_time // 0' "$REPORT_FILE")
    if [[ $avg_response -gt 1000 ]]; then
        recommendations+=("🐌 Medium: Average API response time ${avg_response}ms exceeds 1000ms threshold")
    fi

    # Add positive recommendations
    local improvements=$(jq -r '.test_results.regression_tests.improvements // 0' "$REPORT_FILE")
    if [[ $improvements -gt 0 ]]; then
        recommendations+=("✅ Positive: $improvements performance improvements detected")
    fi

    # Add recommendations to report
    for rec in "${recommendations[@]}"; do
        jq --arg rec "$rec" '.recommendations += [$rec]' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    done
}

# Function to determine overall status
determine_overall_status() {
    echo "Determining overall status..."

    local critical_issues=0
    local high_issues=0
    local medium_issues=0

    # Check for critical issues
    local smoke_status=$(jq -r '.test_results.smoke_tests.status // "unknown"' "$REPORT_FILE")
    if [[ "$smoke_status" == "failed" ]]; then
        critical_issues=$((critical_issues + 1))
    fi

    local security_critical=$(jq -r '.test_results.security_scan.critical_vulns // 0' "$REPORT_FILE")
    if [[ $security_critical -gt 0 ]]; then
        critical_issues=$((critical_issues + 1))
    fi

    # Check for high priority issues
    local endpoint_failed=$(jq -r '.test_results.endpoint_tests.failed // 0' "$REPORT_FILE")
    if [[ $endpoint_failed -gt 5 ]]; then
        high_issues=$((high_issues + 1))
    fi

    local load_error_rate=$(jq -r '.test_results.load_tests.error_rate // 0' "$REPORT_FILE")
    if (( $(echo "$load_error_rate > 0.05" | bc -l 2>/dev/null || echo "0") )); then
        high_issues=$((high_issues + 1))
    fi

    # Check for medium priority issues
    local regressions=$(jq -r '.test_results.regression_tests.regressions // 0' "$REPORT_FILE")
    if [[ $regressions -gt 0 ]]; then
        medium_issues=$((medium_issues + 1))
    fi

    # Determine overall status
    if [[ $critical_issues -gt 0 ]]; then
        jq '.overall_status = "critical"' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    elif [[ $high_issues -gt 0 ]]; then
        jq '.overall_status = "high_priority"' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    elif [[ $medium_issues -gt 0 ]]; then
        jq '.overall_status = "medium_priority"' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    else
        jq '.overall_status = "healthy"' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    fi
}

# Function to send notifications
send_notifications() {
    local channels=$1

    echo "Sending notifications via: $channels"

    # Generate notification content
    local overall_status=$(jq -r '.overall_status' "$REPORT_FILE")
    local recommendations_count=$(jq '.recommendations | length' "$REPORT_FILE")

    local status_emoji=""
    case $overall_status in
        "healthy") status_emoji="✅" ;;
        "medium_priority") status_emoji="⚠️" ;;
        "high_priority") status_emoji="🚨" ;;
        "critical") status_emoji="❌" ;;
        *) status_emoji="❓" ;;
    esac

    local message="$status_emoji Post-Deployment Validation Complete

Environment: $ENVIRONMENT
Status: $overall_status
Recommendations: $recommendations_count

Report: $REPORT_DIR/validation_report.html"

    # Send Slack notification
    if [[ "$channels" == *"slack"* ]]; then
        if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
            curl -X POST -H 'Content-type: application/json' \
                 --data "{\"text\":\"$message\",\"attachments\":[{\"color\":\"good\",\"fields\":[]}]}" \
                 "$SLACK_WEBHOOK_URL" >/dev/null 2>&1
            jq '.notifications_sent += ["slack"]' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
            echo "  ✅ Slack notification sent"
        else
            echo "  ⚠️  Slack webhook URL not configured"
        fi
    fi

    # Send email notification (placeholder)
    if [[ "$channels" == *"email"* ]]; then
        echo "  📧 Email notification would be sent here"
        jq '.notifications_sent += ["email"]' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    fi

    # Send SMS notification (placeholder)
    if [[ "$channels" == *"sms"* ]]; then
        echo "  📱 SMS notification would be sent here"
        jq '.notifications_sent += ["sms"]' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    fi
}

# ===== MAIN EXECUTION =====

# Collect test results based on report type
case $REPORT_TYPE in
    "quick")
        collect_test_results "smoke_tests" "smoke_test_results"
        collect_test_results "endpoint_tests" "endpoint_test_report"
        ;;
    "comprehensive"|*)
        collect_test_results "smoke_tests" "smoke_test_results"
        collect_test_results "endpoint_tests" "endpoint_test_report"
        collect_test_results "integration_tests" "integration_test"
        collect_test_results "performance_tests" "performance_report"
        collect_test_results "security_scan" "security_scan"
        collect_test_results "load_tests" "load_test_report"
        collect_test_results "regression_tests" "regression_test_report"
        ;;
esac

# Collect system metrics
collect_system_metrics

# Generate recommendations
generate_recommendations

# Determine overall status
determine_overall_status

# Generate HTML report
generate_html_report() {
    local html_file="$REPORT_DIR/validation_report.html"

    cat > "$html_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Validation Report - $ENVIRONMENT</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #007cba; padding-bottom: 20px; margin-bottom: 30px; }
        .status { font-size: 24px; font-weight: bold; padding: 10px; border-radius: 5px; text-align: center; margin: 20px 0; }
        .status-healthy { background: #d4edda; color: #155724; }
        .status-medium { background: #fff3cd; color: #856404; }
        .status-high { background: #f8d7da; color: #721c24; }
        .status-critical { background: #f5c6cb; color: #721c24; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; background: #f9f9f9; }
        .metric-title { font-weight: bold; margin-bottom: 10px; color: #007cba; }
        .recommendations { background: #f8f9fa; border-left: 4px solid #007cba; padding: 15px; margin: 20px 0; }
        .recommendation-item { margin: 5px 0; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #007cba; color: white; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Post-Deployment Validation Report</h1>
            <p><strong>Environment:</strong> $ENVIRONMENT | <strong>Generated:</strong> $(date) | <strong>Type:</strong> $REPORT_TYPE</p>
        </div>

        <div class="status status-$(jq -r '.overall_status' "$REPORT_FILE" | sed 's/_/-/g')">
            Overall Status: $(jq -r '.overall_status' "$REPORT_FILE" | sed 's/_/ /g' | sed 's/\b\w/\U&/g')
        </div>

        <h2>Test Results Summary</h2>
        <div class="metrics-grid">
EOF

    # Add test result cards
    for test_type in smoke_tests endpoint_tests integration_tests performance_tests security_scan load_tests regression_tests; do
        local test_data=$(jq ".test_results.$test_type" "$REPORT_FILE")
        if [[ "$test_data" != "null" && "$test_data" != "{}" ]]; then
            local status=$(echo "$test_data" | jq -r '.status // "unknown"')
            local status_class=""
            case $status in
                "passed"|"healthy") status_class="status-healthy" ;;
                "warning"|"medium_priority") status_class="status-medium" ;;
                "failed"|"high_priority") status_class="status-high" ;;
                "critical") status_class="status-critical" ;;
                *) status_class="" ;;
            esac

            cat >> "$html_file" << EOF
            <div class="metric-card">
                <div class="metric-title">$test_type</div>
                <div class="$status_class" style="padding: 5px; border-radius: 3px; margin-bottom: 10px;">Status: $status</div>
EOF

            # Add specific metrics based on test type
            case $test_type in
                "smoke_tests"|"endpoint_tests"|"integration_tests")
                    local total=$(echo "$test_data" | jq -r '.total // 0')
                    local passed=$(echo "$test_data" | jq -r '.passed // 0')
                    local failed=$(echo "$test_data" | jq -r '.failed // 0')
                    echo "<p>Total: $total | Passed: $passed | Failed: $failed</p>" >> "$html_file"
                    ;;
                "performance_tests")
                    local avg_response=$(echo "$test_data" | jq -r '.avg_response_time // 0')
                    local throughput=$(echo "$test_data" | jq -r '.throughput // 0')
                    echo "<p>Avg Response: ${avg_response}ms | Throughput: ${throughput} req/s</p>" >> "$html_file"
                    ;;
                "security_scan")
                    local critical=$(echo "$test_data" | jq -r '.critical_vulns // 0')
                    local high=$(echo "$test_data" | jq -r '.high_vulns // 0')
                    local total=$(echo "$test_data" | jq -r '.total_vulns // 0')
                    echo "<p>Critical: $critical | High: $high | Total: $total</p>" >> "$html_file"
                    ;;
                "load_tests")
                    local requests=$(echo "$test_data" | jq -r '.total_requests // 0')
                    local error_rate=$(echo "$test_data" | jq -r '.error_rate // 0')
                    local avg_response=$(echo "$test_data" | jq -r '.avg_response_time // 0')
                    echo "<p>Requests: $requests | Error Rate: $(echo "scale=1; $error_rate * 100" | bc -l 2>/dev/null || echo "0")% | Avg Response: ${avg_response}ms</p>" >> "$html_file"
                    ;;
                "regression_tests")
                    local regressions=$(echo "$test_data" | jq -r '.regressions // 0')
                    local improvements=$(echo "$test_data" | jq -r '.improvements // 0')
                    echo "<p>Regressions: $regressions | Improvements: $improvements</p>" >> "$html_file"
                    ;;
            esac

            echo "</div>" >> "$html_file"
        fi
    done

    cat >> "$html_file" << EOF
        </div>

        <h2>System Metrics</h2>
        <table>
            <tr><th>Metric</th><th>Value</th><th>Status</th></tr>
EOF

    # Add system metrics
    local pod_count=$(jq -r '.system_metrics.kubernetes.total_pods // 0' "$REPORT_FILE")
    local running_pods=$(jq -r '.system_metrics.kubernetes.running_pods // 0' "$REPORT_FILE")
    local cpu_usage=$(jq -r '.system_metrics.kubernetes.avg_cpu // 0' "$REPORT_FILE")
    local mem_usage=$(jq -r '.system_metrics.kubernetes.avg_memory // 0' "$REPORT_FILE")
    local disk_usage=$(jq -r '.system_metrics.system.disk_usage_percent // 0' "$REPORT_FILE")

    cat >> "$html_file" << EOF
            <tr><td>Total Pods</td><td>$pod_count</td><td>$(if [[ $pod_count -gt 0 ]]; then echo "✅"; else echo "❌"; fi)</td></tr>
            <tr><td>Running Pods</td><td>$running_pods</td><td>$(if [[ $running_pods -eq $pod_count ]]; then echo "✅"; else echo "⚠️"; fi)</td></tr>
            <tr><td>Average CPU Usage</td><td>${cpu_usage}%</td><td>$(if [[ $cpu_usage -lt 80 ]]; then echo "✅"; else echo "⚠️"; fi)</td></tr>
            <tr><td>Average Memory Usage</td><td>${mem_usage}%</td><td>$(if [[ $mem_usage -lt 80 ]]; then echo "✅"; else echo "⚠️"; fi)</td></tr>
            <tr><td>Disk Usage</td><td>${disk_usage}%</td><td>$(if [[ $disk_usage -lt 90 ]]; then echo "✅"; else echo "⚠️"; fi)</td></tr>
        </table>

        <h2>Recommendations</h2>
        <div class="recommendations">
EOF

    # Add recommendations
    jq -r '.recommendations[]' "$REPORT_FILE" | while read -r rec; do
        echo "<div class=\"recommendation-item\">$rec</div>" >> "$html_file"
    done

    cat >> "$html_file" << EOF
        </div>

        <div class="footer">
            <p>Report generated by Automated Validation Framework | $(date)</p>
            <p>Report Directory: $REPORT_DIR</p>
        </div>
    </div>
</body>
</html>
EOF
}

# Generate HTML report
generate_html_report

# Send notifications
send_notifications "$NOTIFICATION_CHANNELS"

# ===== FINAL SUMMARY =====
echo ""
echo "=== Report Generation Complete ==="
echo "Report Directory: $REPORT_DIR"
echo "JSON Report: $REPORT_FILE"
echo "HTML Report: $REPORT_DIR/validation_report.html"
echo ""

local overall_status=$(jq -r '.overall_status' "$REPORT_FILE")
local recommendations_count=$(jq '.recommendations | length' "$REPORT_FILE")
local notifications_sent=$(jq '.notifications_sent | length' "$REPORT_FILE")

echo "Overall Status: $overall_status"
echo "Recommendations: $recommendations_count"
echo "Notifications Sent: $notifications_sent"

case $overall_status in
    "healthy")
        echo -e "${GREEN}✅ System is healthy - no action required${NC}"
        ;;
    "medium_priority")
        echo -e "${YELLOW}⚠️  Minor issues detected - monitor closely${NC}"
        ;;
    "high_priority")
        echo -e "${RED}🚨 High priority issues detected - immediate attention required${NC}"
        ;;
    "critical")
        echo -e "${RED}❌ Critical issues detected - immediate action required${NC}"
        ;;
    *)
        echo -e "${BLUE}❓ Status unknown - manual review required${NC}"
        ;;
esac

echo ""
echo "Full report available at: $REPORT_DIR/validation_report.html"