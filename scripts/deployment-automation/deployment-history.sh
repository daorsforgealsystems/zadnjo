#!/bin/bash
# scripts/deployment-automation/deployment-history.sh
# Deployment history tracking script

set -e

# Configuration
ACTION=${1:-list}        # list, search, stats, cleanup
FILTER=${2:-}           # Filter criteria
OUTPUT_FORMAT=${3:-console} # console, json, csv

# History database location
HISTORY_DB="/var/log/flowmotion/deployment_history.db"
HISTORY_DIR="/var/log/flowmotion/history"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Create history directory
mkdir -p "$HISTORY_DIR"

# Initialize history database if it doesn't exist
init_history_db() {
    if [[ ! -f "$HISTORY_DB" ]]; then
        cat > "$HISTORY_DB" << EOF
{
  "version": "1.0",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "deployments": []
}
EOF
    fi
}

# Record deployment in history
record_deployment() {
    local deployment_id=$1
    local environment=$2
    local type=$3
    local status=$4
    local duration=${5:-0}
    local user=${6:-$(whoami)}
    local git_commit=${7:-$(git rev-parse HEAD 2>/dev/null || echo 'unknown')}
    local git_branch=${8:-$(git branch --show-current 2>/dev/null || echo 'unknown')}

    init_history_db

    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)

    # Create deployment record
    local record=$(cat << EOF
{
  "id": "$deployment_id",
  "timestamp": "$timestamp",
  "environment": "$environment",
  "type": "$type",
  "status": "$status",
  "duration": $duration,
  "user": "$user",
  "git_commit": "$git_commit",
  "git_branch": "$git_branch",
  "artifacts": [],
  "validations": [],
  "rollback_info": null
}
EOF
    )

    # Add to history database
    jq --argjson record "$record" '.deployments += [$record]' "$HISTORY_DB" > "${HISTORY_DB}.tmp" && mv "${HISTORY_DB}.tmp" "$HISTORY_DB"

    # Create individual deployment file
    echo "$record" > "$HISTORY_DIR/${deployment_id}.json"

    echo -e "${GREEN}✅ Deployment recorded: $deployment_id${NC}"
}

# Update deployment record
update_deployment() {
    local deployment_id=$1
    local field=$2
    local value=$3

    if [[ ! -f "$HISTORY_DIR/${deployment_id}.json" ]]; then
        echo -e "${RED}❌ Deployment not found: $deployment_id${NC}"
        return 1
    fi

    # Update individual file
    jq --arg val "$value" ".$field = \$val" "$HISTORY_DIR/${deployment_id}.json" > "${HISTORY_DIR}/${deployment_id}.json.tmp" && mv "${HISTORY_DIR}/${deployment_id}.json.tmp" "$HISTORY_DIR/${deployment_id}.json"

    # Update main database
    jq --arg id "$deployment_id" --arg val "$value" '(.deployments[] | select(.id == $id) | .'$field') = $val' "$HISTORY_DB" > "${HISTORY_DB}.tmp" && mv "${HISTORY_DB}.tmp" "$HISTORY_DB"

    echo -e "${GREEN}✅ Deployment updated: $deployment_id ($field = $value)${NC}"
}

# Add artifact to deployment
add_artifact() {
    local deployment_id=$1
    local artifact_name=$2
    local artifact_path=$3
    local artifact_size=${4:-0}

    local artifact_record=$(cat << EOF
{
  "name": "$artifact_name",
  "path": "$artifact_path",
  "size": $artifact_size,
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
    )

    update_deployment "$deployment_id" "artifacts" "$(jq '.artifacts + ['$artifact_record']' "$HISTORY_DIR/${deployment_id}.json")"
}

# Add validation result to deployment
add_validation() {
    local deployment_id=$1
    local validation_type=$2
    local validation_status=$3
    local validation_duration=${4:-0}

    local validation_record=$(cat << EOF
{
  "type": "$validation_type",
  "status": "$validation_status",
  "duration": $validation_duration,
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
    )

    update_deployment "$deployment_id" "validations" "$(jq '.validations + ['$validation_record']' "$HISTORY_DIR/${deployment_id}.json")"
}

# List deployments
list_deployments() {
    local limit=${FILTER:-10}
    local filter_env=""
    local filter_status=""

    # Parse filter
    if [[ "$FILTER" == env:* ]]; then
        filter_env=$(echo "$FILTER" | cut -d: -f2)
    elif [[ "$FILTER" == status:* ]]; then
        filter_status=$(echo "$FILTER" | cut -d: -f2)
    fi

    case $OUTPUT_FORMAT in
        "console")
            echo -e "${PURPLE}=== Deployment History ===${NC}"
            echo "Showing last $limit deployments"
            [[ -n "$filter_env" ]] && echo "Environment filter: $filter_env"
            [[ -n "$filter_status" ]] && echo "Status filter: $filter_status"
            echo ""

            local count=0
            jq -r '.deployments | reverse[] | @text "\(.id) \(.timestamp) \(.environment) \(.type) \(.status) \(.duration)"' "$HISTORY_DB" 2>/dev/null | while read -r id timestamp env type status duration; do
                # Apply filters
                [[ -n "$filter_env" && "$env" != "$filter_env" ]] && continue
                [[ -n "$filter_status" && "$status" != "$filter_status" ]] && continue

                # Color coding
                local status_color=$NC
                [[ "$status" == "completed" ]] && status_color=$GREEN
                [[ "$status" == "failed" ]] && status_color=$RED
                [[ "$status" == "running" ]] && status_color=$YELLOW

                echo -e "$id | $timestamp | $env | $type | ${status_color}$status${NC} | ${duration}s"
                ((count++))
                [[ $count -ge $limit ]] && break
            done
            ;;

        "json")
            if [[ -n "$filter_env" ]]; then
                jq --arg env "$filter_env" '.deployments | map(select(.environment == $env)) | reverse | .[:'$limit']' "$HISTORY_DB"
            elif [[ -n "$filter_status" ]]; then
                jq --arg status "$filter_status" '.deployments | map(select(.status == $status)) | reverse | .[:'$limit']' "$HISTORY_DB"
            else
                jq '.deployments | reverse | .[:'$limit']' "$HISTORY_DB"
            fi
            ;;

        "csv")
            echo "ID,Timestamp,Environment,Type,Status,Duration,User,Git_Commit,Git_Branch"
            jq -r '.deployments | reverse[] | @csv "\(.id),\(.timestamp),\(.environment),\(.type),\(.status),\(.duration),\(.user),\(.git_commit),\(.git_branch)"' "$HISTORY_DB" 2>/dev/null | head -n "$limit"
            ;;
    esac
}

# Search deployments
search_deployments() {
    local query=$FILTER

    if [[ -z "$query" ]]; then
        echo -e "${RED}❌ Search query required${NC}"
        exit 1
    fi

    case $OUTPUT_FORMAT in
        "console")
            echo -e "${PURPLE}=== Search Results for: $query ===${NC}"
            echo ""

            jq -r '.deployments[] | select(.id | contains("'$query'")) | @text "\(.id) \(.timestamp) \(.environment) \(.status)"' "$HISTORY_DB" 2>/dev/null | while read -r id timestamp env status; do
                echo "$id | $timestamp | $env | $status"
            done
            ;;

        "json")
            jq --arg query "$query" '.deployments | map(select(.id | contains($query)))' "$HISTORY_DB"
            ;;
    esac
}

# Generate statistics
generate_stats() {
    local period=${FILTER:-30d}  # 1d, 7d, 30d, all

    # Calculate date threshold
    local since_date=""
    case $period in
        "1d")  since_date=$(date -d '1 day ago' +%Y-%m-%d) ;;
        "7d")  since_date=$(date -d '7 days ago' +%Y-%m-%d) ;;
        "30d") since_date=$(date -d '30 days ago' +%Y-%m-%d) ;;
        "all") since_date="2000-01-01" ;;
        *)     since_date=$(date -d '30 days ago' +%Y-%m-%d) ;;
    esac

    case $OUTPUT_FORMAT in
        "console")
            echo -e "${PURPLE}=== Deployment Statistics ($period) ===${NC}"
            echo "Period: $since_date to $(date +%Y-%m-%d)"
            echo ""

            # Total deployments
            local total=$(jq '.deployments | length' "$HISTORY_DB")
            local period_total=$(jq --arg date "$since_date" '.deployments | map(select(.timestamp >= $date)) | length' "$HISTORY_DB")

            echo -e "${BLUE}Volume:${NC}"
            echo "  Total deployments: $total"
            echo "  Deployments in period: $period_total"
            echo ""

            # Success rate
            local successful=$(jq --arg date "$since_date" '.deployments | map(select(.timestamp >= $date and .status == "completed")) | length' "$HISTORY_DB")
            local failed=$(jq --arg date "$since_date" '.deployments | map(select(.timestamp >= $date and .status == "failed")) | length' "$HISTORY_DB")

            local success_rate=0
            if [[ $((successful + failed)) -gt 0 ]]; then
                success_rate=$((successful * 100 / (successful + failed)))
            fi

            echo -e "${BLUE}Success Rate:${NC}"
            echo "  Successful: $successful"
            echo "  Failed: $failed"
            echo "  Success rate: ${success_rate}%"
            echo ""

            # Average duration
            local avg_duration=$(jq --arg date "$since_date" '.deployments | map(select(.timestamp >= $date and .duration > 0)) | map(.duration) | if length > 0 then add / length else 0 end' "$HISTORY_DB")

            echo -e "${BLUE}Performance:${NC}"
            echo "  Average duration: ${avg_duration}s"
            echo ""

            # Environment breakdown
            echo -e "${BLUE}By Environment:${NC}"
            jq --arg date "$since_date" '.deployments | map(select(.timestamp >= $date)) | group_by(.environment) | map({env: .[0].environment, count: length}) | sort_by(.count) | reverse[] | @text "\(.env): \(.count)"' "$HISTORY_DB" 2>/dev/null | while read -r line; do
                echo "  $line"
            done
            echo ""

            # User breakdown
            echo -e "${BLUE}By User:${NC}"
            jq --arg date "$since_date" '.deployments | map(select(.timestamp >= $date)) | group_by(.user) | map({user: .[0].user, count: length}) | sort_by(.count) | reverse[] | @text "\(.user): \(.count)"' "$HISTORY_DB" 2>/dev/null | while read -r line; do
                echo "  $line"
            done
            ;;

        "json")
            local stats=$(jq --arg date "$since_date" --arg period "$period" '{
              period: $period,
              since_date: $date,
              total_deployments: .deployments | length,
              period_deployments: (.deployments | map(select(.timestamp >= $date)) | length),
              successful: (.deployments | map(select(.timestamp >= $date and .status == "completed")) | length),
              failed: (.deployments | map(select(.timestamp >= $date and .status == "failed")) | length),
              avg_duration: (.deployments | map(select(.timestamp >= $date and .duration > 0)) | map(.duration) | if length > 0 then add / length else 0 end),
              by_environment: (.deployments | map(select(.timestamp >= $date)) | group_by(.environment) | map({env: .[0].environment, count: length})),
              by_user: (.deployments | map(select(.timestamp >= $date)) | group_by(.user) | map({user: .[0].user, count: length}))
            }' "$HISTORY_DB")

            echo "$stats"
            ;;
    esac
}

# Cleanup old history
cleanup_history() {
    local days=${FILTER:-90}

    echo -e "${BLUE}🧹 Cleaning up deployment history older than $days days...${NC}"

    local cutoff_date=$(date -d "$days days ago" +%Y-%m-%d)
    local removed_count=0

    # Remove old individual files
    find "$HISTORY_DIR" -name "*.json" -type f | while read -r file; do
        local file_date=$(jq -r '.timestamp' "$file" 2>/dev/null | cut -d'T' -f1)
        if [[ "$file_date" < "$cutoff_date" ]]; then
            rm -f "$file"
            ((removed_count++))
        fi
    done

    # Update main database
    jq --arg date "$cutoff_date" '.deployments = (.deployments | map(select(.timestamp >= $date)))' "$HISTORY_DB" > "${HISTORY_DB}.tmp" && mv "${HISTORY_DB}.tmp" "$HISTORY_DB"

    echo -e "${GREEN}✅ Cleanup completed. Removed $removed_count old deployment records.${NC}"
}

# Show deployment details
show_deployment() {
    local deployment_id=$FILTER

    if [[ -z "$deployment_id" ]]; then
        echo -e "${RED}❌ Deployment ID required${NC}"
        exit 1
    fi

    if [[ ! -f "$HISTORY_DIR/${deployment_id}.json" ]]; then
        echo -e "${RED}❌ Deployment not found: $deployment_id${NC}"
        exit 1
    fi

    case $OUTPUT_FORMAT in
        "console")
            echo -e "${PURPLE}=== Deployment Details: $deployment_id ===${NC}"

            local deployment=$(cat "$HISTORY_DIR/${deployment_id}.json")

            echo "ID: $(echo "$deployment" | jq -r '.id')"
            echo "Timestamp: $(echo "$deployment" | jq -r '.timestamp')"
            echo "Environment: $(echo "$deployment" | jq -r '.environment')"
            echo "Type: $(echo "$deployment" | jq -r '.type')"
            echo "Status: $(echo "$deployment" | jq -r '.status')"
            echo "Duration: $(echo "$deployment" | jq -r '.duration')s"
            echo "User: $(echo "$deployment" | jq -r '.user')"
            echo "Git Commit: $(echo "$deployment" | jq -r '.git_commit')"
            echo "Git Branch: $(echo "$deployment" | jq -r '.git_branch')"
            echo ""

            # Artifacts
            local artifact_count=$(echo "$deployment" | jq '.artifacts | length')
            if [[ $artifact_count -gt 0 ]]; then
                echo -e "${BLUE}Artifacts:${NC}"
                echo "$deployment" | jq -r '.artifacts[] | "  \(.name): \(.path) (\(.size) bytes)"'
                echo ""
            fi

            # Validations
            local validation_count=$(echo "$deployment" | jq '.validations | length')
            if [[ $validation_count -gt 0 ]]; then
                echo -e "${BLUE}Validations:${NC}"
                echo "$deployment" | jq -r '.validations[] | "  \(.type): \(.status) (\(.duration)s)"'
                echo ""
            fi
            ;;

        "json")
            cat "$HISTORY_DIR/${deployment_id}.json"
            ;;
    esac
}

# Main function
main() {
    init_history_db

    case $ACTION in
        "record")
            if [[ $# -lt 5 ]]; then
                echo -e "${RED}❌ Usage: $0 record <deployment_id> <environment> <type> <status> [duration] [user] [git_commit] [git_branch]${NC}"
                exit 1
            fi
            record_deployment "$2" "$3" "$4" "$5" "${6:-0}" "${7:-$(whoami)}" "${8:-$(git rev-parse HEAD 2>/dev/null || echo 'unknown')}" "${9:-$(git branch --show-current 2>/dev/null || echo 'unknown')}"
            ;;
        "update")
            if [[ $# -lt 4 ]]; then
                echo -e "${RED}❌ Usage: $0 update <deployment_id> <field> <value>${NC}"
                exit 1
            fi
            update_deployment "$2" "$3" "$4"
            ;;
        "add-artifact")
            if [[ $# -lt 4 ]]; then
                echo -e "${RED}❌ Usage: $0 add-artifact <deployment_id> <artifact_name> <artifact_path> [size]${NC}"
                exit 1
            fi
            add_artifact "$2" "$3" "$4" "${5:-0}"
            ;;
        "add-validation")
            if [[ $# -lt 5 ]]; then
                echo -e "${RED}❌ Usage: $0 add-validation <deployment_id> <validation_type> <status> <duration>${NC}"
                exit 1
            fi
            add_validation "$2" "$3" "$4" "$5"
            ;;
        "list")
            list_deployments
            ;;
        "search")
            search_deployments
            ;;
        "stats")
            generate_stats
            ;;
        "show")
            show_deployment
            ;;
        "cleanup")
            cleanup_history
            ;;
        *)
            echo -e "${RED}❌ Invalid action: $ACTION${NC}"
            echo ""
            echo "Available actions:"
            echo "  record      - Record a new deployment"
            echo "  update      - Update deployment status"
            echo "  add-artifact - Add artifact to deployment"
            echo "  add-validation - Add validation result to deployment"
            echo "  list        - List deployments"
            echo "  search      - Search deployments"
            echo "  stats       - Generate statistics"
            echo "  show        - Show deployment details"
            echo "  cleanup     - Clean up old history"
            exit 1
            ;;
    esac
}

# Show usage
usage() {
    echo "Usage: $0 <action> [filter] [output_format]"
    echo ""
    echo "Actions:"
    echo "  record <id> <env> <type> <status>    - Record deployment"
    echo "  update <id> <field> <value>          - Update deployment"
    echo "  list [limit|filter]                  - List deployments"
    echo "  search <query>                       - Search deployments"
    echo "  stats [period]                       - Generate statistics"
    echo "  show <id>                           - Show deployment details"
    echo "  cleanup [days]                      - Clean up old history"
    echo ""
    echo "Examples:"
    echo "  $0 list 20"
    echo "  $0 list env:production"
    echo "  $0 search deploy_001"
    echo "  $0 stats 7d"
    echo "  $0 show deploy_001"
    echo ""
    echo "Output formats: console, json, csv"
    exit 1
}

# Check arguments
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    usage
fi

# Run main function
main "$@"