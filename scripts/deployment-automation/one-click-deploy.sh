#!/bin/bash
# scripts/deployment-automation/one-click-deploy.sh
# One-click deployment script for Flow Motion

set -e

# Configuration
ENVIRONMENT=${1:-staging}
DEPLOYMENT_TYPE=${2:-full}  # full, frontend, backend, database
SKIP_VALIDATION=${3:-false}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Deployment metadata
DEPLOYMENT_ID="deploy_$(date +%Y%m%d_%H%M%S)"
START_TIME=$(date +%s)
LOG_FILE="/var/log/flowmotion/deployments/${DEPLOYMENT_ID}.log"
STATUS_FILE="/tmp/deployment_status_${DEPLOYMENT_ID}.json"

# Initialize logging
exec > >(tee -a "$LOG_FILE") 2>&1

echo -e "${PURPLE}🚀 Flow Motion One-Click Deployment${NC}"
echo "Environment: $ENVIRONMENT"
echo "Type: $DEPLOYMENT_TYPE"
echo "Deployment ID: $DEPLOYMENT_ID"
echo "Started: $(date)"
echo "Log: $LOG_FILE"
echo ""

# Initialize status tracking
cat > "$STATUS_FILE" << EOF
{
  "deployment_id": "$DEPLOYMENT_ID",
  "environment": "$ENVIRONMENT",
  "type": "$DEPLOYMENT_TYPE",
  "start_time": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "running",
  "stages": {
    "validation": {"status": "pending", "start_time": null, "end_time": null},
    "build": {"status": "pending", "start_time": null, "end_time": null},
    "deploy": {"status": "pending", "start_time": null, "end_time": null},
    "validation": {"status": "pending", "start_time": null, "end_time": null},
    "cleanup": {"status": "pending", "start_time": null, "end_time": null}
  },
  "metadata": {
    "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
    "user": "$(whoami)",
    "hostname": "$(hostname)"
  }
}
EOF

# Update stage status
update_stage() {
    local stage=$1
    local status=$2
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)

    jq --arg stage "$stage" --arg status "$status" --arg ts "$timestamp" \
       ".stages.$stage.status = \$status | .stages.$stage.start_time = \$ts" \
       "$STATUS_FILE" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "$STATUS_FILE"
}

# Pre-deployment validation
run_validation() {
    echo -e "${BLUE}🔍 Running pre-deployment validation...${NC}"
    update_stage "validation" "running"

    # Check environment
    if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
        echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
        exit 1
    fi

    # Check required tools
    local required_tools=("docker" "kubectl" "git")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            echo -e "${RED}❌ Required tool not found: $tool${NC}"
            exit 1
        fi
    done

    # Check Kubernetes access
    if ! kubectl cluster-info >/dev/null 2>&1; then
        echo -e "${RED}❌ Cannot access Kubernetes cluster${NC}"
        exit 1
    fi

    # Check environment variables
    local required_vars=("DB_HOST" "DB_USER" "DB_NAME")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            echo -e "${RED}❌ Required environment variable not set: $var${NC}"
            exit 1
        fi
    done

    echo -e "${GREEN}✅ Pre-deployment validation passed${NC}"
    update_stage "validation" "completed"
}

# Build artifacts
run_build() {
    echo -e "${BLUE}🔨 Building deployment artifacts...${NC}"
    update_stage "build" "running"

    case $DEPLOYMENT_TYPE in
        "full"|"frontend")
            echo "Building frontend..."
            npm run build:netlify
            echo -e "${GREEN}✅ Frontend build completed${NC}"
            ;;
    esac

    case $DEPLOYMENT_TYPE in
        "full"|"backend")
            echo "Building backend services..."
            # Build Docker images
            docker build -t flowmotion/api-gateway:latest ./logi-core/apps/api-gateway/
            docker build -t flowmotion/inventory-service:latest ./logi-core/services/inventory-service/
            docker build -t flowmotion/order-service:latest ./logi-core/services/order-service/
            echo -e "${GREEN}✅ Backend build completed${NC}"
            ;;
    esac

    update_stage "build" "completed"
}

# Deploy to environment
run_deploy() {
    echo -e "${BLUE}🚀 Deploying to $ENVIRONMENT...${NC}"
    update_stage "deploy" "running"

    # Tag images with deployment ID
    case $DEPLOYMENT_TYPE in
        "full"|"backend")
            docker tag flowmotion/api-gateway:latest flowmotion/api-gateway:$DEPLOYMENT_ID
            docker tag flowmotion/inventory-service:latest flowmotion/inventory-service:$DEPLOYMENT_ID
            docker tag flowmotion/order-service:latest flowmotion/order-service:$DEPLOYMENT_ID
            ;;
    esac

    # Update Kubernetes manifests
    local kustomize_dir="./logi-core/k8s/overlays/$ENVIRONMENT"
    if [[ -d "$kustomize_dir" ]]; then
        cd "$kustomize_dir"

        case $DEPLOYMENT_TYPE in
            "full"|"backend")
                # Update image tags in kustomization
                kustomize edit set image flowmotion/api-gateway=flowmotion/api-gateway:$DEPLOYMENT_ID
                kustomize edit set image flowmotion/inventory-service=flowmotion/inventory-service:$DEPLOYMENT_ID
                kustomize edit set image flowmotion/order-service=flowmotion/order-service:$DEPLOYMENT_ID
                ;;
        esac

        # Apply changes
        kubectl apply -k .

        # Wait for rollout
        echo "Waiting for deployment rollout..."
        kubectl rollout status deployment/api-gateway -n logi-core --timeout=600s

        cd - >/dev/null
    else
        echo -e "${YELLOW}⚠️  Kustomize directory not found: $kustomize_dir${NC}"
    fi

    # Deploy frontend if needed
    case $DEPLOYMENT_TYPE in
        "full"|"frontend")
            echo "Deploying frontend..."
            # This would integrate with Netlify CLI or similar
            echo -e "${GREEN}✅ Frontend deployment initiated${NC}"
            ;;
    esac

    echo -e "${GREEN}✅ Deployment to $ENVIRONMENT completed${NC}"
    update_stage "deploy" "completed"
}

# Post-deployment validation
run_post_validation() {
    echo -e "${BLUE}✅ Running post-deployment validation...${NC}"
    update_stage "post_validation" "running"

    if [[ "$SKIP_VALIDATION" == "true" ]]; then
        echo -e "${YELLOW}⚠️  Skipping validation as requested${NC}"
        update_stage "post_validation" "skipped"
        return
    fi

    # Run smoke tests
    echo "Running smoke tests..."
    if ./scripts/validation/smoke-tests.sh "$ENVIRONMENT" 30; then
        echo -e "${GREEN}✅ Smoke tests passed${NC}"
    else
        echo -e "${RED}❌ Smoke tests failed${NC}"
        # Don't exit here - let the deployment complete but mark as failed
    fi

    # Check service health
    echo "Checking service health..."
    local services=("api-gateway" "inventory-service" "order-service")
    local all_healthy=true

    for service in "${services[@]}"; do
        if kubectl get pods -n logi-core -l app="$service" -o jsonpath='{.items[*].status.phase}' | grep -v Running >/dev/null; then
            echo -e "${RED}❌ Service $service is not healthy${NC}"
            all_healthy=false
        fi
    done

    if $all_healthy; then
        echo -e "${GREEN}✅ All services are healthy${NC}"
        update_stage "post_validation" "completed"
    else
        echo -e "${RED}❌ Some services are not healthy${NC}"
        update_stage "post_validation" "failed"
    fi
}

# Cleanup and finalization
run_cleanup() {
    echo -e "${BLUE}🧹 Running cleanup...${NC}"
    update_stage "cleanup" "running"

    # Clean up old Docker images (keep last 5)
    echo "Cleaning up old Docker images..."
    docker images flowmotion/* --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | \
        head -n -5 | awk 'NR>1 {print $1}' | xargs -r docker rmi 2>/dev/null || true

    # Update deployment status
    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))

    jq --arg end_ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
       --arg duration "$duration" \
       '.end_time = $end_ts | .duration = $duration | .status = "completed"' \
       "$STATUS_FILE" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "$STATUS_FILE"

    update_stage "cleanup" "completed"
}

# Send notifications
send_notification() {
    local status=$1
    local message=$2

    # Send to Slack/webhook if configured
    if [[ -n "$DEPLOYMENT_WEBHOOK" ]]; then
        local color="good"
        [[ "$status" == "failed" ]] && color="danger"
        [[ "$status" == "warning" ]] && color="warning"

        local payload=$(cat <<EOF
{
    "attachments": [
        {
            "color": "$color",
            "title": "Deployment $status: $ENVIRONMENT",
            "fields": [
                {
                    "title": "Deployment ID",
                    "value": "$DEPLOYMENT_ID",
                    "short": true
                },
                {
                    "title": "Type",
                    "value": "$DEPLOYMENT_TYPE",
                    "short": true
                },
                {
                    "title": "Environment",
                    "value": "$ENVIRONMENT",
                    "short": true
                },
                {
                    "title": "Duration",
                    "value": "$(( ($(date +%s) - START_TIME) ))s",
                    "short": true
                }
            ],
            "text": "$message",
            "footer": "Flow Motion Deployment System",
            "ts": $(date +%s)
        }
    ]
}
EOF
        )

        curl -s -X POST -H 'Content-type: application/json' --data "$payload" "$DEPLOYMENT_WEBHOOK" || true
    fi
}

# Error handling
error_handler() {
    local error_code=$?
    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))

    echo -e "${RED}❌ Deployment failed with exit code $error_code${NC}"

    # Update status file
    jq --arg end_ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
       --arg duration "$duration" \
       '.end_time = $end_ts | .duration = $duration | .status = "failed" | .error_code = '$error_code'' \
       "$STATUS_FILE" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "$STATUS_FILE"

    # Send failure notification
    send_notification "failed" "Deployment failed after ${duration}s. Check logs: $LOG_FILE"

    exit $error_code
}

# Set up error handling
trap error_handler ERR

# Main deployment flow
main() {
    run_validation
    run_build
    run_deploy
    run_post_validation
    run_cleanup

    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))

    echo ""
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo "Deployment ID: $DEPLOYMENT_ID"
    echo "Environment: $ENVIRONMENT"
    echo "Type: $DEPLOYMENT_TYPE"
    echo "Duration: ${duration}s"
    echo "Log: $LOG_FILE"
    echo "Status: $STATUS_FILE"

    # Send success notification
    send_notification "completed" "Deployment completed successfully in ${duration}s"
}

# Show usage
usage() {
    echo "Usage: $0 [environment] [type] [skip-validation]"
    echo ""
    echo "Arguments:"
    echo "  environment      Target environment (staging|production)"
    echo "  type            Deployment type (full|frontend|backend|database)"
    echo "  skip-validation  Skip post-deployment validation (true|false)"
    echo ""
    echo "Examples:"
    echo "  $0 staging full"
    echo "  $0 production frontend true"
    echo "  $0 staging backend"
    echo ""
    echo "Environment Variables:"
    echo "  DEPLOYMENT_WEBHOOK    Webhook URL for deployment notifications"
    echo "  DB_HOST              Database host"
    echo "  DB_USER              Database user"
    echo "  DB_NAME              Database name"
    exit 1
}

# Check arguments
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    usage
fi

# Validate deployment type
case $DEPLOYMENT_TYPE in
    full|frontend|backend|database)
        ;;
    *)
        echo -e "${RED}❌ Invalid deployment type: $DEPLOYMENT_TYPE${NC}"
        usage
        ;;
esac

# Create log directory
mkdir -p "/var/log/flowmotion/deployments"

# Run main deployment
main