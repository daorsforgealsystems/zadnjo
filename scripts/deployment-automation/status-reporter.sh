#!/bin/bash
# scripts/deployment-automation/status-reporter.sh
# Status reporting and notifications script

set -e

# Configuration
REPORT_TYPE=${1:-summary}  # summary, detailed, health
TIME_RANGE=${2:-1h}        # 1h, 6h, 24h, 7d
OUTPUT_FORMAT=${3:-console} # console, json, html, slack

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Report generation timestamp
REPORT_TIME=$(date +%s)
REPORT_ID="report_$(date +%Y%m%d_%H%M%S)"

echo -e "${BLUE}📊 Generating $REPORT_TYPE report for last $TIME_RANGE...${NC}"

# Calculate time range in seconds
case $TIME_RANGE in
    "1h")  TIME_SECONDS=3600   ;;
    "6h")  TIME_SECONDS=21600  ;;
    "24h") TIME_SECONDS=86400  ;;
    "7d")  TIME_SECONDS=604800 ;;
    *)     TIME_SECONDS=3600   ;;
esac

# Collect deployment data
collect_deployment_data() {
    local since=$((REPORT_TIME - TIME_SECONDS))

    # Find deployment logs
    local deployment_logs=$(find /var/log/flowmotion -name "*.log" -newermt "@$since" 2>/dev/null | wc -l)
    local successful_deployments=$(find /var/log/flowmotion -name "*deployment*" -newermt "@$since" 2>/dev/null | xargs grep -l "completed successfully" 2>/dev/null | wc -l)
    local failed_deployments=$(find /var/log/flowmotion -name "*deployment*" -newermt "@$since" 2>/dev/null | xargs grep -l "failed\|error" 2>/dev/null | wc -l)

    # Pipeline data
    local pipeline_runs=$(find /var/log/flowmotion -name "*pipeline*" -newermt "@$since" 2>/dev/null | wc -l)
    local successful_pipelines=$(find /var/log/flowmotion -name "*pipeline*" -newermt "@$since" 2>/dev/null | xargs grep -l "completed successfully" 2>/dev/null | wc -l)

    # Validation data
    local validation_runs=$(find /tmp -name "*validation*" -newermt "@$since" 2>/dev/null | wc -l)
    local passed_validations=$(find /tmp -name "*validation*" -newermt "@$since" 2>/dev/null | xargs grep -l '"overall_status": "passed"' 2>/dev/null | wc -l)

    # Calculate rates
    local deployment_success_rate=0
    if [[ $deployment_logs -gt 0 ]]; then
        deployment_success_rate=$((successful_deployments * 100 / deployment_logs))
    fi

    local pipeline_success_rate=0
    if [[ $pipeline_runs -gt 0 ]]; then
        pipeline_success_rate=$((successful_pipelines * 100 / pipeline_runs))
    fi

    local validation_success_rate=0
    if [[ $validation_runs -gt 0 ]]; then
        validation_success_rate=$((passed_validations * 100 / validation_runs))
    fi

    # Output as JSON
    cat << EOF
{
  "report_id": "$REPORT_ID",
  "time_range": "$TIME_RANGE",
  "generated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "deployments": {
    "total": $deployment_logs,
    "successful": $successful_deployments,
    "failed": $failed_deployments,
    "success_rate": $deployment_success_rate
  },
  "pipelines": {
    "total": $pipeline_runs,
    "successful": $successful_pipelines,
    "success_rate": $pipeline_success_rate
  },
  "validations": {
    "total": $validation_runs,
    "passed": $passed_validations,
    "success_rate": $validation_success_rate
  }
}
EOF
}

# Collect system health data
collect_health_data() {
    # Kubernetes cluster health
    local node_count=$(kubectl get nodes --no-headers 2>/dev/null | wc -l)
    local healthy_nodes=$(kubectl get nodes --no-headers 2>/dev/null | grep -c "Ready")
    local pod_count=$(kubectl get pods --all-namespaces --no-headers 2>/dev/null | wc -l)
    local healthy_pods=$(kubectl get pods --all-namespaces --no-headers 2>/dev/null | grep -c "Running")

    # Service health
    local services_total=$(kubectl get services -n logi-core --no-headers 2>/dev/null | wc -l)
    local endpoints_total=$(kubectl get endpoints -n logi-core --no-headers 2>/dev/null | grep -v "<none>" | wc -l)

    # Resource usage (simplified)
    local cpu_usage="N/A"
    local memory_usage="N/A"
    if command -v kubectl top >/dev/null 2>&1; then
        cpu_usage=$(kubectl top nodes --no-headers 2>/dev/null | awk '{sum+=$2} END {if(NR>0) print sum/NR "%"; else print "N/A"}')
        memory_usage=$(kubectl top nodes --no-headers 2>/dev/null | awk '{sum+=$4} END {if(NR>0) print sum/NR; else print "N/A"}')
    fi

    cat << EOF
{
  "cluster": {
    "nodes": {"total": $node_count, "healthy": $healthy_nodes},
    "pods": {"total": $pod_count, "healthy": $healthy_pods},
    "services": {"total": $services_total, "with_endpoints": $endpoints_total}
  },
  "resources": {
    "cpu_usage": "$cpu_usage",
    "memory_usage": "$memory_usage"
  }
}
EOF
}

# Generate summary report
generate_summary_report() {
    local deployment_data=$(collect_deployment_data)
    local health_data=$(collect_health_data)

    case $OUTPUT_FORMAT in
        "console")
            echo -e "${PURPLE}=== Deployment Status Summary ===${NC}"
            echo "Report ID: $REPORT_ID"
            echo "Time Range: $TIME_RANGE"
            echo "Generated: $(date)"
            echo ""

            echo -e "${BLUE}Deployments:${NC}"
            echo "  Total: $(echo "$deployment_data" | jq '.deployments.total')"
            echo "  Successful: $(echo "$deployment_data" | jq '.deployments.successful')"
            echo "  Failed: $(echo "$deployment_data" | jq '.deployments.failed')"
            echo "  Success Rate: $(echo "$deployment_data" | jq '.deployments.success_rate')%"
            echo ""

            echo -e "${BLUE}Pipelines:${NC}"
            echo "  Total: $(echo "$deployment_data" | jq '.pipelines.total')"
            echo "  Successful: $(echo "$deployment_data" | jq '.pipelines.successful')"
            echo "  Success Rate: $(echo "$deployment_data" | jq '.pipelines.success_rate')%"
            echo ""

            echo -e "${BLUE}Validations:${NC}"
            echo "  Total: $(echo "$deployment_data" | jq '.validations.total')"
            echo "  Passed: $(echo "$deployment_data" | jq '.validations.passed')"
            echo "  Success Rate: $(echo "$deployment_data" | jq '.validations.success_rate')%"
            echo ""

            echo -e "${BLUE}System Health:${NC}"
            echo "  Nodes: $(echo "$health_data" | jq '.cluster.nodes.healthy')/$(echo "$health_data" | jq '.cluster.nodes.total') healthy"
            echo "  Pods: $(echo "$health_data" | jq '.cluster.pods.healthy')/$(echo "$health_data" | jq '.cluster.pods.total') healthy"
            echo "  CPU Usage: $(echo "$health_data" | jq -r '.resources.cpu_usage')"
            echo "  Memory Usage: $(echo "$health_data" | jq -r '.resources.memory_usage')"
            ;;

        "json")
            # Combine all data
            echo "$deployment_data" | jq --argjson health "$health_data" '.health = $health'
            ;;

        "html")
            local report_file="/tmp/status_report_${REPORT_ID}.html"

            cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Deployment Status Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .success { color: green; }
        .warning { color: orange; }
        .error { color: red; }
        .summary { background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>Deployment Status Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Report ID:</strong> $REPORT_ID</p>
        <p><strong>Time Range:</strong> $TIME_RANGE</p>
        <p><strong>Generated:</strong> $(date)</p>
    </div>

    <h2>Deployment Metrics</h2>
    <div class="metric">
        <strong>Total Deployments:</strong> $(echo "$deployment_data" | jq '.deployments.total')<br>
        <strong>Successful:</strong> <span class="success">$(echo "$deployment_data" | jq '.deployments.successful')</span><br>
        <strong>Failed:</strong> <span class="error">$(echo "$deployment_data" | jq '.deployments.failed')</span><br>
        <strong>Success Rate:</strong> $(echo "$deployment_data" | jq '.deployments.success_rate')%
    </div>

    <h2>Pipeline Metrics</h2>
    <div class="metric">
        <strong>Total Pipelines:</strong> $(echo "$deployment_data" | jq '.pipelines.total')<br>
        <strong>Successful:</strong> <span class="success">$(echo "$deployment_data" | jq '.pipelines.successful')</span><br>
        <strong>Success Rate:</strong> $(echo "$deployment_data" | jq '.pipelines.success_rate')%
    </div>

    <h2>System Health</h2>
    <div class="metric">
        <strong>Nodes:</strong> $(echo "$health_data" | jq '.cluster.nodes.healthy')/$(echo "$health_data" | jq '.cluster.nodes.total') healthy<br>
        <strong>Pods:</strong> $(echo "$health_data" | jq '.cluster.pods.healthy')/$(echo "$health_data" | jq '.cluster.pods.total') healthy<br>
        <strong>CPU Usage:</strong> $(echo "$health_data" | jq -r '.resources.cpu_usage')<br>
        <strong>Memory Usage:</strong> $(echo "$health_data" | jq -r '.resources.memory_usage')
    </div>
</body>
</html>
EOF

            echo "HTML report generated: $report_file"
            ;;

        "slack")
            local deployment_data=$(collect_deployment_data)
            local health_data=$(collect_health_data)

            if [[ -n "$SLACK_WEBHOOK" ]]; then
                local payload=$(cat <<EOF
{
    "text": "Deployment Status Report - $TIME_RANGE",
    "attachments": [
        {
            "color": "good",
            "title": "Deployment Summary",
            "fields": [
                {
                    "title": "Deployments",
                    "value": "$(echo "$deployment_data" | jq '.deployments.successful')/$(echo "$deployment_data" | jq '.deployments.total') successful",
                    "short": true
                },
                {
                    "title": "Pipelines",
                    "value": "$(echo "$deployment_data" | jq '.pipelines.successful')/$(echo "$deployment_data" | jq '.pipelines.total') successful",
                    "short": true
                },
                {
                    "title": "Validations",
                    "value": "$(echo "$deployment_data" | jq '.validations.passed')/$(echo "$deployment_data" | jq '.validations.total') passed",
                    "short": true
                },
                {
                    "title": "System Health",
                    "value": "$(echo "$health_data" | jq '.cluster.nodes.healthy')/$(echo "$health_data" | jq '.cluster.nodes.total') nodes healthy",
                    "short": true
                }
            ],
            "footer": "Flow Motion Status Reporter",
            "ts": $REPORT_TIME
        }
    ]
}
EOF
                )

                curl -s -X POST -H 'Content-type: application/json' --data "$payload" "$SLACK_WEBHOOK" || true
                echo "Slack notification sent"
            else
                echo "SLACK_WEBHOOK not configured"
            fi
            ;;
    esac
}

# Generate detailed report
generate_detailed_report() {
    local deployment_data=$(collect_deployment_data)
    local health_data=$(collect_health_data)

    case $OUTPUT_FORMAT in
        "console")
            echo -e "${PURPLE}=== Detailed Deployment Report ===${NC}"
            echo "Report ID: $REPORT_ID"
            echo "Time Range: $TIME_RANGE"
            echo "Generated: $(date)"
            echo ""

            # Recent deployments
            echo -e "${BLUE}Recent Deployments:${NC}"
            find /var/log/flowmotion -name "*deployment*" -newermt "@$((REPORT_TIME - TIME_SECONDS))" 2>/dev/null | head -10 | while read -r log_file; do
                local deployment_id=$(basename "$log_file" | sed 's/_.*//')
                local status="Unknown"
                if grep -q "completed successfully" "$log_file" 2>/dev/null; then
                    status="✅ Success"
                elif grep -q "failed" "$log_file" 2>/dev/null; then
                    status="❌ Failed"
                fi
                echo "  $deployment_id: $status"
            done
            echo ""

            # Recent validations
            echo -e "${BLUE}Recent Validations:${NC}"
            find /tmp -name "*validation*" -newermt "@$((REPORT_TIME - TIME_SECONDS))" 2>/dev/null | head -10 | while read -r result_file; do
                local validation_type=$(basename "$result_file" | sed 's/.*validation_\([^_]*\).*/\1/')
                local status=$(jq -r '.overall_status // "unknown"' "$result_file" 2>/dev/null || echo "unknown")
                local status_icon="❓"
                [[ "$status" == "passed" ]] && status_icon="✅"
                [[ "$status" == "failed" ]] && status_icon="❌"
                [[ "$status" == "warning" ]] && status_icon="⚠️"
                echo "  $validation_type: $status_icon $status"
            done
            ;;

        "json")
            # Collect detailed data
            local recent_deployments=$(find /var/log/flowmotion -name "*deployment*" -newermt "@$((REPORT_TIME - TIME_SECONDS))" 2>/dev/null | head -20 | jq -R -s 'split("\n") | map(select(. != ""))')
            local recent_validations=$(find /tmp -name "*validation*" -newermt "@$((REPORT_TIME - TIME_SECONDS))" 2>/dev/null | head -20 | jq -R -s 'split("\n") | map(select(. != ""))')

            echo "$deployment_data" | jq --argjson health "$health_data" --argjson deployments "$recent_deployments" --argjson validations "$recent_validations" \
               '.health = $health | .recent_deployments = $deployments | .recent_validations = $validations'
            ;;
    esac
}

# Generate health report
generate_health_report() {
    local health_data=$(collect_health_data)

    case $OUTPUT_FORMAT in
        "console")
            echo -e "${PURPLE}=== System Health Report ===${NC}"
            echo "Report ID: $REPORT_ID"
            echo "Generated: $(date)"
            echo ""

            echo -e "${BLUE}Cluster Status:${NC}"
            echo "  Nodes: $(echo "$health_data" | jq '.cluster.nodes.healthy')/$(echo "$health_data" | jq '.cluster.nodes.total') healthy"
            echo "  Pods: $(echo "$health_data" | jq '.cluster.pods.healthy')/$(echo "$health_data" | jq '.cluster.pods.total') healthy"
            echo "  Services: $(echo "$health_data" | jq '.cluster.services.with_endpoints')/$(echo "$health_data" | jq '.cluster.services.total') with endpoints"
            echo ""

            echo -e "${BLUE}Resource Usage:${NC}"
            echo "  CPU: $(echo "$health_data" | jq -r '.resources.cpu_usage')"
            echo "  Memory: $(echo "$health_data" | jq -r '.resources.memory_usage')"
            echo ""

            # Check for issues
            local node_health=$(echo "$health_data" | jq '.cluster.nodes.healthy / .cluster.nodes.total * 100')
            local pod_health=$(echo "$health_data" | jq '.cluster.pods.healthy / .cluster.pods.total * 100')

            if (( $(echo "$node_health < 100" | bc -l 2>/dev/null || echo "1") )); then
                echo -e "${RED}⚠️  Node health issues detected${NC}"
            fi

            if (( $(echo "$pod_health < 95" | bc -l 2>/dev/null || echo "1") )); then
                echo -e "${YELLOW}⚠️  Pod health issues detected${NC}"
            fi
            ;;

        "json")
            echo "$health_data"
            ;;
    esac
}

# Main function
main() {
    case $REPORT_TYPE in
        "summary")
            generate_summary_report
            ;;
        "detailed")
            generate_detailed_report
            ;;
        "health")
            generate_health_report
            ;;
        *)
            echo -e "${RED}❌ Invalid report type: $REPORT_TYPE${NC}"
            echo "Valid types: summary, detailed, health"
            exit 1
            ;;
    esac
}

# Show usage
usage() {
    echo "Usage: $0 [report_type] [time_range] [output_format]"
    echo ""
    echo "Arguments:"
    echo "  report_type    Type of report (summary|detailed|health)"
    echo "  time_range     Time range (1h|6h|24h|7d)"
    echo "  output_format  Output format (console|json|html|slack)"
    echo ""
    echo "Examples:"
    echo "  $0 summary 24h console"
    echo "  $0 detailed 6h json"
    echo "  $0 health 1h slack"
    echo ""
    echo "Environment Variables:"
    echo "  SLACK_WEBHOOK    Webhook URL for Slack notifications"
    exit 1
}

# Check arguments
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    usage
fi

# Run main function
main