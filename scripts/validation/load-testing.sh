#!/bin/bash
# scripts/validation/load-testing.sh
# Comprehensive load testing framework

ENVIRONMENT=${1:-production}
TEST_TYPE=${2:-gradual}  # gradual, spike, sustained, stress
DURATION=${3:-300}       # seconds
MAX_USERS=${4:-100}
REPORT_FILE="/tmp/load_test_report_${ENVIRONMENT}_$(date +%Y%m%d_%H%M%S).json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=== Load Testing Framework ==="
echo "Environment: $ENVIRONMENT"
echo "Test Type: $TEST_TYPE"
echo "Duration: ${DURATION}s"
echo "Max Users: $MAX_USERS"
echo ""

# Initialize load test report
cat > "$REPORT_FILE" << EOF
{
  "environment": "$ENVIRONMENT",
  "test_type": "$TEST_TYPE",
  "duration": $DURATION,
  "max_users": $MAX_USERS,
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "test_phases": [],
  "metrics": {
    "response_times": [],
    "error_rates": [],
    "throughput": [],
    "resource_usage": []
  },
  "summary": {
    "total_requests": 0,
    "successful_requests": 0,
    "failed_requests": 0,
    "average_response_time": 0,
    "p95_response_time": 0,
    "p99_response_time": 0,
    "max_response_time": 0,
    "requests_per_second": 0,
    "error_rate": 0
  },
  "thresholds": {
    "max_response_time": 5000,
    "max_error_rate": 0.05,
    "min_throughput": 10
  }
}
EOF

# Function to record metrics
record_metric() {
    local timestamp=$1
    local metric_type=$2
    local value=$3

    jq --arg ts "$timestamp" --arg type "$metric_type" --arg val "$value" \
       '.metrics[$type] += [{"timestamp": $ts, "value": ($val | tonumber)}]' \
       "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
}

# Function to get system metrics
get_system_metrics() {
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)

    # CPU usage
    CPU_USAGE=$(kubectl top pods -n logi-core --no-headers 2>/dev/null | awk '{sum+=$2} END {if(NR>0) print sum/NR; else print 0}' || echo '0')
    record_metric "$timestamp" "resource_usage" "{\"cpu\": $CPU_USAGE, \"type\": \"cpu\"}"

    # Memory usage
    MEM_USAGE=$(kubectl top pods -n logi-core --no-headers 2>/dev/null | awk '{sum+=$3} END {if(NR>0) print sum/NR; else print 0}' || echo '0')
    record_metric "$timestamp" "resource_usage" "{\"memory\": $MEM_USAGE, \"type\": \"memory\"}"

    # Pod count
    POD_COUNT=$(kubectl get pods -n logi-core --no-headers | wc -l)
    record_metric "$timestamp" "resource_usage" "{\"pods\": $POD_COUNT, \"type\": \"pod_count\"}"
}

# Function to run load test phase
run_load_phase() {
    local phase_name=$1
    local users=$2
    local duration=$3
    local ramp_up=${4:-30}

    echo ""
    echo "=== $phase_name Phase ==="
    echo "Users: $users, Duration: ${duration}s, Ramp-up: ${ramp_up}s"

    # Record phase start
    jq --arg phase "$phase_name" --arg users "$users" --arg dur "$duration" \
       '.test_phases += [{"name": $phase, "users": ($users | tonumber), "duration": ($dur | tonumber), "start_time": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'", "metrics": []}]' \
       "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"

    local start_time=$(date +%s)
    local end_time=$((start_time + duration))
    local phase_requests=0
    local phase_success=0
    local phase_failed=0
    local response_times=()

    # Ramp up users gradually
    local users_per_second=$((users / ramp_up))
    local current_users=0

    while [[ $(date +%s) -lt $end_time ]]; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))

        # Calculate target users for this second
        if [[ $elapsed -lt $ramp_up ]]; then
            current_users=$((elapsed * users_per_second))
            [[ $current_users -gt $users ]] && current_users=$users
        else
            current_users=$users
        fi

        # Launch requests for this second
        for ((i=1; i<=current_users; i++)); do
            (
                local request_start=$(date +%s%N)
                local endpoint=""
                local method="GET"

                # Randomly select endpoint based on typical traffic patterns
                local rand=$((RANDOM % 100))
                if [[ $rand -lt 40 ]]; then
                    endpoint="/health"
                elif [[ $rand -lt 60 ]]; then
                    endpoint="/v1/status"
                elif [[ $rand -lt 75 ]]; then
                    endpoint="/orders"
                    method="GET"
                elif [[ $rand -lt 85 ]]; then
                    endpoint="/inventory/search"
                elif [[ $rand -lt 92 ]]; then
                    endpoint="/user/profile"
                    method="GET"
                else
                    endpoint="/notifications"
                    method="GET"
                fi

                # Make request
                local response=$(curl -s -w '\n{"status_code":%{http_code},"response_time":%{time_total},"size":%{size_download}}' \
                               -X "$method" \
                               -H "Authorization: Bearer test-token" \
                               --max-time 10 \
                               "https://api.$ENVIRONMENT.yourdomain.com$endpoint" \
                               -o /dev/null)

                local request_end=$(date +%s%N)
                local response_time=$(( (request_end - request_start) / 1000000 ))  # Convert to milliseconds

                # Parse response
                local status_code=$(echo "$response" | grep -o '"status_code":[0-9]*' | cut -d':' -f2 || echo "0")

                # Record metrics
                if [[ $status_code -eq 200 || $status_code -eq 201 ]]; then
                    echo "$response_time success"
                else
                    echo "$response_time failed"
                fi
            ) &
        done

        # Collect results from background processes
        local second_start=$(date +%s)
        local results=()

        while [[ $(date +%s) -lt $((second_start + 1)) ]]; do
            if [[ ${#results[@]} -lt $current_users ]]; then
                local result=""
                if read -t 0.1 -r result 2>/dev/null; then
                    results+=("$result")
                fi
            else
                break
            fi
        done

        # Process results
        for result in "${results[@]}"; do
            if [[ -n "$result" ]]; then
                local response_time=$(echo "$result" | awk '{print $1}')
                local status=$(echo "$result" | awk '{print $2}')

                phase_requests=$((phase_requests + 1))
                response_times+=($response_time)

                if [[ "$status" == "success" ]]; then
                    phase_success=$((phase_success + 1))
                else
                    phase_failed=$((phase_failed + 1))
                fi

                # Record individual response time
                record_metric "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "response_times" "$response_time"
            fi
        done

        # Record throughput
        record_metric "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "throughput" "${#results[@]}"

        # Record error rate
        if [[ $phase_requests -gt 0 ]]; then
            local error_rate=$(echo "scale=4; $phase_failed / $phase_requests" | bc -l 2>/dev/null || echo "0")
            record_metric "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "error_rates" "$error_rate"
        fi

        # Get system metrics every 10 seconds
        if [[ $((elapsed % 10)) -eq 0 ]]; then
            get_system_metrics
        fi

        # Brief pause to prevent overwhelming the system
        sleep 0.1
    done

    # Wait for any remaining background processes
    wait

    # Calculate phase statistics
    local avg_response_time=0
    local p95_response_time=0
    local p99_response_time=0
    local max_response_time=0

    if [[ ${#response_times[@]} -gt 0 ]]; then
        # Sort response times for percentiles
        IFS=$'\n' sorted_times=($(sort -n <<<"${response_times[*]}"))
        unset IFS

        # Calculate average
        local sum=0
        for time in "${response_times[@]}"; do
            sum=$((sum + time))
        done
        avg_response_time=$((sum / ${#response_times[@]}))

        # Calculate percentiles
        local p95_index=$(( ${#sorted_times[@]} * 95 / 100 ))
        local p99_index=$(( ${#sorted_times[@]} * 99 / 100 ))
        p95_response_time=${sorted_times[$p95_index]}
        p99_response_time=${sorted_times[$p99_index]}
        max_response_time=${sorted_times[-1]}
    fi

    # Record phase completion
    jq --arg phase "$phase_name" --arg requests "$phase_requests" --arg success "$phase_success" --arg failed "$phase_failed" \
       --arg avg "$avg_response_time" --arg p95 "$p95_response_time" --arg p99 "$p99_response_time" --arg max "$max_response_time" \
       '(.test_phases[] | select(.name == $phase) | .end_time) = "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'" |
        (.test_phases[] | select(.name == $phase) | .summary) = {
          "total_requests": ($requests | tonumber),
          "successful_requests": ($success | tonumber),
          "failed_requests": ($failed | tonumber),
          "average_response_time": ($avg | tonumber),
          "p95_response_time": ($p95 | tonumber),
          "p99_response_time": ($p99 | tonumber),
          "max_response_time": ($max | tonumber)
        }' \
       "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"

    echo "Phase completed: $phase_success/$phase_requests successful"
    echo "Average response time: ${avg_response_time}ms"
    echo "95th percentile: ${p95_response_time}ms"
    echo "99th percentile: ${p99_response_time}ms"
}

# ===== LOAD TEST EXECUTION =====

case $TEST_TYPE in
    "gradual")
        echo "Running gradual load test (gradually increasing users)..."
        run_load_phase "Warm-up" 10 $((DURATION / 4)) 30
        run_load_phase "Medium Load" 50 $((DURATION / 4)) 60
        run_load_phase "High Load" $MAX_USERS $((DURATION / 4)) 90
        run_load_phase "Peak Load" $MAX_USERS $((DURATION / 4)) 30
        ;;

    "spike")
        echo "Running spike test (sudden load increase)..."
        run_load_phase "Baseline" 10 $((DURATION / 4)) 30
        run_load_phase "Spike" $MAX_USERS $((DURATION / 2)) 10
        run_load_phase "Recovery" 10 $((DURATION / 4)) 30
        ;;

    "sustained")
        echo "Running sustained load test (constant load)..."
        run_load_phase "Sustained Load" $MAX_USERS $DURATION 120
        ;;

    "stress")
        echo "Running stress test (overloading the system)..."
        run_load_phase "Normal Load" $((MAX_USERS / 2)) $((DURATION / 4)) 60
        run_load_phase "Stress Load" $((MAX_USERS * 3 / 2)) $((DURATION / 2)) 30
        run_load_phase "Recovery" $((MAX_USERS / 4)) $((DURATION / 4)) 30
        ;;

    *)
        echo "Unknown test type: $TEST_TYPE"
        echo "Available types: gradual, spike, sustained, stress"
        exit 1
        ;;
esac

# ===== GENERATE SUMMARY =====
echo ""
echo "=== Load Test Summary ==="

# Calculate overall statistics
TOTAL_REQUESTS=$(jq '.test_phases | map(.summary.total_requests) | add' "$REPORT_FILE")
SUCCESSFUL_REQUESTS=$(jq '.test_phases | map(.summary.successful_requests) | add' "$REPORT_FILE")
FAILED_REQUESTS=$(jq '.test_phases | map(.summary.failed_requests) | add' "$REPORT_FILE")

if [[ $TOTAL_REQUESTS -gt 0 ]]; then
    ERROR_RATE=$(echo "scale=4; $FAILED_REQUESTS / $TOTAL_REQUESTS" | bc -l 2>/dev/null || echo "0")
    REQUESTS_PER_SECOND=$(echo "scale=2; $TOTAL_REQUESTS / $DURATION" | bc -l 2>/dev/null || echo "0")

    # Calculate average response time across all phases
    AVG_RESPONSE_TIME=$(jq '.test_phases | map(.summary.average_response_time * .summary.total_requests) | add / (.test_phases | map(.summary.total_requests) | add)' "$REPORT_FILE" 2>/dev/null || echo "0")

    # Calculate percentiles across all phases
    P95_RESPONSE_TIME=$(jq '.test_phases | map(.summary.p95_response_time) | max' "$REPORT_FILE" 2>/dev/null || echo "0")
    P99_RESPONSE_TIME=$(jq '.test_phases | map(.summary.p99_response_time) | max' "$REPORT_FILE" 2>/dev/null || echo "0")
    MAX_RESPONSE_TIME=$(jq '.test_phases | map(.summary.max_response_time) | max' "$REPORT_FILE" 2>/dev/null || echo "0")
else
    ERROR_RATE="0"
    REQUESTS_PER_SECOND="0"
    AVG_RESPONSE_TIME="0"
    P95_RESPONSE_TIME="0"
    P99_RESPONSE_TIME="0"
    MAX_RESPONSE_TIME="0"
fi

# Update summary in report
jq --arg total "$TOTAL_REQUESTS" --arg success "$SUCCESSFUL_REQUESTS" --arg failed "$FAILED_REQUESTS" \
   --arg avg "$AVG_RESPONSE_TIME" --arg p95 "$P95_RESPONSE_TIME" --arg p99 "$P99_RESPONSE_TIME" --arg max "$MAX_RESPONSE_TIME" \
   --arg rps "$REQUESTS_PER_SECOND" --arg err_rate "$ERROR_RATE" \
   '.summary.total_requests = ($total | tonumber) |
    .summary.successful_requests = ($success | tonumber) |
    .summary.failed_requests = ($failed | tonumber) |
    .summary.average_response_time = ($avg | tonumber) |
    .summary.p95_response_time = ($p95 | tonumber) |
    .summary.p99_response_time = ($p99 | tonumber) |
    .summary.max_response_time = ($max | tonumber) |
    .summary.requests_per_second = ($rps | tonumber) |
    .summary.error_rate = ($err_rate | tonumber)' \
   "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"

echo "Total Requests: $TOTAL_REQUESTS"
echo "Successful Requests: $SUCCESSFUL_REQUESTS"
echo "Failed Requests: $FAILED_REQUESTS"
echo "Error Rate: $(echo "scale=2; $ERROR_RATE * 100" | bc -l 2>/dev/null || echo "0")%"
echo "Requests/Second: $REQUESTS_PER_SECOND"
echo "Average Response Time: ${AVG_RESPONSE_TIME}ms"
echo "95th Percentile: ${P95_RESPONSE_TIME}ms"
echo "99th Percentile: ${P99_RESPONSE_TIME}ms"
echo "Max Response Time: ${MAX_RESPONSE_TIME}ms"

# ===== THRESHOLD ANALYSIS =====
echo ""
echo "=== Threshold Analysis ==="

THRESHOLDS_MET=true

# Check response time threshold
if (( $(echo "$MAX_RESPONSE_TIME > 5000" | bc -l 2>/dev/null || echo "0") )); then
    echo -e "${RED}❌ Response time threshold exceeded: ${MAX_RESPONSE_TIME}ms > 5000ms${NC}"
    THRESHOLDS_MET=false
else
    echo -e "${GREEN}✅ Response time within threshold: ${MAX_RESPONSE_TIME}ms ≤ 5000ms${NC}"
fi

# Check error rate threshold
if (( $(echo "$ERROR_RATE > 0.05" | bc -l 2>/dev/null || echo "0") )); then
    echo -e "${RED}❌ Error rate threshold exceeded: $(echo "scale=2; $ERROR_RATE * 100" | bc -l 2>/dev/null || echo "0")% > 5%${NC}"
    THRESHOLDS_MET=false
else
    echo -e "${GREEN}✅ Error rate within threshold: $(echo "scale=2; $ERROR_RATE * 100" | bc -l 2>/dev/null || echo "0")% ≤ 5%${NC}"
fi

# Check throughput threshold
if (( $(echo "$REQUESTS_PER_SECOND < 10" | bc -l 2>/dev/null || echo "0") )); then
    echo -e "${YELLOW}⚠️  Throughput below minimum: ${REQUESTS_PER_SECOND} req/s < 10 req/s${NC}"
else
    echo -e "${GREEN}✅ Throughput meets minimum: ${REQUESTS_PER_SECOND} req/s ≥ 10 req/s${NC}"
fi

# ===== FINAL ASSESSMENT =====
echo ""
if [[ $THRESHOLDS_MET == true ]]; then
    echo -e "${GREEN}✅ LOAD TEST PASSED - All thresholds met${NC}"
    jq '.overall_status = "passed"' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
else
    echo -e "${RED}❌ LOAD TEST FAILED - Thresholds exceeded${NC}"
    jq '.overall_status = "failed"' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
fi

echo ""
echo "Detailed report saved to: $REPORT_FILE"

# Generate HTML report
HTML_REPORT="${REPORT_FILE%.json}.html"
cat > "$HTML_REPORT" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Load Test Report - $ENVIRONMENT</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .passed { border-left: 5px solid green; }
        .failed { border-left: 5px solid red; }
        .warning { border-left: 5px solid orange; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Load Test Report</h1>
    <p><strong>Environment:</strong> $ENVIRONMENT</p>
    <p><strong>Test Type:</strong> $TEST_TYPE</p>
    <p><strong>Duration:</strong> ${DURATION}s</p>
    <p><strong>Max Users:</strong> $MAX_USERS</p>
    <p><strong>Generated:</strong> $(date)</p>

    <h2>Overall Summary</h2>
    <div class="metric">
        <strong>Total Requests:</strong> $TOTAL_REQUESTS<br>
        <strong>Successful Requests:</strong> $SUCCESSFUL_REQUESTS<br>
        <strong>Failed Requests:</strong> $FAILED_REQUESTS<br>
        <strong>Error Rate:</strong> $(echo "scale=2; $ERROR_RATE * 100" | bc -l 2>/dev/null || echo "0")%<br>
        <strong>Requests/Second:</strong> $REQUESTS_PER_SECOND<br>
        <strong>Average Response Time:</strong> ${AVG_RESPONSE_TIME}ms<br>
        <strong>95th Percentile:</strong> ${P95_RESPONSE_TIME}ms<br>
        <strong>99th Percentile:</strong> ${P99_RESPONSE_TIME}ms<br>
        <strong>Max Response Time:</strong> ${MAX_RESPONSE_TIME}ms
    </div>

    <h2>Test Phases</h2>
    <table>
        <tr>
            <th>Phase</th>
            <th>Users</th>
            <th>Requests</th>
            <th>Success Rate</th>
            <th>Avg Response Time</th>
            <th>95th Percentile</th>
        </tr>
        $(jq -r '.test_phases[] | "<tr><td>\(.name)</td><td>\(.users)</td><td>\(.summary.total_requests)</td><td>\(if .summary.total_requests > 0 then ((.summary.successful_requests / .summary.total_requests * 100) | floor) else 0 end)%</td><td>\(.summary.average_response_time)ms</td><td>\(.summary.p95_response_time)ms</td></tr>"' "$REPORT_FILE")
    </table>

    <h2>Threshold Analysis</h2>
    <div class="metric $(if [[ $THRESHOLDS_MET == true ]]; then echo 'passed'; else echo 'failed'; fi)">
        $(if [[ $THRESHOLDS_MET == true ]]; then echo '✅ All thresholds met'; else echo '❌ Thresholds exceeded'; fi)
    </div>
</body>
</html>
EOF

echo "HTML report generated: $HTML_REPORT"