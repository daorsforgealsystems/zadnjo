#!/bin/bash
# scripts/validation/security-scan.sh
# Security scanning for post-deployment validation

ENVIRONMENT=${1:-production}
SCAN_TYPE=${2:-full}  # quick, full, container
REPORT_FILE="/tmp/security_scan_${ENVIRONMENT}_$(date +%Y%m%d_%H%M%S).json"

echo "=== Security Scan for $ENVIRONMENT ==="
echo "Scan Type: $SCAN_TYPE"
echo ""

# Initialize report
cat > "$REPORT_FILE" << EOF
{
  "environment": "$ENVIRONMENT",
  "scan_type": "$SCAN_TYPE",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "vulnerabilities": [],
  "summary": {"critical": 0, "high": 0, "medium": 0, "low": 0, "total": 0}
}
EOF

# Vulnerability tracking
add_vulnerability() {
    local severity=$1
    local component=$2
    local description=$3
    local cve=${4:-""}

    jq --arg sev "$severity" --arg comp "$component" --arg desc "$description" --arg cve "$cve" \
       '.vulnerabilities += [{"severity": $sev, "component": $comp, "description": $desc, "cve": $cve}] | .summary.total += 1 | .summary[$sev | ascii_downcase] += 1' \
       "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
}

# Container Image Scanning
scan_containers() {
    echo "Scanning container images..."

    # Get all running images
    kubectl get pods -n logi-core -o jsonpath='{.items[*].spec.containers[*].image}' | tr ' ' '\n' | sort | uniq | while read -r image; do
        echo "Scanning image: $image"

        # Use Trivy or similar scanner (if available)
        if command -v trivy >/dev/null 2>&1; then
            trivy image --format json "$image" > /tmp/trivy_scan.json 2>/dev/null || true

            # Parse vulnerabilities
            jq -r '.Results[].Vulnerabilities[]? | "\(.Severity) \(.PkgName) \(.VulnerabilityID) \(.Description)"' /tmp/trivy_scan.json 2>/dev/null | while read -r sev pkg cve desc; do
                add_vulnerability "$sev" "$image:$pkg" "$desc" "$cve"
            done
        else
            echo "Trivy not available, skipping container scan"
        fi
    done
}

# Dependency Scanning
scan_dependencies() {
    echo "Scanning dependencies..."

    # Scan Node.js dependencies
    if [[ -f "package-lock.json" ]]; then
        npm audit --audit-level=moderate --json > /tmp/npm_audit.json 2>/dev/null || true

        # Parse npm audit results
        jq -r '.vulnerabilities | to_entries[] | "\(.value.severity) \(.key) \(.value.title)"' /tmp/npm_audit.json 2>/dev/null | while read -r sev pkg title; do
            add_vulnerability "$sev" "npm:$pkg" "$title"
        done
    fi

    # Scan Python dependencies (if applicable)
    if [[ -f "requirements.txt" ]]; then
        # Use safety or similar tool
        echo "Python dependency scan not implemented"
    fi
}

# Configuration Security Checks
check_configuration() {
    echo "Checking configuration security..."

    # Check SSL/TLS configuration
    echo "Testing SSL configuration..."
    ssl_test=$(openssl s_client -connect "$ENVIRONMENT.yourdomain.com:443" -servername "$ENVIRONMENT.yourdomain.com" < /dev/null 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    if [[ -z "$ssl_test" ]]; then
        add_vulnerability "HIGH" "SSL/TLS" "SSL certificate not properly configured"
    fi

    # Check security headers
    headers=$(curl -s -I "https://$ENVIRONMENT.yourdomain.com" | grep -E "(X-Frame-Options|X-Content-Type-Options|X-XSS-Protection|Strict-Transport-Security)" | wc -l)
    if [[ $headers -lt 4 ]]; then
        add_vulnerability "MEDIUM" "Security Headers" "Missing security headers"
    fi

    # Check for exposed sensitive endpoints
    sensitive_endpoints=("/api/admin" "/api/debug" "/api/internal")
    for endpoint in "${sensitive_endpoints[@]}"; do
        if curl -f -s "https://api.$ENVIRONMENT.yourdomain.com$endpoint" >/dev/null 2>&1; then
            add_vulnerability "HIGH" "API Security" "Sensitive endpoint exposed: $endpoint"
        fi
    done
}

# Network Security Checks
check_network_security() {
    echo "Checking network security..."

    # Check for open ports that shouldn't be exposed
    # This would require nmap or similar tool
    echo "Network security checks require additional tools"

    # Check Kubernetes network policies
    policies=$(kubectl get networkpolicies -n logi-core --no-headers | wc -l)
    if [[ $policies -eq 0 ]]; then
        add_vulnerability "MEDIUM" "Network Policies" "No network policies configured"
    fi
}

# Run appropriate scans based on type
case $SCAN_TYPE in
    "quick")
        echo "Running quick security scan..."
        check_configuration
        ;;
    "container")
        echo "Running container security scan..."
        scan_containers
        ;;
    "full")
        echo "Running full security scan..."
        scan_containers
        scan_dependencies
        check_configuration
        check_network_security
        ;;
    *)
        echo "Unknown scan type: $SCAN_TYPE"
        exit 1
        ;;
esac

# Generate summary
CRITICAL=$(jq '.summary.critical' "$REPORT_FILE")
HIGH=$(jq '.summary.high' "$REPORT_FILE")
MEDIUM=$(jq '.summary.medium' "$REPORT_FILE")
LOW=$(jq '.summary.low' "$REPORT_FILE")
TOTAL=$(jq '.summary.total' "$REPORT_FILE")

echo ""
echo "=== Security Scan Summary ==="
echo "Critical: $CRITICAL"
echo "High: $HIGH"
echo "Medium: $MEDIUM"
echo "Low: $LOW"
echo "Total: $TOTAL"

# Determine pass/fail
if [[ $CRITICAL -gt 0 ]]; then
    echo -e "${RED}❌ Security scan FAILED - Critical vulnerabilities found${NC}"
    jq '.overall_status = "failed"' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    exit 1
elif [[ $HIGH -gt 5 ]]; then
    echo -e "${RED}❌ Security scan FAILED - Too many high-severity vulnerabilities${NC}"
    jq '.overall_status = "failed"' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    exit 1
elif [[ $HIGH -gt 0 ]]; then
    echo -e "${YELLOW}⚠️  Security scan PASSED with warnings${NC}"
    jq '.overall_status = "warning"' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    exit 0
else
    echo -e "${GREEN}✅ Security scan PASSED${NC}"
    jq '.overall_status = "passed"' "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    exit 0
fi