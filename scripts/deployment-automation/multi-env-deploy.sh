#!/bin/bash
# scripts/deployment-automation/multi-env-deploy.sh
# Multi-environment deployment management script

set -e

# Configuration
SOURCE_ENV=${1:-staging}
TARGET_ENVS=${2:-production}
DEPLOYMENT_TYPE=${3:-full}
PARALLEL=${4:-false}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Environment configurations
declare -A ENV_CONFIGS=(
    ["dev"]="https://dev-api.yourdomain.com dev-k8s-context"
    ["staging"]="https://staging-api.yourdomain.com staging-k8s-context"
    ["production"]="https://api.yourdomain.com prod-k8s-context"
)

# Deployment tracking
DEPLOYMENT_ID="multi_deploy_$(date +%Y%m%d_%H%M%S)"
START_TIME=$(date +%s)
LOG_FILE="/var/log/flowmotion/multi_deployments/${DEPLOYMENT_ID}.log"
STATUS_FILE="/tmp/multi_deployment_status_${DEPLOYMENT_ID}.json"

# Initialize logging
exec > >(tee -a "$LOG_FILE") 2>&1

echo -e "${PURPLE}🚀 Multi-Environment Deployment${NC}"
echo "Source Environment: $SOURCE_ENV"
echo "Target Environments: $TARGET_ENVS"
echo "Type: $DEPLOYMENT_TYPE"
echo "Parallel: $PARALLEL"
echo "Deployment ID: $DEPLOYMENT_ID"
echo ""

# Initialize status tracking
cat > "$STATUS_FILE" << EOF
{
  "deployment_id": "$DEPLOYMENT_ID",
  "source_env": "$SOURCE_ENV",
  "target_envs": "$TARGET_ENVS",
  "type": "$DEPLOYMENT_TYPE",
  "parallel": $PARALLEL,
  "start_time": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "running",
  "environments": {},
  "summary": {"total": 0, "successful": 0, "failed": 0, "pending": 0}
}
EOF

# Parse target environments
parse_target_envs() {
    local envs=$1
    local parsed_envs=()

    if [[ "$envs" == "all" ]]; then
        parsed_envs=("staging" "production")
    elif [[ "$envs" == "production" ]]; then
        parsed_envs=("production")
    elif [[ "$envs" == "staging" ]]; then
        parsed_envs=("staging")
    else
        # Parse comma-separated list
        IFS=',' read -ra parsed_envs <<< "$envs"
    fi

    echo "${parsed_envs[@]}"
}

# Validate environments
validate_environments() {
    local source=$1
    local targets=($2)

    echo -e "${BLUE}🔍 Validating environments...${NC}"

    # Validate source environment
    if [[ ! -v ENV_CONFIGS[$source] ]]; then
        echo -e "${RED}❌ Invalid source environment: $source${NC}"
        exit 1
    fi

    # Validate target environments
    for env in "${targets[@]}"; do
        if [[ ! -v ENV_CONFIGS[$env] ]]; then
            echo -e "${RED}❌ Invalid target environment: $env${NC}"
            exit 1
        fi

        # Initialize environment status
        jq --arg env "$env" '.environments[$env] = {"status": "pending", "start_time": null, "end_time": null, "error": null}' \
           "$STATUS_FILE" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "$STATUS_FILE"
    done

    # Update summary
    local total=${#targets[@]}
    jq --arg total "$total" '.summary.total = ($total | tonumber) | .summary.pending = ($total | tonumber)' \
       "$STATUS_FILE" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "$STATUS_FILE"

    echo -e "${GREEN}✅ Environment validation completed${NC}"
}

# Check deployment readiness
check_readiness() {
    local env=$1
    local api_url=$(echo "${ENV_CONFIGS[$env]}" | cut -d' ' -f1)
    local k8s_context=$(echo "${ENV_CONFIGS[$env]}" | cut -d' ' -f2)

    echo -e "${BLUE}🔍 Checking readiness for $env...${NC}"

    # Switch Kubernetes context
    kubectl config use-context "$k8s_context" 2>/dev/null || {
        echo -e "${YELLOW}⚠️  Could not switch to context $k8s_context${NC}"
    }

    # Check API health
    if curl -f -s --max-time 10 "$api_url/health" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $env API is healthy${NC}"
        return 0
    else
        echo -e "${RED}❌ $env API is not healthy${NC}"
        return 1
    fi
}

# Deploy to single environment
deploy_to_env() {
    local env=$1
    local api_url=$(echo "${ENV_CONFIGS[$env]}" | cut -d' ' -f1)
    local k8s_context=$(echo "${ENV_CONFIGS[$env]}" | cut -d' ' -f2)

    echo -e "${BLUE}🚀 Starting deployment to $env...${NC}"

    # Update status
    jq --arg env "$env" --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
       '.environments[$env].status = "running" | .environments[$env].start_time = $ts' \
       "$STATUS_FILE" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "$STATUS_FILE"

    # Switch context
    kubectl config use-context "$k8s_context" 2>/dev/null || true

    # Run deployment
    if ./scripts/deployment-automation/one-click-deploy.sh "$env" "$DEPLOYMENT_TYPE" false; then
        echo -e "${GREEN}✅ Deployment to $env completed successfully${NC}"

        # Update status
        jq --arg env "$env" --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
           '.environments[$env].status = "completed" | .environments[$env].end_time = $ts' \
           "$STATUS_FILE" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "$STATUS_FILE"

        return 0
    else
        local error="Deployment failed"
        echo -e "${RED}❌ Deployment to $env failed${NC}"

        # Update status
        jq --arg env "$env" --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg error "$error" \
           '.environments[$env].status = "failed" | .environments[$env].end_time = $ts | .environments[$env].error = $error' \
           "$STATUS_FILE" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "$STATUS_FILE"

        return 1
    fi
}

# Sequential deployment
deploy_sequential() {
    local targets=($1)
    local failed_envs=()

    for env in "${targets[@]}"; do
        if ! deploy_to_env "$env"; then
            failed_envs+=("$env")
        fi
    done

    # Return failure if any environment failed
    if [[ ${#failed_envs[@]} -gt 0 ]]; then
        echo -e "${RED}❌ Failed environments: ${failed_envs[*]}${NC}"
        return 1
    fi

    return 0
}

# Parallel deployment
deploy_parallel() {
    local targets=($1)
    local pids=()
    local failed_envs=()

    # Start deployments in parallel
    for env in "${targets[@]}"; do
        deploy_to_env "$env" &
        pids+=($!)
    done

    # Wait for all deployments to complete
    for pid in "${pids[@]}"; do
        if ! wait "$pid"; then
            failed_envs+=("PID:$pid")
        fi
    done

    # Check final status
    for env in "${targets[@]}"; do
        local status=$(jq -r ".environments.$env.status" "$STATUS_FILE")
        if [[ "$status" != "completed" ]]; then
            failed_envs+=("$env")
        fi
    done

    if [[ ${#failed_envs[@]} -gt 0 ]]; then
        echo -e "${RED}❌ Failed environments: ${failed_envs[*]}${NC}"
        return 1
    fi

    return 0
}

# Generate deployment report
generate_report() {
    local report_file="/tmp/multi_deployment_report_${DEPLOYMENT_ID}.html"

    echo -e "${BLUE}📊 Generating deployment report...${NC}"

    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))

    # Update final status
    jq --arg end_ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
       --arg duration "$duration" \
       '.end_time = $end_ts | .duration = $duration' \
       "$STATUS_FILE" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "$STATUS_FILE"

    # Calculate summary
    local successful=$(jq '.environments | map(select(.status == "completed")) | length' "$STATUS_FILE")
    local failed=$(jq '.environments | map(select(.status == "failed")) | length' "$STATUS_FILE")

    jq --arg successful "$successful" --arg failed "$failed" \
       '.summary.successful = ($successful | tonumber) | .summary.failed = ($failed | tonumber)' \
       "$STATUS_FILE" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "$STATUS_FILE"

    # Generate HTML report
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Multi-Environment Deployment Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .environment { border: 1px solid #ddd; margin: 10px 0; padding: 10px; border-radius: 5px; }
        .completed { background-color: #d4edda; border-color: #c3e6cb; }
        .failed { background-color: #f8d7da; border-color: #f5c6cb; }
        .running { background-color: #d1ecf1; border-color: #bee5eb; }
        .pending { background-color: #fff3cd; border-color: #ffeaa7; }
    </style>
</head>
<body>
    <h1>Multi-Environment Deployment Report</h1>

    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Deployment ID:</strong> $DEPLOYMENT_ID</p>
        <p><strong>Source Environment:</strong> $SOURCE_ENV</p>
        <p><strong>Target Environments:</strong> $TARGET_ENVS</p>
        <p><strong>Type:</strong> $DEPLOYMENT_TYPE</p>
        <p><strong>Parallel:</strong> $PARALLEL</p>
        <p><strong>Start Time:</strong> $(jq -r '.start_time' "$STATUS_FILE")</p>
        <p><strong>Duration:</strong> ${duration}s</p>
        <p><strong>Successful:</strong> $successful</p>
        <p><strong>Failed:</strong> $failed</p>
    </div>

    <h2>Environment Details</h2>
EOF

    # Add environment details
    jq -r '.environments | to_entries[] | @text "\(.key) \(.value.status) \(.value.start_time) \(.value.end_time)"' "$STATUS_FILE" | while read -r env status start_time end_time; do
        cat >> "$report_file" << EOF
    <div class="environment $status">
        <h3>$env</h3>
        <p><strong>Status:</strong> $status</p>
        <p><strong>Start Time:</strong> $start_time</p>
        <p><strong>End Time:</strong> $end_time</p>
    </div>
EOF
    done

    cat >> "$report_file" << EOF
</body>
</html>
EOF

    echo -e "${GREEN}✅ Report generated: $report_file${NC}"
}

# Send notifications
send_notification() {
    local status=$1
    local message=$2

    if [[ -n "$MULTI_DEPLOY_WEBHOOK" ]]; then
        local color="good"
        [[ "$status" == "failed" ]] && color="danger"
        [[ "$status" == "warning" ]] && color="warning"

        local successful=$(jq '.summary.successful' "$STATUS_FILE")
        local failed=$(jq '.summary.failed' "$STATUS_FILE")
        local total=$(jq '.summary.total' "$STATUS_FILE")

        local payload=$(cat <<EOF
{
    "attachments": [
        {
            "color": "$color",
            "title": "Multi-Environment Deployment $status",
            "fields": [
                {
                    "title": "Deployment ID",
                    "value": "$DEPLOYMENT_ID",
                    "short": true
                },
                {
                    "title": "Source",
                    "value": "$SOURCE_ENV",
                    "short": true
                },
                {
                    "title": "Targets",
                    "value": "$TARGET_ENVS",
                    "short": true
                },
                {
                    "title": "Successful",
                    "value": "$successful/$total",
                    "short": true
                },
                {
                    "title": "Failed",
                    "value": "$failed",
                    "short": true
                }
            ],
            "text": "$message",
            "footer": "Flow Motion Multi-Environment Deployment",
            "ts": $(date +%s)
        }
    ]
}
EOF
        )

        curl -s -X POST -H 'Content-type: application/json' --data "$payload" "$MULTI_DEPLOY_WEBHOOK" || true
    fi
}

# Main function
main() {
    # Parse target environments
    local target_envs=($(parse_target_envs "$TARGET_ENVS"))

    # Validate environments
    validate_environments "$SOURCE_ENV" "${target_envs[*]}"

    # Check readiness for all environments
    local ready_envs=()
    for env in "${target_envs[@]}"; do
        if check_readiness "$env"; then
            ready_envs+=("$env")
        fi
    done

    if [[ ${#ready_envs[@]} -eq 0 ]]; then
        echo -e "${RED}❌ No environments are ready for deployment${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Ready environments: ${ready_envs[*]}${NC}"

    # Execute deployment
    local deployment_success=true

    if [[ "$PARALLEL" == "true" ]]; then
        if ! deploy_parallel "${ready_envs[*]}"; then
            deployment_success=false
        fi
    else
        if ! deploy_sequential "${ready_envs[*]}"; then
            deployment_success=false
        fi
    fi

    # Generate report
    generate_report

    # Send notification
    if $deployment_success; then
        echo -e "${GREEN}🎉 Multi-environment deployment completed successfully!${NC}"
        send_notification "completed" "Multi-environment deployment completed successfully"
    else
        echo -e "${RED}❌ Multi-environment deployment completed with failures${NC}"
        send_notification "failed" "Multi-environment deployment completed with failures"
        exit 1
    fi
}

# Show usage
usage() {
    echo "Usage: $0 [source_env] [target_envs] [type] [parallel]"
    echo ""
    echo "Arguments:"
    echo "  source_env      Source environment (dev|staging)"
    echo "  target_envs     Target environments (staging|production|all|env1,env2)"
    echo "  type           Deployment type (full|frontend|backend|database)"
    echo "  parallel       Run deployments in parallel (true|false)"
    echo ""
    echo "Examples:"
    echo "  $0 staging production full false"
    echo "  $0 dev 'staging,production' backend true"
    echo "  $0 staging all full true"
    echo ""
    echo "Environment Variables:"
    echo "  MULTI_DEPLOY_WEBHOOK    Webhook URL for deployment notifications"
    exit 1
}

# Check arguments
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    usage
fi

# Create log directory
mkdir -p "/var/log/flowmotion/multi_deployments"

# Run main deployment
main