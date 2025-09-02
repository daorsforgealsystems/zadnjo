#!/bin/bash
# scripts/deployment-automation/pipeline-orchestrator.sh
# Deployment pipeline orchestration script

set -e

# Configuration
PIPELINE_CONFIG=${1:-config/pipeline-config.json}
ENVIRONMENT=${2:-staging}
AUTO_APPROVE=${3:-false}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Pipeline states
STATE_IDLE="idle"
STATE_RUNNING="running"
STATE_WAITING_APPROVAL="waiting_approval"
STATE_COMPLETED="completed"
STATE_FAILED="failed"
STATE_CANCELLED="cancelled"

# Pipeline tracking
PIPELINE_ID="pipeline_$(date +%Y%m%d_%H%M%S)"
START_TIME=$(date +%s)
LOG_FILE="/var/log/flowmotion/pipelines/${PIPELINE_ID}.log"
STATUS_FILE="/tmp/pipeline_status_${PIPELINE_ID}.json"

# Initialize logging
exec > >(tee -a "$LOG_FILE") 2>&1

echo -e "${PURPLE}🔄 Flow Motion Pipeline Orchestrator${NC}"
echo "Pipeline ID: $PIPELINE_ID"
echo "Environment: $ENVIRONMENT"
echo "Config: $PIPELINE_CONFIG"
echo "Auto-approve: $AUTO_APPROVE"
echo ""

# Default pipeline configuration
DEFAULT_CONFIG='{
  "name": "Flow Motion Deployment Pipeline",
  "environment": "'$ENVIRONMENT'",
  "stages": [
    {
      "name": "Code Quality",
      "type": "quality",
      "steps": [
        {"name": "Lint", "command": "npm run lint", "timeout": 300},
        {"name": "Type Check", "command": "npm run type-check", "timeout": 300},
        {"name": "Unit Tests", "command": "npm run test -- --run", "timeout": 600}
      ]
    },
    {
      "name": "Security Scan",
      "type": "security",
      "steps": [
        {"name": "Dependency Scan", "command": "./scripts/validation/security-scan.sh '$ENVIRONMENT' quick", "timeout": 600}
      ]
    },
    {
      "name": "Build",
      "type": "build",
      "steps": [
        {"name": "Build Frontend", "command": "npm run build:netlify", "timeout": 600},
        {"name": "Build Backend", "command": "docker build -t flowmotion/api-gateway:latest ./logi-core/apps/api-gateway/", "timeout": 900}
      ]
    },
    {
      "name": "Deploy",
      "type": "deploy",
      "requires_approval": true,
      "steps": [
        {"name": "Deploy to '$ENVIRONMENT'", "command": "./scripts/deployment-automation/one-click-deploy.sh '$ENVIRONMENT' full false", "timeout": 1800}
      ]
    },
    {
      "name": "Validation",
      "type": "validation",
      "steps": [
        {"name": "Smoke Tests", "command": "./scripts/validation/smoke-tests.sh '$ENVIRONMENT'", "timeout": 300},
        {"name": "Integration Tests", "command": "./scripts/validation/integration-tests.sh '$ENVIRONMENT'", "timeout": 600}
      ]
    }
  ]
}'

# Load pipeline configuration
load_config() {
    if [[ -f "$PIPELINE_CONFIG" ]]; then
        CONFIG=$(cat "$PIPELINE_CONFIG")
    else
        echo -e "${YELLOW}⚠️  Config file not found, using default configuration${NC}"
        CONFIG=$DEFAULT_CONFIG
    fi

    # Update environment in config
    CONFIG=$(echo "$CONFIG" | jq --arg env "$ENVIRONMENT" '.environment = $env')
}

# Initialize pipeline status
initialize_pipeline() {
    cat > "$STATUS_FILE" << EOF
{
  "pipeline_id": "$PIPELINE_ID",
  "name": $(echo "$CONFIG" | jq '.name'),
  "environment": "$ENVIRONMENT",
  "start_time": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "$STATE_RUNNING",
  "current_stage": null,
  "current_step": null,
  "stages": [],
  "approvals": [],
  "metadata": {
    "auto_approve": $AUTO_APPROVE,
    "user": "$(whoami)",
    "hostname": "$(hostname)"
  }
}
EOF

    # Initialize stages
    local stage_count=$(echo "$CONFIG" | jq '.stages | length')
    for ((i=0; i<stage_count; i++)); do
        local stage_name=$(echo "$CONFIG" | jq -r ".stages[$i].name")
        local stage_type=$(echo "$CONFIG" | jq -r ".stages[$i].type")
        local requires_approval=$(echo "$CONFIG" | jq -r ".stages[$i].requires_approval // false")

        jq --arg name "$stage_name" --arg type "$stage_type" --arg approval "$requires_approval" \
           '.stages += [{"name": $name, "type": $type, "status": "pending", "requires_approval": ($approval == "true"), "steps": []}]' \
           "$STATUS_FILE" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "$STATUS_FILE"
    done
}

# Update pipeline status
update_pipeline_status() {
    local field=$1
    local value=$2

    case $field in
        "status")
            jq --arg val "$value" '.status = $val' "$STATUS_FILE" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "$STATUS_FILE"
            ;;
        "current_stage")
            jq --arg val "$value" '.current_stage = $val' "$STATUS_FILE" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "$STATUS_FILE"
            ;;
        "current_step")
            jq --arg val "$value" '.current_step = $val' "$STATUS_FILE" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "$STATUS_FILE"
            ;;
    esac
}

# Update stage status
update_stage_status() {
    local stage_name=$1
    local status=$2
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)

    jq --arg stage "$stage_name" --arg status "$status" --arg ts "$timestamp" \
       '(.stages[] | select(.name == $stage) | .status) = $status | (.stages[] | select(.name == $stage) | .start_time //= $ts) | (.stages[] | select(.name == $stage) | .end_time = $ts)' \
       "$STATUS_FILE" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "$STATUS_FILE"
}

# Update step status
update_step_status() {
    local stage_name=$1
    local step_name=$2
    local status=$3
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)

    jq --arg stage "$stage_name" --arg step "$step_name" --arg status "$status" --arg ts "$timestamp" \
       '(.stages[] | select(.name == $stage) | .steps[] | select(.name == $step) | .status) = $status | (.stages[] | select(.name == $stage) | .steps[] | select(.name == $step) | .start_time //= $ts) | (.stages[] | select(.name == $stage) | .steps[] | select(.name == $step) | .end_time = $ts)' \
       "$STATUS_FILE" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "$STATUS_FILE"
}

# Execute step
execute_step() {
    local stage_name=$1
    local step_config=$2

    local step_name=$(echo "$step_config" | jq -r '.name')
    local command=$(echo "$step_config" | jq -r '.command')
    local timeout=$(echo "$step_config" | jq -r '.timeout // 300')

    echo -e "${BLUE}▶️  Executing step: $step_name${NC}"
    update_step_status "$stage_name" "$step_name" "running"
    update_pipeline_status "current_step" "$step_name"

    # Execute command with timeout
    if timeout $timeout bash -c "$command"; then
        echo -e "${GREEN}✅ Step completed: $step_name${NC}"
        update_step_status "$stage_name" "$step_name" "completed"
        return 0
    else
        local exit_code=$?
        echo -e "${RED}❌ Step failed: $step_name (exit code: $exit_code)${NC}"
        update_step_status "$stage_name" "$step_name" "failed"
        return 1
    fi
}

# Execute stage
execute_stage() {
    local stage_config=$1
    local stage_name=$(echo "$stage_config" | jq -r '.name')
    local requires_approval=$(echo "$stage_config" | jq -r '.requires_approval // false')

    echo -e "${BLUE}🚀 Executing stage: $stage_name${NC}"
    update_stage_status "$stage_name" "running"
    update_pipeline_status "current_stage" "$stage_name"

    # Check for approval if required
    if [[ "$requires_approval" == "true" && "$AUTO_APPROVE" != "true" ]]; then
        echo -e "${YELLOW}⏳ Stage requires approval: $stage_name${NC}"
        update_pipeline_status "status" "$STATE_WAITING_APPROVAL"

        if ! request_approval "$stage_name"; then
            echo -e "${RED}❌ Approval denied for stage: $stage_name${NC}"
            update_stage_status "$stage_name" "cancelled"
            return 1
        fi

        update_pipeline_status "status" "$STATE_RUNNING"
    fi

    # Execute steps
    local step_count=$(echo "$stage_config" | jq '.steps | length')
    for ((i=0; i<step_count; i++)); do
        local step_config=$(echo "$stage_config" | jq ".steps[$i]")

        # Add step to status if not already present
        local step_name=$(echo "$step_config" | jq -r '.name')
        if ! jq -e ".stages[] | select(.name == \"$stage_name\") | .steps[] | select(.name == \"$step_name\")" "$STATUS_FILE" >/dev/null 2>&1; then
            jq --arg stage "$stage_name" --arg step "$step_name" \
               '(.stages[] | select(.name == $stage) | .steps) += [{"name": $step, "status": "pending"}]' \
               "$STATUS_FILE" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "$STATUS_FILE"
        fi

        if ! execute_step "$stage_name" "$step_config"; then
            update_stage_status "$stage_name" "failed"
            return 1
        fi
    done

    echo -e "${GREEN}✅ Stage completed: $stage_name${NC}"
    update_stage_status "$stage_name" "completed"
    return 0
}

# Request approval
request_approval() {
    local stage_name=$1

    echo "Approval required for stage: $stage_name"
    echo "Pipeline: $PIPELINE_ID"
    echo "Environment: $ENVIRONMENT"
    echo ""

    if [[ -n "$APPROVAL_WEBHOOK" ]]; then
        # Send approval request
        local payload=$(cat <<EOF
{
    "text": "Pipeline approval required",
    "attachments": [
        {
            "color": "warning",
            "title": "Pipeline Approval Required",
            "fields": [
                {
                    "title": "Pipeline ID",
                    "value": "$PIPELINE_ID",
                    "short": true
                },
                {
                    "title": "Stage",
                    "value": "$stage_name",
                    "short": true
                },
                {
                    "title": "Environment",
                    "value": "$ENVIRONMENT",
                    "short": true
                }
            ],
            "actions": [
                {
                    "type": "button",
                    "text": "Approve",
                    "style": "primary",
                    "url": "https://your-approval-system.com/approve/$PIPELINE_ID"
                },
                {
                    "type": "button",
                    "text": "Reject",
                    "style": "danger",
                    "url": "https://your-approval-system.com/reject/$PIPELINE_ID"
                }
            ]
        }
    ]
}
EOF
        )

        curl -s -X POST -H 'Content-type: application/json' --data "$payload" "$APPROVAL_WEBHOOK" || true
    fi

    # For now, auto-approve if AUTO_APPROVE is true
    if [[ "$AUTO_APPROVE" == "true" ]]; then
        echo -e "${GREEN}✅ Auto-approved stage: $stage_name${NC}"
        return 0
    fi

    # Manual approval (in real implementation, this would wait for external approval)
    echo "Please approve or reject the stage..."
    echo "Press 'y' to approve, 'n' to reject:"
    read -r approval

    if [[ "$approval" == "y" || "$approval" == "Y" ]]; then
        return 0
    else
        return 1
    fi
}

# Generate pipeline report
generate_report() {
    local report_file="/tmp/pipeline_report_${PIPELINE_ID}.html"
    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))

    echo -e "${BLUE}📊 Generating pipeline report...${NC}"

    # Update final status
    jq --arg end_ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
       --arg duration "$duration" \
       '.end_time = $end_ts | .duration = $duration' \
       "$STATUS_FILE" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "$STATUS_FILE"

    # Generate HTML report
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Pipeline Execution Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .stage { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .completed { background-color: #d4edda; border-color: #c3e6cb; }
        .failed { background-color: #f8d7da; border-color: #f5c6cb; }
        .running { background-color: #d1ecf1; border-color: #bee5eb; }
        .pending { background-color: #fff3cd; border-color: #ffeaa7; }
        .step { margin: 5px 0; padding: 5px; background: #f9f9f9; border-radius: 3px; }
    </style>
</head>
<body>
    <h1>Pipeline Execution Report</h1>

    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Pipeline ID:</strong> $PIPELINE_ID</p>
        <p><strong>Name:</strong> $(jq -r '.name' "$STATUS_FILE")</p>
        <p><strong>Environment:</strong> $ENVIRONMENT</p>
        <p><strong>Status:</strong> $(jq -r '.status' "$STATUS_FILE")</p>
        <p><strong>Duration:</strong> ${duration}s</p>
        <p><strong>Start Time:</strong> $(jq -r '.start_time' "$STATUS_FILE")</p>
        <p><strong>End Time:</strong> $(jq -r '.end_time // "N/A"' "$STATUS_FILE")</p>
    </div>

    <h2>Stages</h2>
EOF

    # Add stage details
    local stage_count=$(jq '.stages | length' "$STATUS_FILE")
    for ((i=0; i<stage_count; i++)); do
        local stage=$(jq ".stages[$i]" "$STATUS_FILE")
        local stage_name=$(echo "$stage" | jq -r '.name')
        local stage_status=$(echo "$stage" | jq -r '.status')
        local step_count=$(echo "$stage" | jq '.steps | length')

        cat >> "$report_file" << EOF
    <div class="stage $stage_status">
        <h3>$stage_name</h3>
        <p><strong>Status:</strong> $stage_status</p>
        <p><strong>Steps:</strong> $step_count</p>
EOF

        for ((j=0; j<step_count; j++)); do
            local step=$(echo "$stage" | jq ".steps[$j]")
            local step_name=$(echo "$step" | jq -r '.name')
            local step_status=$(echo "$step" | jq -r '.status')

            cat >> "$report_file" << EOF
        <div class="step $step_status">
            <strong>$step_name:</strong> $step_status
        </div>
EOF
        done

        cat >> "$report_file" << EOF
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

    if [[ -n "$PIPELINE_WEBHOOK" ]]; then
        local color="good"
        [[ "$status" == "failed" ]] && color="danger"
        [[ "$status" == "cancelled" ]] && color="warning"

        local payload=$(cat <<EOF
{
    "attachments": [
        {
            "color": "$color",
            "title": "Pipeline $status",
            "fields": [
                {
                    "title": "Pipeline ID",
                    "value": "$PIPELINE_ID",
                    "short": true
                },
                {
                    "title": "Environment",
                    "value": "$ENVIRONMENT",
                    "short": true
                },
                {
                    "title": "Status",
                    "value": "$status",
                    "short": true
                },
                {
                    "title": "Duration",
                    "value": "$(( ($(date +%s) - START_TIME) ))s",
                    "short": true
                }
            ],
            "text": "$message",
            "footer": "Flow Motion Pipeline Orchestrator",
            "ts": $(date +%s)
        }
    ]
}
EOF
        )

        curl -s -X POST -H 'Content-type: application/json' --data "$payload" "$PIPELINE_WEBHOOK" || true
    fi
}

# Main pipeline execution
main() {
    # Load configuration
    load_config

    # Initialize pipeline
    initialize_pipeline

    # Execute stages
    local stage_count=$(echo "$CONFIG" | jq '.stages | length')
    local pipeline_success=true

    for ((i=0; i<stage_count; i++)); do
        local stage_config=$(echo "$CONFIG" | jq ".stages[$i]")

        if ! execute_stage "$stage_config"; then
            pipeline_success=false
            update_pipeline_status "status" "$STATE_FAILED"
            break
        fi
    done

    # Generate report
    generate_report

    # Finalize pipeline
    if $pipeline_success; then
        update_pipeline_status "status" "$STATE_COMPLETED"
        echo -e "${GREEN}🎉 Pipeline completed successfully!${NC}"
        send_notification "completed" "Pipeline completed successfully"
    else
        echo -e "${RED}❌ Pipeline failed${NC}"
        send_notification "failed" "Pipeline execution failed"
        exit 1
    fi
}

# Show usage
usage() {
    echo "Usage: $0 [config_file] [environment] [auto_approve]"
    echo ""
    echo "Arguments:"
    echo "  config_file    Pipeline configuration file (default: config/pipeline-config.json)"
    echo "  environment    Target environment (default: staging)"
    echo "  auto_approve   Auto-approve stages requiring approval (default: false)"
    echo ""
    echo "Examples:"
    echo "  $0 config/production-pipeline.json production true"
    echo "  $0 config/staging-pipeline.json staging false"
    echo ""
    echo "Environment Variables:"
    echo "  PIPELINE_WEBHOOK      Webhook URL for pipeline notifications"
    echo "  APPROVAL_WEBHOOK      Webhook URL for approval requests"
    exit 1
}

# Check arguments
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    usage
fi

# Create log directory
mkdir -p "/var/log/flowmotion/pipelines"

# Run main pipeline
main