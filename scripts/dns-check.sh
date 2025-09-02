#!/bin/bash

# DNS Propagation Check Script
# This script checks DNS propagation across multiple nameservers

set -e

# Configuration
DOMAIN=${1:-"yourdomain.com"}
EXPECTED_IP=${2:-""}
DNS_SERVERS=("8.8.8.8" "1.1.1.1" "208.67.222.222" "8.8.4.4" "1.0.0.1")
TIMEOUT=10

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

check_dns_record() {
    local record_type=$1
    local name=$2
    local expected_value=$3
    local dns_server=$4

    log_header "Checking $record_type record for $name on $dns_server"

    local result
    if ! result=$(dig @$dns_server $name $record_type +short +timeout=$TIMEOUT 2>/dev/null); then
        log_error "Failed to query $dns_server for $record_type $name"
        return 1
    fi

    if [ -z "$result" ]; then
        log_warn "No $record_type record found for $name on $dns_server"
        return 1
    fi

    echo "Result: $result"

    if [ -n "$expected_value" ]; then
        if echo "$result" | grep -q "$expected_value"; then
            log_info "$record_type record matches expected value"
            return 0
        else
            log_warn "$record_type record does not match expected value (expected: $expected_value)"
            return 1
        fi
    fi

    return 0
}

check_a_record() {
    local name=$1
    local expected_ip=$2

    log_header "Checking A record propagation for $name"

    local results=()
    local success_count=0

    for dns_server in "${DNS_SERVERS[@]}"; do
        if check_dns_record "A" "$name" "$expected_ip" "$dns_server"; then
            ((success_count++))
        fi
        echo
    done

    local total_servers=${#DNS_SERVERS[@]}
    local success_rate=$((success_count * 100 / total_servers))

    if [ $success_rate -ge 80 ]; then
        log_info "A record propagation: $success_rate% ($success_count/$total_servers servers)"
    else
        log_warn "A record propagation: $success_rate% ($success_count/$total_servers servers) - May still be propagating"
    fi
}

check_cname_record() {
    local name=$1
    local expected_target=$2

    log_header "Checking CNAME record for $name"

    local result
    if ! result=$(dig $name CNAME +short 2>/dev/null); then
        log_error "Failed to check CNAME record for $name"
        return 1
    fi

    if [ -z "$result" ]; then
        log_warn "No CNAME record found for $name"
        return 1
    fi

    echo "CNAME: $result"

    if [ -n "$expected_target" ]; then
        if [ "$result" = "$expected_target" ]; then
            log_info "CNAME record matches expected target"
        else
            log_warn "CNAME record does not match expected target (expected: $expected_target)"
        fi
    fi
}

check_mx_records() {
    local domain=$1

    log_header "Checking MX records for $domain"

    local result
    if ! result=$(dig $domain MX +short 2>/dev/null | sort -n); then
        log_error "Failed to check MX records for $domain"
        return 1
    fi

    if [ -z "$result" ]; then
        log_warn "No MX records found for $domain"
        return 1
    fi

    echo "MX Records:"
    echo "$result"
}

check_ns_records() {
    local domain=$1

    log_header "Checking NS records for $domain"

    local result
    if ! result=$(dig $domain NS +short 2>/dev/null | sort); then
        log_error "Failed to check NS records for $domain"
        return 1
    fi

    if [ -z "$result" ]; then
        log_warn "No NS records found for $domain"
        return 1
    fi

    echo "Name Servers:"
    echo "$result"
}

check_txt_records() {
    local name=$1
    local expected_value=$2

    log_header "Checking TXT records for $name"

    local result
    if ! result=$(dig $name TXT +short 2>/dev/null); then
        log_error "Failed to check TXT records for $name"
        return 1
    fi

    if [ -z "$result" ]; then
        log_warn "No TXT records found for $name"
        return 1
    fi

    echo "TXT Records:"
    echo "$result"

    if [ -n "$expected_value" ]; then
        if echo "$result" | grep -q "$expected_value"; then
            log_info "TXT record contains expected value"
        else
            log_warn "TXT record does not contain expected value"
        fi
    fi
}

check_domain_resolution() {
    local domain=$1

    log_header "Checking domain resolution for $domain"

    # Check if domain resolves
    if nslookup $domain >/dev/null 2>&1; then
        local ip=$(nslookup $domain 2>/dev/null | grep "Address:" | tail -1 | awk '{print $2}')
        log_info "Domain resolves to: $ip"
        return 0
    else
        log_error "Domain $domain does not resolve"
        return 1
    fi
}

generate_report() {
    local domain=$1
    local report_file="dns-check-report-$(date +%Y%m%d-%H%M%S).txt"

    log_info "Generating DNS check report: $report_file"

    {
        echo "DNS Propagation Check Report"
        echo "============================"
        echo "Domain: $domain"
        echo "Date: $(date)"
        echo ""
        echo "DNS Servers Checked:"
        printf '%s\n' "${DNS_SERVERS[@]}"
        echo ""
    } > "$report_file"

    log_info "Report saved to $report_file"
}

# Main execution
main() {
    echo "DNS Propagation Check for $DOMAIN"
    echo "=================================="

    # Basic domain resolution check
    if ! check_domain_resolution "$DOMAIN"; then
        log_error "Domain resolution failed. Please check DNS configuration."
        exit 1
    fi

    echo

    # Check A record propagation
    check_a_record "$DOMAIN" "$EXPECTED_IP"

    echo

    # Check www subdomain
    check_a_record "www.$DOMAIN" "$EXPECTED_IP"

    echo

    # Check CNAME for www if it's a CNAME
    check_cname_record "www.$DOMAIN"

    echo

    # Check MX records
    check_mx_records "$DOMAIN"

    echo

    # Check NS records
    check_ns_records "$DOMAIN"

    echo

    # Check SPF TXT record
    check_txt_records "$DOMAIN" "v=spf1"

    echo

    # Generate report
    generate_report "$DOMAIN"

    log_info "DNS check completed"
    log_info "Note: DNS propagation can take up to 48 hours globally"
}

# Show usage if no arguments provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <domain> [expected_ip]"
    echo "Example: $0 example.com 192.168.1.1"
    exit 1
fi

# Run main function
main "$@"