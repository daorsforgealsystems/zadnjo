#!/bin/bash

# SSL Certificate Verification Script
# This script validates SSL certificates and their configuration

set -e

# Configuration
DOMAIN=${1:-"yourdomain.com"}
PORT=${2:-"443"}
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

check_ssl_connection() {
    local domain=$1
    local port=$2

    log_header "Checking SSL connection to $domain:$port"

    if openssl s_client -connect $domain:$port -servername $domain </dev/null 2>/dev/null | openssl x509 -noout >/dev/null 2>&1; then
        log_info "SSL connection successful"
        return 0
    else
        log_error "SSL connection failed"
        return 1
    fi
}

get_certificate_info() {
    local domain=$1
    local port=$2

    log_header "Getting certificate information for $domain"

    local cert_info
    if ! cert_info=$(openssl s_client -connect $domain:$port -servername $domain </dev/null 2>/dev/null | openssl x509 -noout -text 2>/dev/null); then
        log_error "Failed to retrieve certificate information"
        return 1
    fi

    echo "Certificate Information:"
    echo "======================="
    echo "$cert_info"
    echo
}

check_certificate_validity() {
    local domain=$1
    local port=$2

    log_header "Checking certificate validity for $domain"

    local expiry_info
    if ! expiry_info=$(openssl s_client -connect $domain:$port -servername $domain </dev/null 2>/dev/null | openssl x509 -noout -dates 2>/dev/null); then
        log_error "Failed to check certificate validity"
        return 1
    fi

    local not_before=$(echo "$expiry_info" | grep "notBefore" | cut -d= -f2)
    local not_after=$(echo "$expiry_info" | grep "notAfter" | cut -d= -f2)

    echo "Valid From: $not_before"
    echo "Valid Until: $not_after"

    # Check if certificate is expired
    local expiry_epoch=$(date -d "$not_after" +%s 2>/dev/null || echo "0")
    local current_epoch=$(date +%s)
    local days_left=$(( ($expiry_epoch - $current_epoch) / 86400 ))

    if [ $days_left -gt 30 ]; then
        log_info "Certificate is valid for $days_left more days"
    elif [ $days_left -gt 0 ]; then
        log_warn "Certificate expires in $days_left days"
    else
        log_error "Certificate has expired"
        return 1
    fi
}

check_certificate_chain() {
    local domain=$1
    local port=$2

    log_header "Checking certificate chain for $domain"

    local chain_info
    if ! chain_info=$(openssl s_client -connect $domain:$port -servername $domain -showcerts </dev/null 2>/dev/null); then
        log_error "Failed to check certificate chain"
        return 1
    fi

    local cert_count=$(echo "$chain_info" | grep -c "BEGIN CERTIFICATE")

    echo "Certificates in chain: $cert_count"

    if [ $cert_count -ge 2 ]; then
        log_info "Certificate chain appears complete"
    else
        log_warn "Certificate chain may be incomplete"
    fi
}

check_ssl_protocols() {
    local domain=$1
    local port=$2

    log_header "Checking supported SSL/TLS protocols for $domain"

    local protocols=("ssl2" "ssl3" "tls1" "tls1_1" "tls1_2" "tls1_3")

    for protocol in "${protocols[@]}"; do
        if openssl s_client -connect $domain:$port -$protocol -servername $domain </dev/null 2>/dev/null | openssl x509 -noout >/dev/null 2>&1; then
            if [[ "$protocol" == "ssl2" || "$protocol" == "ssl3" || "$protocol" == "tls1" || "$protocol" == "tls1_1" ]]; then
                log_warn "Deprecated protocol $protocol is supported"
            else
                log_info "Protocol $protocol is supported"
            fi
        else
            log_info "Protocol $protocol is not supported"
        fi
    done
}

check_ssl_ciphers() {
    local domain=$1
    local port=$2

    log_header "Checking SSL cipher suites for $domain"

    local cipher_info
    if ! cipher_info=$(openssl s_client -connect $domain:$port -servername $domain -cipher "ALL" </dev/null 2>/dev/null | grep -E "New|Cipher"); then
        log_error "Failed to check cipher suites"
        return 1
    fi

    echo "Cipher Information:"
    echo "$cipher_info"
}

check_hsts() {
    local domain=$1
    local port=$2

    log_header "Checking HTTP Strict Transport Security (HSTS) for $domain"

    local hsts_header
    if ! hsts_header=$(curl -s -I https://$domain:$port 2>/dev/null | grep -i "strict-transport-security"); then
        log_warn "HSTS header not found"
        return 1
    fi

    echo "HSTS Header: $hsts_header"

    # Check if max-age is reasonable (at least 6 months)
    local max_age=$(echo "$hsts_header" | grep -o "max-age=[0-9]*" | cut -d= -f2)
    if [ -n "$max_age" ] && [ $max_age -ge 15552000 ]; then  # 6 months in seconds
        log_info "HSTS max-age is sufficient ($max_age seconds)"
    else
        log_warn "HSTS max-age may be too short"
    fi
}

check_ssl_labs_rating() {
    local domain=$1

    log_header "Checking SSL Labs rating for $domain"

    # Note: This would require external API call to SSL Labs
    # For now, we'll just mention it
    log_info "SSL Labs rating check requires external API"
    log_info "Visit https://www.ssllabs.com/ssltest/analyze.html?d=$domain for detailed analysis"
}

generate_ssl_report() {
    local domain=$1
    local report_file="ssl-verification-report-$(date +%Y%m%d-%H%M%S).txt"

    log_info "Generating SSL verification report: $report_file"

    {
        echo "SSL Certificate Verification Report"
        echo "=================================="
        echo "Domain: $domain"
        echo "Port: $PORT"
        echo "Date: $(date)"
        echo ""
    } > "$report_file"

    log_info "Report saved to $report_file"
}

# Main execution
main() {
    echo "SSL Certificate Verification for $DOMAIN:$PORT"
    echo "============================================="

    # Check SSL connection
    if ! check_ssl_connection "$DOMAIN" "$PORT"; then
        log_error "Cannot proceed with SSL verification due to connection failure"
        exit 1
    fi

    echo

    # Get certificate information
    get_certificate_info "$DOMAIN" "$PORT"

    # Check certificate validity
    check_certificate_validity "$DOMAIN" "$PORT"

    echo

    # Check certificate chain
    check_certificate_chain "$DOMAIN" "$PORT"

    echo

    # Check supported protocols
    check_ssl_protocols "$DOMAIN" "$PORT"

    echo

    # Check cipher suites
    check_ssl_ciphers "$DOMAIN" "$PORT"

    echo

    # Check HSTS
    check_hsts "$DOMAIN" "$PORT"

    echo

    # SSL Labs rating info
    check_ssl_labs_rating "$DOMAIN"

    echo

    # Generate report
    generate_ssl_report "$DOMAIN"

    log_info "SSL verification completed"
}

# Show usage if no arguments provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <domain> [port]"
    echo "Example: $0 example.com 443"
    exit 1
fi

# Run main function
main "$@"