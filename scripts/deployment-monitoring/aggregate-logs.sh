#!/bin/bash
# scripts/deployment-monitoring/aggregate-logs.sh
# Log aggregation and analysis script

set -e

# Configuration
ENVIRONMENT=${1:-production}
SINCE=${2:-1h}  # Default to last hour
OUTPUT_DIR=${3:-/tmp/log-analysis}
NAMESPACE=${4:-logi-core}

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Timestamp for files
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Log analysis function
analyze_logs() {
    local service=$1
    local log_file="$OUTPUT_DIR/${service}_${TIMESTAMP}.log"

    echo -e "${BLUE}Analyzing logs for $service...${NC}"

    # Collect logs based on service type
    case $service in
        "kubernetes")
            # Collect logs from all pods in namespace
            kubectl logs -n "$NAMESPACE" --since="$SINCE" --all-containers=true > "$log_file" 2>/dev/null || true
            ;;
        "api-gateway")
            kubectl logs -n "$NAMESPACE" -l app=api-gateway --since="$SINCE" > "$log_file" 2>/dev/null || true
            ;;
        "inventory-service")
            kubectl logs -n "$NAMESPACE" -l app=inventory-service --since="$SINCE" > "$log_file" 2>/dev/null || true
            ;;
        "order-service")
            kubectl logs -n "$NAMESPACE" -l app=order-service --since="$SINCE" > "$log_file" 2>/dev/null || true
            ;;
        "routing-service")
            kubectl logs -n "$NAMESPACE" -l app=routing-service --since="$SINCE" > "$log_file" 2>/dev/null || true
            ;;
        "geolocation-service")
            kubectl logs -n "$NAMESPACE" -l app=geolocation-service --since="$SINCE" > "$log_file" 2>/dev/null || true
            ;;
        "notification-service")
            kubectl logs -n "$NAMESPACE" -l app=notification-service --since="$SINCE" > "$log_file" 2>/dev/null || true
            ;;
        "user-service")
            kubectl logs -n "$NAMESPACE" -l app=user-service --since="$SINCE" > "$log_file" 2>/dev/null || true
            ;;
        "nginx")
            kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx --since="$SINCE" > "$log_file" 2>/dev/null || true
            ;;
        "netlify")
            # For Netlify, we'd need to use their API or CLI
            echo "Netlify log collection requires API access" > "$log_file"
            ;;
    esac

    # Analyze the collected logs
    if [[ -f "$log_file" && -s "$log_file" ]]; then
        analyze_log_file "$service" "$log_file"
    else
        echo -e "${YELLOW}No logs found for $service${NC}"
    fi
}

# Analyze individual log file
analyze_log_file() {
    local service=$1
    local log_file=$2
    local analysis_file="$OUTPUT_DIR/${service}_analysis_${TIMESTAMP}.txt"

    echo "Log Analysis for $service" > "$analysis_file"
    echo "Generated: $(date)" >> "$analysis_file"
    echo "Time range: $SINCE" >> "$analysis_file"
    echo "=================================" >> "$analysis_file"

    # Count total lines
    local total_lines=$(wc -l < "$log_file")
    echo "Total log lines: $total_lines" >> "$analysis_file"

    # Count error patterns
    local error_count=$(grep -i -c "error\|exception\|fail" "$log_file" 2>/dev/null || echo "0")
    echo "Error occurrences: $error_count" >> "$analysis_file"

    # Count warning patterns
    local warning_count=$(grep -i -c "warn\|warning" "$log_file" 2>/dev/null || echo "0")
    echo "Warning occurrences: $warning_count" >> "$analysis_file"

    # Count HTTP status codes
    echo "" >> "$analysis_file"
    echo "HTTP Status Codes:" >> "$analysis_file"
    grep -o '"status":[0-9]\+' "$log_file" 2>/dev/null | sed 's/"status"://' | sort | uniq -c | sort -nr >> "$analysis_file" || true

    # Most common error messages
    echo "" >> "$analysis_file"
    echo "Top Error Messages:" >> "$analysis_file"
    grep -i "error\|exception\|fail" "$log_file" 2>/dev/null | \
        sed 's/.*\(error\|exception\|fail\).*/\1/i' | \
        sort | uniq -c | sort -nr | head -10 >> "$analysis_file" || true

    # Response time analysis (if available)
    echo "" >> "$analysis_file"
    echo "Response Time Analysis:" >> "$analysis_file"
    grep -o '"response_time":[0-9.]\+' "$log_file" 2>/dev/null | \
        sed 's/"response_time"://' | \
        awk '{sum+=$1; count++} END {if(count>0) print "Average:", sum/count, "ms"; print "Count:", count}' >> "$analysis_file" || true

    # Recent errors (last 10)
    echo "" >> "$analysis_file"
    echo "Recent Errors (last 10):" >> "$analysis_file"
    grep -i "error\|exception\|fail" "$log_file" 2>/dev/null | tail -10 >> "$analysis_file" || true

    echo -e "${GREEN}Analysis completed for $service${NC}"
    echo "Results saved to: $analysis_file"
}

# Generate summary report
generate_summary() {
    local summary_file="$OUTPUT_DIR/summary_${TIMESTAMP}.txt"

    echo "Log Analysis Summary Report" > "$summary_file"
    echo "Generated: $(date)" >> "$summary_file"
    echo "Environment: $ENVIRONMENT" >> "$summary_file"
    echo "Time range: $SINCE" >> "$summary_file"
    echo "=================================" >> "$summary_file"

    # Overall statistics
    local total_files=$(find "$OUTPUT_DIR" -name "*_${TIMESTAMP}.log" | wc -l)
    echo "Services analyzed: $total_files" >> "$summary_file"

    # Aggregate error counts
    local total_errors=0
    local total_warnings=0

    for analysis_file in "$OUTPUT_DIR"/*_analysis_${TIMESTAMP}.txt; do
        if [[ -f "$analysis_file" ]]; then
            local service=$(basename "$analysis_file" | sed "s/_analysis_${TIMESTAMP}.txt//")
            local errors=$(grep "Error occurrences:" "$analysis_file" | cut -d: -f2 | tr -d ' ')
            local warnings=$(grep "Warning occurrences:" "$analysis_file" | cut -d: -f2 | tr -d ' ')

            total_errors=$((total_errors + errors))
            total_warnings=$((total_warnings + warnings))

            echo "" >> "$summary_file"
            echo "Service: $service" >> "$summary_file"
            echo "  Errors: $errors" >> "$summary_file"
            echo "  Warnings: $warnings" >> "$summary_file"
        fi
    done

    echo "" >> "$summary_file"
    echo "TOTALS:" >> "$summary_file"
    echo "  Total Errors: $total_errors" >> "$summary_file"
    echo "  Total Warnings: $total_warnings" >> "$summary_file"

    # Health assessment
    echo "" >> "$summary_file"
    echo "Health Assessment:" >> "$summary_file"
    if [[ $total_errors -eq 0 ]]; then
        echo "  Status: HEALTHY (No errors detected)" >> "$summary_file"
    elif [[ $total_errors -lt 10 ]]; then
        echo "  Status: WARNING ($total_errors errors detected)" >> "$summary_file"
    else
        echo "  Status: CRITICAL ($total_errors errors detected)" >> "$summary_file"
    fi

    echo -e "${GREEN}Summary report generated: $summary_file${NC}"
}

# Send alert if critical issues found
send_alert() {
    local summary_file="$OUTPUT_DIR/summary_${TIMESTAMP}.txt"
    local critical_errors=$(grep "Total Errors:" "$summary_file" | cut -d: -f2 | tr -d ' ')

    if [[ $critical_errors -gt 50 ]]; then
        echo -e "${RED}🚨 CRITICAL: High error count detected ($critical_errors errors)${NC}"
        # Send alert notification
        # curl -X POST -H 'Content-type: application/json' --data '{"text":"🚨 Log analysis detected critical errors","attachments":[{"text":"See analysis report for details"}]}' $SLACK_WEBHOOK_URL
    fi
}

# Main function
main() {
    echo -e "${BLUE}Starting log aggregation and analysis...${NC}"
    echo "Environment: $ENVIRONMENT"
    echo "Time range: $SINCE"
    echo "Output directory: $OUTPUT_DIR"
    echo ""

    # Services to analyze
    local services=(
        "kubernetes"
        "api-gateway"
        "inventory-service"
        "order-service"
        "routing-service"
        "geolocation-service"
        "notification-service"
        "user-service"
        "nginx"
        "netlify"
    )

    # Analyze logs for each service
    for service in "${services[@]}"; do
        analyze_logs "$service"
    done

    # Generate summary report
    generate_summary

    # Send alerts if needed
    send_alert

    echo ""
    echo -e "${GREEN}Log analysis completed!${NC}"
    echo "Results saved in: $OUTPUT_DIR"
    echo "Summary: $OUTPUT_DIR/summary_${TIMESTAMP}.txt"
}

# Show usage
usage() {
    echo "Usage: $0 [environment] [time-range] [output-dir] [namespace]"
    echo ""
    echo "Arguments:"
    echo "  environment  Target environment (default: production)"
    echo "  time-range   Time range for logs (default: 1h)"
    echo "               Examples: 1h, 2h, 30m, 1d"
    echo "  output-dir   Output directory (default: /tmp/log-analysis)"
    echo "  namespace    Kubernetes namespace (default: logi-core)"
    echo ""
    echo "Examples:"
    echo "  $0 production 2h"
    echo "  $0 staging 30m /tmp/staging-logs"
    exit 1
}

# Check arguments
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    usage
fi

# Run main function
main "$@"