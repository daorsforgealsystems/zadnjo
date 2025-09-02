#!/bin/bash
# scripts/deployment-monitoring/monitor-deployment.sh
# Real-time deployment status monitoring script

set -e

# Configuration
ENVIRONMENT=${1:-production}
DEPLOYMENT_ID=${2:-$(date +%Y%m%d_%H%M%S)}
LOG_FILE="/var/log/flowmotion/deployment_${DEPLOYMENT_ID}.log"
STATUS_FILE="/tmp/deployment_status_${DEPLOYMENT_ID}.json"
MONITOR_INTERVAL=${3:-30}  # seconds

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Initialize status file
cat > "$STATUS_FILE" << EOF
{
  "deployment_id": "$DEPLOYMENT_ID",
  "environment": "$ENVIRONMENT",
  "start_time": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "monitoring",
  "services": {
    "frontend": {"status": "unknown", "last_check": null, "response_time": null},
    "api_gateway": {"status": "unknown", "last_check": null, "response_time": null},
    "inventory_service": {"status": "unknown", "last_check": null, "response_time": null},
    "order_service": {"status": "unknown", "last_check": null, "response_time": null},
    "routing_service": {"status": "unknown", "last_check": null, "response_time": null},
    "geolocation_service": {"status": "unknown", "last_check": null, "response_time": null},
    "notification_service": {"status": "unknown", "last_check": null, "response_time": null},
    "user_service": {"status": "unknown", "last_check": null, "response_time": null},
    "database": {"status": "unknown", "last_check": null, "response_time": null}
  },
  "alerts": []
}
EOF

# Logging function
log() {
    local level=$1
    local message=$2
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    echo -e "${BLUE}[$timestamp]${NC} [$level] $message"
}

# Alert function
alert() {
    local service=$1
    local alert_type=$2
    local message=$3
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)

    # Add alert to status file
    jq --arg service "$service" --arg type "$alert_type" --arg msg "$message" --arg ts "$timestamp" \
       '.alerts += [{"service": $service, "type": $type, "message": $msg, "timestamp": $ts}]' \
       "$STATUS_FILE" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "$STATUS_FILE"

    log "ALERT" "[$service] $alert_type: $message"

    # Send alert notification (implement based on your notification system)
    case $alert_type in
        "CRITICAL")
            echo -e "${RED}🚨 CRITICAL ALERT: $service - $message${NC}"
            # Send critical alert (email, Slack, PagerDuty, etc.)
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  WARNING: $service - $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  INFO: $service - $message${NC}"
            ;;
    esac
}

# Health check function
check_service() {
    local service=$1
    local url=$2
    local timeout=${3:-10}
    local expected_status=${4:-200}

    local start_time=$(date +%s%N)
    local response
    local http_code
    local response_time

    # Perform health check
    if response=$(curl -s -w "HTTPSTATUS:%{http_code};TIME:%{time_total}" \
                  --max-time $timeout "$url" 2>/dev/null); then

        http_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://' | sed -e 's/;TIME.*//')
        response_time=$(echo "$response" | tr -d '\n' | sed -e 's/.*TIME://')

        # Convert response time to milliseconds
        response_time_ms=$(echo "scale=0; $response_time * 1000" | bc 2>/dev/null || echo "0")

        if [[ "$http_code" == "$expected_status" ]]; then
            update_service_status "$service" "healthy" "$response_time_ms"
            return 0
        else
            update_service_status "$service" "unhealthy" "$response_time_ms" "HTTP $http_code"
            return 1
        fi
    else
        update_service_status "$service" "down" "0" "Connection failed"
        return 1
    fi
}

# Update service status in JSON
update_service_status() {
    local service=$1
    local status=$2
    local response_time=$3
    local error=${4:-""}
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)

    jq --arg service "$service" --arg status "$status" --arg rt "$response_time" \
       --arg ts "$timestamp" --arg error "$error" \
       ".services.$service = {\"status\": \$status, \"last_check\": \$ts, \"response_time\": \$rt, \"error\": \$error}" \
       "$STATUS_FILE" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "$STATUS_FILE"
}

# Kubernetes deployment status check
check_k8s_deployment() {
    local deployment=$1
    local namespace=${2:-logi-core}

    if ! kubectl get deployment "$deployment" -n "$namespace" >/dev/null 2>&1; then
        alert "$deployment" "CRITICAL" "Deployment not found in Kubernetes"
        return 1
    fi

    local desired_replicas=$(kubectl get deployment "$deployment" -n "$namespace" -o jsonpath='{.spec.replicas}')
    local ready_replicas=$(kubectl get deployment "$deployment" -n "$namespace" -o jsonpath='{.status.readyReplicas}')
    local available_replicas=$(kubectl get deployment "$deployment" -n "$namespace" -o jsonpath='{.status.availableReplicas}')

    if [[ "$ready_replicas" == "$desired_replicas" && "$available_replicas" == "$desired_replicas" ]]; then
        log "INFO" "Kubernetes deployment $deployment is healthy ($ready_replicas/$desired_replicas replicas ready)"
        return 0
    else
        alert "$deployment" "WARNING" "Deployment not fully ready ($ready_replicas/$desired_replicas replicas)"
        return 1
    fi
}

# Database connectivity check
check_database() {
    local host=${DB_HOST:-localhost}
    local port=${DB_PORT:-5432}
    local user=${DB_USER:-logistics}
    local db=${DB_NAME:-logistics}

    if pg_isready -h "$host" -p "$port" -U "$user" -d "$db" >/dev/null 2>&1; then
        update_service_status "database" "healthy" "0"
        return 0
    else
        update_service_status "database" "down" "0" "Connection failed"
        return 1
    fi
}

# Main monitoring loop
main() {
    log "INFO" "Starting deployment monitoring for environment: $ENVIRONMENT"
    log "INFO" "Deployment ID: $DEPLOYMENT_ID"
    log "INFO" "Monitor interval: ${MONITOR_INTERVAL}s"
    log "INFO" "Log file: $LOG_FILE"
    log "INFO" "Status file: $STATUS_FILE"

    # Trap for cleanup
    trap 'log "INFO" "Monitoring stopped by user"; exit 0' INT TERM

    local iteration=0
    while true; do
        ((iteration++))
        log "INFO" "Starting monitoring iteration $iteration"

        # Check frontend
        check_service "frontend" "https://$ENVIRONMENT.yourdomain.com/health" || true

        # Check API Gateway
        check_service "api_gateway" "https://api.$ENVIRONMENT.yourdomain.com/health" || true

        # Check microservices
        check_service "inventory_service" "http://inventory-service:8000/health" || true
        check_service "order_service" "http://order-service:4003/health" || true
        check_service "routing_service" "http://routing-service:4004/health" || true
        check_service "geolocation_service" "http://geolocation-service:4005/health" || true
        check_service "notification_service" "http://notification-service:4006/health" || true
        check_service "user_service" "http://user-service:4001/health" || true

        # Check database
        check_database || true

        # Check Kubernetes deployments
        check_k8s_deployment "api-gateway" || true
        check_k8s_deployment "inventory-service" || true
        check_k8s_deployment "order-service" || true

        # Check for critical alerts
        local critical_count=$(jq '.alerts | map(select(.type == "CRITICAL")) | length' "$STATUS_FILE")
        if [[ $critical_count -gt 0 ]]; then
            log "CRITICAL" "Found $critical_count critical alerts - consider rollback"
        fi

        # Display current status summary
        echo -e "\n${BLUE}=== Deployment Status Summary (Iteration $iteration) ===${NC}"
        jq -r '.services | to_entries[] | "\(.key): \(.value.status) (\(.value.response_time)ms)"' "$STATUS_FILE" 2>/dev/null || true

        # Wait before next iteration
        sleep $MONITOR_INTERVAL
    done
}

# Show usage if no arguments
if [[ $# -eq 0 ]]; then
    echo "Usage: $0 <environment> [deployment_id] [interval_seconds]"
    echo "Example: $0 production deploy_20231201_143000 30"
    exit 1
fi

# Run main function
main "$@"