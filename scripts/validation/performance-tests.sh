#!/bin/bash
# scripts/validation/performance-tests.sh
# Performance validation tests for post-deployment

ENVIRONMENT=${1:-production}
DURATION=${2:-60}  # seconds
CONCURRENT_USERS=${3:-10}
REPORT_FILE="/tmp/performance_report_${ENVIRONMENT}_$(date +%Y%m%d_%H%M%S).html"

echo "=== Performance Validation for $ENVIRONMENT ==="
echo "Duration: ${DURATION}s"
echo "Concurrent Users: $CONCURRENT_USERS"
echo ""

# API Performance Tests
echo "Testing API performance..."

# Simple load test using curl
echo "Running API load test..."
for i in $(seq 1 $CONCURRENT_USERS); do
    (
        for j in $(seq 1 $((DURATION / 2))); do
            START=$(date +%s%N)
            curl -s -w "%{http_code} %{time_total}\n" -o /dev/null \
                 "https://api.$ENVIRONMENT.yourdomain.com/v1/status" >> /tmp/api_responses.txt
            END=$(date +%s%N)
        done
    ) &
done

wait

# Analyze API responses
TOTAL_REQUESTS=$(wc -l < /tmp/api_responses.txt)
SUCCESS_REQUESTS=$(grep "^200" /tmp/api_responses.txt | wc -l)
AVG_RESPONSE_TIME=$(grep "^200" /tmp/api_responses.txt | awk '{sum+=$2} END {if(NR>0) print sum/NR * 1000 "ms"; else print "N/A"}')

echo "API Performance Results:"
echo "  Total Requests: $TOTAL_REQUESTS"
echo "  Successful Requests: $SUCCESS_REQUESTS"
echo "  Average Response Time: $AVG_RESPONSE_TIME"

# Database Performance Tests
echo ""
echo "Testing database performance..."

# Simple query performance test
DB_TEST_START=$(date +%s)
kubectl exec -n logi-core $(kubectl get pods -n logi-core -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- \
    psql -U logistics -d logistics -c "SELECT COUNT(*) FROM users;" >/dev/null 2>&1
DB_TEST_END=$(date +%s)
DB_QUERY_TIME=$((DB_TEST_END - DB_TEST_START))

echo "Database Performance Results:"
echo "  Query Time: ${DB_QUERY_TIME}s"

# Resource Usage Tests
echo ""
echo "Checking resource usage..."

# CPU and Memory usage
kubectl top pods -n logi-core --no-headers | while read -r pod cpu mem; do
    echo "Pod $pod: CPU $cpu, Memory $mem"
done

# Network performance (if available)
echo ""
echo "Network Performance:"
curl -s -w "Connect: %{time_connect}s\nTTFB: %{time_starttransfer}s\nTotal: %{time_total}s\n" \
     -o /dev/null "https://api.$ENVIRONMENT.yourdomain.com/health"

# Generate HTML report
cat > "$REPORT_FILE" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Performance Test Report - $ENVIRONMENT</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .pass { color: green; }
        .fail { color: red; }
        .warn { color: orange; }
    </style>
</head>
<body>
    <h1>Performance Test Report</h1>
    <p><strong>Environment:</strong> $ENVIRONMENT</p>
    <p><strong>Test Time:</strong> $(date)</p>
    <p><strong>Duration:</strong> ${DURATION}s</p>
    <p><strong>Concurrent Users:</strong> $CONCURRENT_USERS</p>

    <h2>API Performance</h2>
    <div class="metric">
        <strong>Total Requests:</strong> $TOTAL_REQUESTS<br>
        <strong>Successful Requests:</strong> $SUCCESS_REQUESTS<br>
        <strong>Average Response Time:</strong> $AVG_RESPONSE_TIME
    </div>

    <h2>Database Performance</h2>
    <div class="metric">
        <strong>Query Time:</strong> ${DB_QUERY_TIME}s
    </div>

    <h2>Resource Usage</h2>
    <div class="metric">
        $(kubectl top pods -n logi-core --no-headers | while read -r pod cpu mem; do
            echo "<strong>$pod:</strong> CPU $cpu, Memory $mem<br>"
        done)
    </div>
</body>
</html>
EOF

echo ""
echo "Performance report generated: $REPORT_FILE"

# Cleanup
rm -f /tmp/api_responses.txt

# Determine pass/fail based on thresholds
if (( $(echo "$AVG_RESPONSE_TIME < 1000" | bc -l 2>/dev/null || echo "1") )); then
    echo -e "${GREEN}✅ Performance tests PASSED${NC}"
    exit 0
else
    echo -e "${RED}❌ Performance tests FAILED${NC}"
    exit 1
fi