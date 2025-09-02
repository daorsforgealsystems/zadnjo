#!/bin/bash
# scripts/deployment-monitoring/trigger-rollback.sh
# Rollback triggering automation script

set -e

# Configuration
DEPLOYMENT_ID=${1:-latest}
ENVIRONMENT=${2:-production}
AUTO_TRIGGER=${3:-false}
ROLLBACK_STRATEGY=${4:-immediate}  # immediate, gradual, canary

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Rollback states
STATE_IDLE="idle"
STATE_ANALYZING="analyzing"
STATE_TRIGGERED="triggered"
STATE_EXECUTING="executing"
STATE_COMPLETED="completed"
STATE_FAILED="failed"

# Rollback triggers
TRIGGER_MANUAL="manual"
TRIGGER_AUTO="automatic"
TRIGGER_HEALTH="health_check"
TRIGGER_ERROR_RATE="error_rate"
TRIGGER_PERFORMANCE="performance"

# Initialize rollback state
initialize_rollback() {
    local rollback_file="/tmp/rollback_state_${ENVIRONMENT}.json"

    cat > "$rollback_file" << EOF
{
  "deployment_id": "$DEPLOYMENT_ID",
  "environment": "$ENVIRONMENT",
  "state": "$STATE_IDLE",
  "trigger_type": "$TRIGGER_MANUAL",
  "strategy": "$ROLLBACK_STRATEGY",
  "start_time": null,
  "end_time": null,
  "reason": "",
  "affected_services": [],
  "rollback_version": "",
  "progress": 0,
  "steps": {
    "analysis": {"status": "pending", "start_time": null, "end_time": null},
    "backup": {"status": "pending", "start_time": null, "end_time": null},
    "execution": {"status": "pending", "start_time": null, "end_time": null},
    "validation": {"status": "pending", "start_time": null, "end_time": null},
    "cleanup": {"status": "pending", "start_time": null, "end_time": null}
  },
  "alerts_sent": []
}
EOF

    echo "$rollback_file"
}

# Update rollback state
update_rollback_state() {
    local rollback_file=$1
    local field=$2
    local value=$3

    if [[ "$field" == "state" ]]; then
        jq --arg val "$value" '.state = $val' "$rollback_file" > "${rollback_file}.tmp" && mv "${rollback_file}.tmp" "$rollback_file"
    elif [[ "$field" == "progress" ]]; then
        jq --arg val "$value" '.progress = ($val | tonumber)' "$rollback_file" > "${rollback_file}.tmp" && mv "${rollback_file}.tmp" "$rollback_file"
    elif [[ "$field" == "reason" ]]; then
        jq --arg val "$value" '.reason = $val' "$rollback_file" > "${rollback_file}.tmp" && mv "${rollback_file}.tmp" "$rollback_file"
    fi
}

# Update step status
update_step_status() {
    local rollback_file=$1
    local step=$2
    local status=$3
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)

    if [[ "$status" == "in_progress" ]]; then
        jq --arg step "$step" --arg ts "$timestamp" \
           ".steps.$step.status = \"in_progress\" | .steps.$step.start_time = \$ts" \
           "$rollback_file" > "${rollback_file}.tmp" && mv "${rollback_file}.tmp" "$rollback_file"
    elif [[ "$status" == "completed" ]]; then
        jq --arg step "$step" --arg ts "$timestamp" \
           ".steps.$step.status = \"completed\" | .steps.$step.end_time = \$ts" \
           "$rollback_file" > "${rollback_file}.tmp" && mv "${rollback_file}.tmp" "$rollback_file"
    elif [[ "$status" == "failed" ]]; then
        jq --arg step "$step" --arg ts "$timestamp" \
           ".steps.$step.status = \"failed\" | .steps.$step.end_time = \$ts" \
           "$rollback_file" > "${rollback_file}.tmp" && mv "${rollback_file}.tmp" "$rollback_file"
    fi
}

# Analyze deployment health
analyze_deployment_health() {
    local rollback_file=$1

    echo -e "${BLUE}Analyzing deployment health...${NC}"
    update_step_status "$rollback_file" "analysis" "in_progress"

    local issues_found=0
    local affected_services=()

    # Check pod status
    local unhealthy_pods=$(kubectl get pods -n logi-core --no-headers 2>/dev/null | grep -v "Running\|Completed" | wc -l)
    if [[ $unhealthy_pods -gt 0 ]]; then
        ((issues_found++))
        affected_services+=("pods")
        echo -e "${RED}Found $unhealthy_pods unhealthy pods${NC}"
    fi

    # Check service endpoints
    local services_without_endpoints=$(kubectl get endpoints -n logi-core --no-headers 2>/dev/null | grep "<none>" | wc -l)
    if [[ $services_without_endpoints -gt 0 ]]; then
        ((issues_found++))
        affected_services+=("services")
        echo -e "${RED}Found $services_without_endpoints services without endpoints${NC}"
    fi

    # Check error rates in recent logs
    local high_error_services=()
    local services=("api-gateway" "inventory-service" "order-service" "routing-service")

    for service in "${services[@]}"; do
        local error_count=$(kubectl logs -n logi-core -l app="$service" --since=10m 2>/dev/null | grep -i -c "error\|exception\|fail" || echo "0")
        if [[ $error_count -gt 10 ]]; then
            ((issues_found++))
            high_error_services+=("$service ($error_count errors)")
        fi
    done

    if [[ ${#high_error_services[@]} -gt 0 ]]; then
        affected_services+=("${high_error_services[@]}")
        echo -e "${RED}High error rates in: ${high_error_services[*]}${NC}"
    fi

    # Update affected services in state
    local services_json=$(printf '%s\n' "${affected_services[@]}" | jq -R . | jq -s .)
    jq --argjson services "$services_json" '.affected_services = $services' "$rollback_file" > "${rollback_file}.tmp" && mv "${rollback_file}.tmp" "$rollback_file"

    update_step_status "$rollback_file" "analysis" "completed"

    echo -e "${GREEN}Analysis completed. Issues found: $issues_found${NC}"
    return $issues_found
}

# Create backup before rollback
create_rollback_backup() {
    local rollback_file=$1

    echo -e "${BLUE}Creating rollback backup...${NC}"
    update_step_status "$rollback_file" "backup" "in_progress"

    local backup_timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_dir="/opt/flowmotion/rollback_backups/$backup_timestamp"

    mkdir -p "$backup_dir"

    # Backup current deployment state
    kubectl get deployments -n logi-core -o yaml > "$backup_dir/deployments.yaml"
    kubectl get services -n logi-core -o yaml > "$backup_dir/services.yaml"
    kubectl get configmaps -n logi-core -o yaml > "$backup_dir/configmaps.yaml"
    kubectl get secrets -n logi-core -o yaml > "$backup_dir/secrets.yaml"

    # Backup database if needed
    if [[ -n "$DB_HOST" ]]; then
        echo "Creating database backup..."
        pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" > "$backup_dir/database.sql" 2>/dev/null || echo "Database backup failed"
    fi

    # Store backup location in rollback state
    jq --arg backup "$backup_dir" '.backup_location = $backup' "$rollback_file" > "${rollback_file}.tmp" && mv "${rollback_file}.tmp" "$rollback_file"

    update_step_status "$rollback_file" "backup" "completed"
    echo -e "${GREEN}Backup created: $backup_dir${NC}"
}

# Execute rollback based on strategy
execute_rollback() {
    local rollback_file=$1
    local strategy=$(jq -r '.strategy' "$rollback_file")

    echo -e "${BLUE}Executing rollback using $strategy strategy...${NC}"
    update_step_status "$rollback_file" "execution" "in_progress"
    update_rollback_state "$rollback_file" "state" "$STATE_EXECUTING"

    case $strategy in
        "immediate")
            execute_immediate_rollback "$rollback_file"
            ;;
        "gradual")
            execute_gradual_rollback "$rollback_file"
            ;;
        "canary")
            execute_canary_rollback "$rollback_file"
            ;;
        *)
            echo -e "${RED}Unknown rollback strategy: $strategy${NC}"
            update_step_status "$rollback_file" "execution" "failed"
            return 1
            ;;
    esac

    update_step_status "$rollback_file" "execution" "completed"
    update_rollback_state "$rollback_file" "progress" "75"
}

# Immediate rollback - rollback all at once
execute_immediate_rollback() {
    local rollback_file=$1

    echo -e "${YELLOW}Executing immediate rollback...${NC}"

    # Rollback deployments to previous version
    kubectl rollout undo deployment/api-gateway -n logi-core
    kubectl rollout undo deployment/inventory-service -n logi-core
    kubectl rollout undo deployment/order-service -n logi-core
    kubectl rollout undo deployment/routing-service -n logi-core
    kubectl rollout undo deployment/geolocation-service -n logi-core
    kubectl rollout undo deployment/notification-service -n logi-core
    kubectl rollout undo deployment/user-service -n logi-core

    # Wait for rollbacks to complete
    echo "Waiting for rollbacks to complete..."
    kubectl rollout status deployment/api-gateway -n logi-core --timeout=300s
    kubectl rollout status deployment/inventory-service -n logi-core --timeout=300s
    kubectl rollout status deployment/order-service -n logi-core --timeout=300s

    echo -e "${GREEN}Immediate rollback completed${NC}"
}

# Gradual rollback - rollback services one by one
execute_gradual_rollback() {
    local rollback_file=$1

    echo -e "${YELLOW}Executing gradual rollback...${NC}"

    local services=("api-gateway" "inventory-service" "order-service" "routing-service" "geolocation-service" "notification-service" "user-service")

    for service in "${services[@]}"; do
        echo -e "${BLUE}Rolling back $service...${NC}"
        kubectl rollout undo deployment/"$service" -n logi-core

        # Wait for this service to be ready before proceeding
        kubectl rollout status deployment/"$service" -n logi-core --timeout=180s

        # Brief pause between services
        sleep 10
    done

    echo -e "${GREEN}Gradual rollback completed${NC}"
}

# Canary rollback - rollback using canary deployment pattern
execute_canary_rollback() {
    local rollback_file=$1

    echo -e "${YELLOW}Executing canary rollback...${NC}"

    # Scale down current deployment gradually
    kubectl scale deployment api-gateway --replicas=3 -n logi-core
    sleep 30

    kubectl scale deployment api-gateway --replicas=1 -n logi-core
    sleep 30

    kubectl scale deployment api-gateway --replicas=0 -n logi-core

    # Deploy previous version
    kubectl rollout undo deployment/api-gateway -n logi-core

    # Gradually scale up the rolled back version
    kubectl scale deployment api-gateway --replicas=1 -n logi-core
    sleep 60

    kubectl scale deployment api-gateway --replicas=3 -n logi-core
    sleep 60

    # Full rollout
    kubectl scale deployment api-gateway --replicas=5 -n logi-core

    echo -e "${GREEN}Canary rollback completed${NC}"
}

# Validate rollback success
validate_rollback() {
    local rollback_file=$1

    echo -e "${BLUE}Validating rollback success...${NC}"
    update_step_status "$rollback_file" "validation" "in_progress"

    local validation_passed=0
    local total_checks=0

    # Check if all deployments are healthy
    ((total_checks++))
    local unhealthy_deployments=$(kubectl get deployments -n logi-core -o jsonpath='{.items[?(@.status.unavailableReplicas)].metadata.name}' 2>/dev/null | wc -w)
    if [[ $unhealthy_deployments -eq 0 ]]; then
        ((validation_passed++))
        echo -e "${GREEN}✓ All deployments are healthy${NC}"
    else
        echo -e "${RED}✗ $unhealthy_deployments deployments are unhealthy${NC}"
    fi

    # Check service endpoints
    ((total_checks++))
    local services_without_endpoints=$(kubectl get endpoints -n logi-core --no-headers 2>/dev/null | grep "<none>" | wc -l)
    if [[ $services_without_endpoints -eq 0 ]]; then
        ((validation_passed++))
        echo -e "${GREEN}✓ All services have endpoints${NC}"
    else
        echo -e "${RED}✗ $services_without_endpoints services without endpoints${NC}"
    fi

    # Check API health
    ((total_checks++))
    if curl -f -s --max-time 10 http://api-gateway/health >/dev/null 2>&1; then
        ((validation_passed++))
        echo -e "${GREEN}✓ API health check passed${NC}"
    else
        echo -e "${RED}✗ API health check failed${NC}"
    fi

    local success_rate=$((validation_passed * 100 / total_checks))

    if [[ $success_rate -ge 80 ]]; then
        update_step_status "$rollback_file" "validation" "completed"
        echo -e "${GREEN}Rollback validation passed ($validation_passed/$total_checks)${NC}"
        return 0
    else
        update_step_status "$rollback_file" "validation" "failed"
        echo -e "${RED}Rollback validation failed ($validation_passed/$total_checks)${NC}"
        return 1
    fi
}

# Cleanup after rollback
cleanup_rollback() {
    local rollback_file=$1

    echo -e "${BLUE}Cleaning up rollback artifacts...${NC}"
    update_step_status "$rollback_file" "cleanup" "in_progress"

    # Clean up old replica sets
    kubectl delete replicasets -n logi-core $(kubectl get replicasets -n logi-core --no-headers | awk '$2 == 0 {print $1}') 2>/dev/null || true

    # Clean up failed pods
    kubectl delete pods -n logi-core --field-selector=status.phase=Failed 2>/dev/null || true

    update_step_status "$rollback_file" "cleanup" "completed"
    echo -e "${GREEN}Cleanup completed${NC}"
}

# Send rollback notifications
send_rollback_notification() {
    local rollback_file=$1
    local status=$2

    local reason=$(jq -r '.reason' "$rollback_file")
    local affected_services=$(jq -r '.affected_services | join(", ")' "$rollback_file")
    local strategy=$(jq -r '.strategy' "$rollback_file")

    local color
    local title

    case $status in
        "triggered")
            color="warning"
            title="🚨 Rollback Triggered"
            ;;
        "completed")
            color="good"
            title="✅ Rollback Completed"
            ;;
        "failed")
            color="danger"
            title="❌ Rollback Failed"
            ;;
        *)
            color="warning"
            title="ℹ️ Rollback Update"
            ;;
    esac

    # Send notification if webhook is configured
    if [[ -n "$ROLLBACK_WEBHOOK_URL" ]]; then
        local payload=$(cat <<EOF
{
    "attachments": [
        {
            "color": "$color",
            "title": "$title",
            "fields": [
                {
                    "title": "Environment",
                    "value": "$ENVIRONMENT",
                    "short": true
                },
                {
                    "title": "Strategy",
                    "value": "$strategy",
                    "short": true
                },
                {
                    "title": "Reason",
                    "value": "$reason",
                    "short": false
                },
                {
                    "title": "Affected Services",
                    "value": "$affected_services",
                    "short": false
                }
            ],
            "footer": "Flow Motion Rollback System",
            "ts": $(date +%s)
        }
    ]
}
EOF
        )

        curl -s -X POST -H 'Content-type: application/json' --data "$payload" "$ROLLBACK_WEBHOOK_URL" || true
    fi
}

# Main rollback function
main() {
    echo -e "${PURPLE}=== Flow Motion Rollback System ===${NC}"
    echo "Deployment ID: $DEPLOYMENT_ID"
    echo "Environment: $ENVIRONMENT"
    echo "Strategy: $ROLLBACK_STRATEGY"
    echo "Auto-trigger: $AUTO_TRIGGER"
    echo ""

    # Initialize rollback state
    local rollback_file=$(initialize_rollback)
    echo "Rollback state file: $rollback_file"

    # Set start time
    jq '.start_time = "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"' "$rollback_file" > "${rollback_file}.tmp" && mv "${rollback_file}.tmp" "$rollback_file"

    # Determine trigger type
    local trigger_type=$TRIGGER_MANUAL
    if [[ "$AUTO_TRIGGER" == "true" ]]; then
        trigger_type=$TRIGGER_AUTO
    fi
    jq --arg trigger "$trigger_type" '.trigger_type = $trigger' "$rollback_file" > "${rollback_file}.tmp" && mv "${rollback_file}.tmp" "$rollback_file"

    # Analyze deployment health
    if ! analyze_deployment_health "$rollback_file"; then
        if [[ "$AUTO_TRIGGER" == "false" ]]; then
            echo -e "${YELLOW}No critical issues found. Proceed with manual rollback? (y/N): ${NC}"
            read -r confirm
            if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
                echo "Rollback cancelled"
                exit 0
            fi
        else
            echo "No issues requiring rollback found"
            exit 0
        fi
    fi

    # Trigger rollback
    update_rollback_state "$rollback_file" "state" "$STATE_TRIGGERED"
    send_rollback_notification "$rollback_file" "triggered"

    # Create backup
    create_rollback_backup "$rollback_file"
    update_rollback_state "$rollback_file" "progress" "25"

    # Execute rollback
    if execute_rollback "$rollback_file"; then
        update_rollback_state "$rollback_file" "progress" "75"

        # Validate rollback
        if validate_rollback "$rollback_file"; then
            update_rollback_state "$rollback_file" "progress" "90"

            # Cleanup
            cleanup_rollback "$rollback_file"
            update_rollback_state "$rollback_file" "progress" "100"
            update_rollback_state "$rollback_file" "state" "$STATE_COMPLETED"

            # Set end time
            jq '.end_time = "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"' "$rollback_file" > "${rollback_file}.tmp" && mv "${rollback_file}.tmp" "$rollback_file"

            send_rollback_notification "$rollback_file" "completed"
            echo -e "${GREEN}✅ Rollback completed successfully!${NC}"
            exit 0
        else
            update_rollback_state "$rollback_file" "state" "$STATE_FAILED"
            send_rollback_notification "$rollback_file" "failed"
            echo -e "${RED}❌ Rollback validation failed${NC}"
            exit 1
        fi
    else
        update_rollback_state "$rollback_file" "state" "$STATE_FAILED"
        send_rollback_notification "$rollback_file" "failed"
        echo -e "${RED}❌ Rollback execution failed${NC}"
        exit 1
    fi
}

# Show usage
usage() {
    echo "Usage: $0 [deployment_id] [environment] [auto_trigger] [strategy]"
    echo ""
    echo "Arguments:"
    echo "  deployment_id    Deployment identifier (default: latest)"
    echo "  environment      Target environment (default: production)"
    echo "  auto_trigger     Auto-trigger rollback (default: false)"
    echo "  strategy         Rollback strategy: immediate, gradual, canary (default: immediate)"
    echo ""
    echo "Environment Variables:"
    echo "  ROLLBACK_WEBHOOK_URL    Webhook URL for rollback notifications"
    echo "  DB_HOST                  Database host"
    echo "  DB_USER                  Database user"
    echo "  DB_NAME                  Database name"
    echo ""
    echo "Examples:"
    echo "  $0 deploy_001 production false immediate"
    echo "  $0 latest staging true gradual"
    exit 1
}

# Check arguments
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    usage
fi

# Run main function
main "$@"