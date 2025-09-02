#!/bin/bash
# scripts/deployment-monitoring/detect-failures.sh
# Failure detection and alerting script

set -e

# Configuration
ENVIRONMENT=${1:-production}
THRESHOLD=${2:-5}  # Error threshold for alerts
MONITOR_INTERVAL=${3:-60}  # seconds
ALERT_WEBHOOK=${ALERT_WEBHOOK_URL:-""}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Alert levels
ALERT_LOW="LOW"
ALERT_MEDIUM="MEDIUM"
ALERT_HIGH="HIGH"
ALERT_CRITICAL="CRITICAL"

# Failure patterns to monitor
declare -A FAILURE_PATTERNS=(
    ["pod_crashes"]="Pod crashes detected"
    ["service_unavailable"]="Service unavailable"
    ["high_error_rate"]="High error rate detected"
    ["database_connection"]="Database connection issues"
    ["memory_pressure"]="Memory pressure detected"
    ["disk_pressure"]="Disk pressure detected"
    ["network_issues"]="Network connectivity issues"
    ["timeout_errors"]="Timeout errors detected"
    ["auth_failures"]="Authentication failures"
    ["deployment_failures"]="Deployment failures"
)

# Alert history to prevent spam
declare -A ALERT_HISTORY
ALERT_COOLDOWN=300  # 5 minutes cooldown between similar alerts

# Send alert function
send_alert() {
    local level=$1
    local service=$2
    local message=$3
    local details=$4

    local alert_key="${service}_${level}"
    local current_time=$(date +%s)
    local last_alert=${ALERT_HISTORY[$alert_key]:-0}
    local time_diff=$((current_time - last_alert))

    # Check cooldown
    if [[ $time_diff -lt $ALERT_COOLDOWN ]]; then
        echo -e "${YELLOW}Alert suppressed (cooldown): $service - $message${NC}"
        return
    fi

    ALERT_HISTORY[$alert_key]=$current_time

    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    local color

    case $level in
        $ALERT_LOW) color="good" ;;
        $ALERT_MEDIUM) color="warning" ;;
        $ALERT_HIGH) color="danger" ;;
        $ALERT_CRITICAL) color="#ff0000" ;;
        *) color="warning" ;;
    esac

    echo -e "${RED}🚨 [$level] $service: $message${NC}"
    if [[ -n "$details" ]]; then
        echo "Details: $details"
    fi

    # Send to Slack/webhook if configured
    if [[ -n "$ALERT_WEBHOOK" ]]; then
        local payload=$(cat <<EOF
{
    "attachments": [
        {
            "color": "$color",
            "title": "Deployment Alert - $ENVIRONMENT",
            "fields": [
                {
                    "title": "Level",
                    "value": "$level",
                    "short": true
                },
                {
                    "title": "Service",
                    "value": "$service",
                    "short": true
                },
                {
                    "title": "Time",
                    "value": "$timestamp",
                    "short": true
                }
            ],
            "text": "$message",
            "footer": "Flow Motion Monitoring",
            "ts": $(date +%s)
        }
    ]
}
EOF
        )

        curl -s -X POST -H 'Content-type: application/json' --data "$payload" "$ALERT_WEBHOOK" || true
    fi

    # Log alert
    echo "[$timestamp] [$level] [$service] $message - $details" >> "/var/log/flowmotion/alerts_${ENVIRONMENT}.log"
}

# Check pod crashes
check_pod_crashes() {
    local namespace=${1:-logi-core}
    local crash_count=$(kubectl get pods -n "$namespace" --field-selector=status.phase!=Running,status.phase!=Succeeded -o jsonpath='{.items[*].status.containerStatuses[*].restartCount}' 2>/dev/null | awk '{sum+=$1} END {print sum+0}')

    if [[ $crash_count -gt $THRESHOLD ]]; then
        local crashed_pods=$(kubectl get pods -n "$namespace" --field-selector=status.phase!=Running,status.phase!=Succeeded -o jsonpath='{.items[*].metadata.name}' 2>/dev/null | tr ' ' '\n' | head -5)
        send_alert "$ALERT_HIGH" "kubernetes" "${FAILURE_PATTERNS[pod_crashes]}" "Crash count: $crash_count, Affected pods: $crashed_pods"
    fi
}

# Check service availability
check_service_availability() {
    local services=("api-gateway" "inventory-service" "order-service" "routing-service" "geolocation-service" "notification-service" "user-service")

    for service in "${services[@]}"; do
        local pod_count=$(kubectl get pods -n logi-core -l app="$service" --no-headers 2>/dev/null | wc -l)

        if [[ $pod_count -eq 0 ]]; then
            send_alert "$ALERT_CRITICAL" "$service" "${FAILURE_PATTERNS[service_unavailable]}" "No pods running for service"
            continue
        fi

        local ready_count=$(kubectl get pods -n logi-core -l app="$service" -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}' 2>/dev/null | grep -c "True" || echo "0")

        if [[ $ready_count -eq 0 ]]; then
            send_alert "$ALERT_CRITICAL" "$service" "${FAILURE_PATTERNS[service_unavailable]}" "No ready pods for service"
        elif [[ $ready_count -lt $pod_count ]]; then
            send_alert "$ALERT_MEDIUM" "$service" "Partial service unavailability" "Ready: $ready_count/$pod_count pods"
        fi
    done
}

# Check error rates in logs
check_error_rates() {
    local since="5m"
    local services=("api-gateway" "inventory-service" "order-service")

    for service in "${services[@]}"; do
        local error_count=$(kubectl logs -n logi-core -l app="$service" --since="$since" 2>/dev/null | grep -i -c "error\|exception\|fail" || echo "0")

        if [[ $error_count -gt $THRESHOLD ]]; then
            send_alert "$ALERT_HIGH" "$service" "${FAILURE_PATTERNS[high_error_rate]}" "Error count in last $since: $error_count"
        fi
    done
}

# Check database connectivity
check_database_connectivity() {
    local db_host=${DB_HOST:-localhost}
    local db_port=${DB_PORT:-5432}
    local db_user=${DB_USER:-logistics}

    if ! timeout 5 bash -c "echo > /dev/tcp/$db_host/$db_port" 2>/dev/null; then
        send_alert "$ALERT_CRITICAL" "database" "${FAILURE_PATTERNS[database_connection]}" "Cannot connect to database at $db_host:$db_port"
    fi

    # Check if we can actually query the database
    if ! pg_isready -h "$db_host" -p "$db_port" -U "$db_user" >/dev/null 2>&1; then
        send_alert "$ALERT_CRITICAL" "database" "${FAILURE_PATTERNS[database_connection]}" "Database not ready or authentication failed"
    fi
}

# Check resource usage
check_resource_usage() {
    local namespace=${1:-logi-core}

    # Check memory pressure
    local memory_pressure=$(kubectl get nodes -o jsonpath='{.items[*].status.conditions[?(@.type=="MemoryPressure")].status}' 2>/dev/null | grep -c "True" || echo "0")
    if [[ $memory_pressure -gt 0 ]]; then
        send_alert "$ALERT_HIGH" "kubernetes" "${FAILURE_PATTERNS[memory_pressure]}" "Memory pressure detected on cluster nodes"
    fi

    # Check disk pressure
    local disk_pressure=$(kubectl get nodes -o jsonpath='{.items[*].status.conditions[?(@.type=="DiskPressure")].status}' 2>/dev/null | grep -c "True" || echo "0")
    if [[ $disk_pressure -gt 0 ]]; then
        send_alert "$ALERT_HIGH" "kubernetes" "${FAILURE_PATTERNS[disk_pressure]}" "Disk pressure detected on cluster nodes"
    fi

    # Check pod resource usage
    kubectl top pods -n "$namespace" --no-headers 2>/dev/null | while read -r pod cpu mem; do
        # Remove unit suffixes and check thresholds
        local mem_percent=$(echo "$mem" | sed 's/%//')
        if [[ ${mem_percent:-0} -gt 90 ]]; then
            send_alert "$ALERT_MEDIUM" "kubernetes" "High memory usage" "Pod $pod using ${mem_percent}% memory"
        fi
    done
}

# Check network connectivity
check_network_connectivity() {
    # Check if services can communicate with each other
    local test_pod=$(kubectl get pods -n logi-core -l app=api-gateway -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

    if [[ -n "$test_pod" ]]; then
        # Test internal DNS resolution
        if ! kubectl exec -n logi-core "$test_pod" -- nslookup inventory-service >/dev/null 2>&1; then
            send_alert "$ALERT_MEDIUM" "network" "${FAILURE_PATTERNS[network_issues]}" "DNS resolution failing for internal services"
        fi

        # Test external connectivity
        if ! kubectl exec -n logi-core "$test_pod" -- curl -s --max-time 5 https://httpbin.org/get >/dev/null 2>&1; then
            send_alert "$ALERT_LOW" "network" "${FAILURE_PATTERNS[network_issues]}" "External connectivity issues detected"
        fi
    fi
}

# Check for timeout errors
check_timeout_errors() {
    local since="10m"

    # Check for timeout patterns in logs
    local timeout_count=$(kubectl logs -n logi-core --since="$since" --all-containers=true 2>/dev/null | grep -i -c "timeout\|timed out" || echo "0")

    if [[ $timeout_count -gt $THRESHOLD ]]; then
        send_alert "$ALERT_MEDIUM" "application" "${FAILURE_PATTERNS[timeout_errors]}" "Timeout errors in last $since: $timeout_count"
    fi
}

# Check authentication failures
check_auth_failures() {
    local since="10m"

    # Check for auth failure patterns
    local auth_failures=$(kubectl logs -n logi-core -l app=api-gateway --since="$since" 2>/dev/null | grep -i -c "unauthorized\|forbidden\|invalid token" || echo "0")

    if [[ $auth_failures -gt $THRESHOLD ]]; then
        send_alert "$ALERT_MEDIUM" "authentication" "${FAILURE_PATTERNS[auth_failures]}" "Authentication failures in last $since: $auth_failures"
    fi
}

# Check deployment status
check_deployment_status() {
    local namespace=${1:-logi-core}

    # Check for failed deployments
    local failed_deployments=$(kubectl get deployments -n "$namespace" -o jsonpath='{.items[?(@.status.conditions[?(@.type=="Available" && @.status=="False")])].metadata.name}' 2>/dev/null | wc -w)

    if [[ $failed_deployments -gt 0 ]]; then
        local failed_list=$(kubectl get deployments -n "$namespace" -o jsonpath='{.items[?(@.status.conditions[?(@.type=="Available" && @.status=="False")])].metadata.name}' 2>/dev/null)
        send_alert "$ALERT_CRITICAL" "kubernetes" "${FAILURE_PATTERNS[deployment_failures]}" "Failed deployments: $failed_list"
    fi

    # Check for deployments in progress
    local progressing_deployments=$(kubectl get deployments -n "$namespace" -o jsonpath='{.items[?(@.status.conditions[?(@.type=="Progressing" && @.status=="True" && @.reason!="NewReplicaSetAvailable")])].metadata.name}' 2>/dev/null | wc -w)

    if [[ $progressing_deployments -gt 0 ]]; then
        local progressing_list=$(kubectl get deployments -n "$namespace" -o jsonpath='{.items[?(@.status.conditions[?(@.type=="Progressing" && @.status=="True" && @.reason!="NewReplicaSetAvailable")])].metadata.name}' 2>/dev/null)
        send_alert "$ALERT_LOW" "kubernetes" "Deployments in progress" "Ongoing deployments: $progressing_list"
    fi
}

# Generate health report
generate_health_report() {
    local report_file="/tmp/health_report_${ENVIRONMENT}_$(date +%Y%m%d_%H%M%S).txt"

    {
        echo "Flow Motion Health Report"
        echo "Environment: $ENVIRONMENT"
        echo "Generated: $(date)"
        echo "================================="
        echo ""

        echo "Kubernetes Status:"
        kubectl get nodes --no-headers | while read -r node status roles age version; do
            echo "  Node $node: $status"
        done
        echo ""

        echo "Pod Status Summary:"
        kubectl get pods -n logi-core --no-headers | awk '{print $3}' | sort | uniq -c | while read -r count status; do
            echo "  $status: $count pods"
        done
        echo ""

        echo "Service Endpoints:"
        kubectl get endpoints -n logi-core --no-headers | while read -r name endpoints age; do
            if [[ "$endpoints" == "<none>" ]]; then
                echo "  $name: No endpoints available"
            else
                echo "  $name: $endpoints"
            fi
        done
        echo ""

        echo "Resource Usage:"
        kubectl top nodes --no-headers 2>/dev/null | while read -r node cpu mem; do
            echo "  Node $node: CPU $cpu, Memory $mem"
        done
        echo ""

        echo "Recent Events (last 10):"
        kubectl get events -n logi-core --sort-by=.metadata.creationTimestamp | tail -10 | while read -r lastseen type reason object message; do
            echo "  [$type] $reason: $message"
        done

    } > "$report_file"

    echo -e "${GREEN}Health report generated: $report_file${NC}"
}

# Main monitoring function
main() {
    echo -e "${BLUE}Starting failure detection and alerting for $ENVIRONMENT...${NC}"
    echo "Threshold: $THRESHOLD errors"
    echo "Monitor interval: ${MONITOR_INTERVAL}s"
    echo "Press Ctrl+C to stop"
    echo ""

    # Trap for cleanup
    trap 'echo -e "\n${YELLOW}Monitoring stopped${NC}"; exit 0' INT TERM

    local iteration=0
    while true; do
        ((iteration++))
        echo -e "${BLUE}=== Failure Detection Iteration $iteration ===${NC}"

        # Run all checks
        check_pod_crashes
        check_service_availability
        check_error_rates
        check_database_connectivity
        check_resource_usage
        check_network_connectivity
        check_timeout_errors
        check_auth_failures
        check_deployment_status

        # Generate health report every 10 iterations
        if [[ $((iteration % 10)) -eq 0 ]]; then
            generate_health_report
        fi

        echo -e "${GREEN}✓ All checks completed${NC}"
        sleep $MONITOR_INTERVAL
    done
}

# Show usage
usage() {
    echo "Usage: $0 [environment] [threshold] [interval]"
    echo ""
    echo "Arguments:"
    echo "  environment    Target environment (default: production)"
    echo "  threshold      Error threshold for alerts (default: 5)"
    echo "  interval       Monitor interval in seconds (default: 60)"
    echo ""
    echo "Environment Variables:"
    echo "  ALERT_WEBHOOK_URL    Webhook URL for sending alerts"
    echo "  DB_HOST              Database host (default: localhost)"
    echo "  DB_PORT              Database port (default: 5432)"
    echo "  DB_USER              Database user (default: logistics)"
    echo ""
    echo "Examples:"
    echo "  $0 production 3 30"
    echo "  ALERT_WEBHOOK_URL=https://hooks.slack.com/... $0 staging"
    exit 1
}

# Check arguments
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    usage
fi

# Run main function
main