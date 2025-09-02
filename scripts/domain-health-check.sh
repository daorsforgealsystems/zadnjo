#!/bin/bash

# Domain Health Check Script
# This script performs comprehensive health checks for domain setup

set -e

# Configuration
DOMAIN=${1:-"yourdomain.com"}
EXPECTED_IP=${2:-""}
CHECK_INTERVAL=${3:-300}  # 5 minutes default
MAX_CHECKS=${4:-10}      # Maximum number of checks

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') ${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') ${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') ${RED}[ERROR]${NC} $1"
}

log_header() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

check_domain_resolution() {
    local domain=$1

    log_header "Checking domain resolution for $domain"

    if nslookup $domain >/dev/null 2>&1; then
        local ip=$(nslookup $domain 2>/dev/null | grep "Address:" | tail -1 | awk '{print $2}')
        log_info "Domain resolves to: $ip"

        if [ -n "$EXPECTED_IP" ] && [ "$ip" != "$EXPECTED_IP" ]; then
            log_warn "IP address does not match expected value (expected: $EXPECTED_IP, got: $ip)"
            return 1
        fi

        return 0
    else
        log_error "Domain $domain does not resolve"
        return 1
    fi
}

check_http_response() {
    local url=$1
    local expected_code=${2:-200}

    log_header "Checking HTTP response for $url"

    local response_code
    if ! response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null); then
        log_error "Failed to connect to $url"
        return 1
    fi

    if [ "$response_code" = "$expected_code" ]; then
        log_info "HTTP response code: $response_code (expected: $expected_code)"
        return 0
    else
        log_warn "HTTP response code: $response_code (expected: $expected_code)"
        return 1
    fi
}

check_https_redirect() {
    local domain=$1

    log_header "Checking HTTPS redirect for $domain"

    local response_code
    if ! response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "http://$domain" 2>/dev/null); then
        log_error "Failed to connect to http://$domain"
        return 1
    fi

    if [ "$response_code" = "301" ] || [ "$response_code" = "302" ]; then
        log_info "HTTP to HTTPS redirect working (response: $response_code)"
        return 0
    else
        log_warn "HTTP to HTTPS redirect not working (response: $response_code)"
        return 1
    fi
}

check_ssl_certificate() {
    local domain=$1

    log_header "Checking SSL certificate for $domain"

    if openssl s_client -connect $domain:443 -servername $domain </dev/null 2>/dev/null | openssl x509 -noout -checkend 86400 >/dev/null 2>&1; then
        log_info "SSL certificate is valid and not expiring within 24 hours"
        return 0
    else
        log_error "SSL certificate is invalid or expiring soon"
        return 1
    fi
}

check_dns_propagation() {
    local domain=$1

    log_header "Checking DNS propagation for $domain"

    local dns_servers=("8.8.8.8" "1.1.1.1" "208.67.222.222")
    local success_count=0

    for dns_server in "${dns_servers[@]}"; do
        if dig @$dns_server $domain A +short +timeout=5 >/dev/null 2>&1; then
            ((success_count++))
        fi
    done

    local total_servers=${#dns_servers[@]}
    local success_rate=$((success_count * 100 / total_servers))

    if [ $success_rate -ge 67 ]; then  # At least 2 out of 3
        log_info "DNS propagation: $success_rate% ($success_count/$total_servers servers)"
        return 0
    else
        log_warn "DNS propagation: $success_rate% ($success_count/$total_servers servers)"
        return 1
    fi
}

check_website_content() {
    local url=$1
    local search_string=${2:-""}

    log_header "Checking website content for $url"

    local content
    if ! content=$(curl -s --max-time 10 "$url" 2>/dev/null); then
        log_error "Failed to retrieve content from $url"
        return 1
    fi

    if [ -n "$search_string" ]; then
        if echo "$content" | grep -q "$search_string"; then
            log_info "Content check passed (found: $search_string)"
            return 0
        else
            log_warn "Content check failed (not found: $search_string)"
            return 1
        fi
    else
        local content_length=${#content}
        log_info "Content retrieved successfully ($content_length characters)"
        return 0
    fi
}

check_response_time() {
    local url=$1
    local max_time=${2:-5000}  # 5 seconds default

    log_header "Checking response time for $url"

    local response_time
    if ! response_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time 10 "$url" 2>/dev/null | awk '{printf "%.0f", $1 * 1000}'); then
        log_error "Failed to measure response time for $url"
        return 1
    fi

    if [ $response_time -le $max_time ]; then
        log_info "Response time: ${response_time}ms (max allowed: ${max_time}ms)"
        return 0
    else
        log_warn "Response time: ${response_time}ms (max allowed: ${max_time}ms)"
        return 1
    fi
}

send_notification() {
    local subject="$1"
    local message="$2"
    local email=${3:-"admin@$DOMAIN"}

    # Send email notification if mail is available
    if command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "$subject" $email
        log_info "Notification email sent to $email"
    else
        log_warn "Mail command not available, skipping email notification"
    fi
}

run_health_checks() {
    local check_number=$1
    local issues_found=0

    log_info "Starting health check #$check_number for $DOMAIN"

    # Domain resolution
    if ! check_domain_resolution "$DOMAIN"; then
        ((issues_found++))
    fi

    echo

    # DNS propagation
    if ! check_dns_propagation "$DOMAIN"; then
        ((issues_found++))
    fi

    echo

    # SSL certificate
    if ! check_ssl_certificate "$DOMAIN"; then
        ((issues_found++))
    fi

    echo

    # HTTPS redirect
    if ! check_https_redirect "$DOMAIN"; then
        ((issues_found++))
    fi

    echo

    # HTTP response
    if ! check_http_response "https://$DOMAIN"; then
        ((issues_found++))
    fi

    echo

    # Response time
    if ! check_response_time "https://$DOMAIN"; then
        ((issues_found++))
    fi

    echo

    # Website content (optional)
    check_website_content "https://$DOMAIN"

    echo

    if [ $issues_found -eq 0 ]; then
        log_info "Health check #$check_number completed - All checks passed"
        return 0
    else
        log_warn "Health check #$check_number completed - $issues_found issues found"
        return 1
    fi
}

generate_report() {
    local domain=$1
    local report_file="domain-health-report-$(date +%Y%m%d-%H%M%S).txt"

    log_info "Generating health check report: $report_file"

    {
        echo "Domain Health Check Report"
        echo "=========================="
        echo "Domain: $domain"
        echo "Date: $(date)"
        echo "Expected IP: ${EXPECTED_IP:-Not specified}"
        echo ""
        echo "This report contains the results of automated health checks"
        echo "for DNS propagation, SSL certificates, and website availability."
        echo ""
    } > "$report_file"

    log_info "Report saved to $report_file"
}

# Main execution
main() {
    echo "Domain Health Check for $DOMAIN"
    echo "==============================="

    local consecutive_failures=0
    local check_count=0

    while [ $check_count -lt $MAX_CHECKS ]; do
        ((check_count++))

        if run_health_checks $check_count; then
            consecutive_failures=0
            log_info "All health checks passed"

            if [ $check_count -eq 1 ]; then
                send_notification "Domain Health Check Passed" "All health checks passed for $DOMAIN"
            fi
        else
            ((consecutive_failures++))
            log_warn "Health check failed (consecutive failures: $consecutive_failures)"

            if [ $consecutive_failures -ge 3 ]; then
                send_notification "Domain Health Check Failed" "Multiple consecutive health check failures for $DOMAIN. Please investigate."
            fi
        fi

        if [ $check_count -lt $MAX_CHECKS ]; then
            log_info "Waiting $CHECK_INTERVAL seconds before next check..."
            sleep $CHECK_INTERVAL
        fi
    done

    # Generate final report
    generate_report "$DOMAIN"

    log_info "Domain health monitoring completed ($check_count checks performed)"
}

# Show usage if no arguments provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <domain> [expected_ip] [check_interval_seconds] [max_checks]"
    echo "Example: $0 example.com 192.168.1.1 300 10"
    exit 1
fi

# Run main function
main "$@"