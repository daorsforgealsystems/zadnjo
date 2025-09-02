#!/bin/bash

# SSL Certificate Renewal Script
# This script handles automated SSL certificate renewal

set -e

# Configuration
LOG_FILE="/var/log/ssl-renewal.log"
EMAIL=${1:-"admin@yourdomain.com"}
WEBROOT=${2:-"/var/www/html"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') ${GREEN}[INFO]${NC} $1" | tee -a $LOG_FILE
}

log_warn() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') ${YELLOW}[WARN]${NC} $1" | tee -a $LOG_FILE
}

log_error() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') ${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE
}

check_certificates() {
    log_info "Checking certificate expiration dates..."

    CERT_DIR="/etc/letsencrypt/live"

    if [ ! -d "$CERT_DIR" ]; then
        log_error "Let's Encrypt certificate directory not found"
        exit 1
    fi

    for domain_dir in $CERT_DIR/*; do
        if [ -d "$domain_dir" ]; then
            domain=$(basename $domain_dir)
            cert_file="$domain_dir/fullchain.pem"

            if [ -f "$cert_file" ]; then
                # Get expiration date
                expiry_date=$(openssl x509 -in $cert_file -noout -enddate | cut -d= -f2)
                expiry_epoch=$(date -d "$expiry_date" +%s)
                current_epoch=$(date +%s)
                days_left=$(( ($expiry_epoch - $current_epoch) / 86400 ))

                log_info "Certificate for $domain expires in $days_left days"

                if [ $days_left -le 30 ]; then
                    log_warn "Certificate for $domain expires soon ($days_left days)"
                    return 0  # Needs renewal
                fi
            fi
        fi
    done

    return 1  # No renewal needed
}

renew_certificates() {
    log_info "Attempting to renew certificates..."

    # Dry run first
    if certbot renew --dry-run; then
        log_info "Dry run successful, proceeding with actual renewal"

        # Actual renewal
        if certbot renew --quiet; then
            log_info "Certificate renewal successful"
            return 0
        else
            log_error "Certificate renewal failed"
            return 1
        fi
    else
        log_error "Dry run failed, not proceeding with renewal"
        return 1
    fi
}

reload_services() {
    log_info "Reloading web services..."

    # Reload nginx
    if systemctl is-active --quiet nginx; then
        if systemctl reload nginx; then
            log_info "Nginx reloaded successfully"
        else
            log_error "Failed to reload nginx"
            return 1
        fi
    fi

    # Reload apache2
    if systemctl is-active --quiet apache2; then
        if systemctl reload apache2; then
            log_info "Apache reloaded successfully"
        else
            log_error "Failed to reload apache2"
            return 1
        fi
    fi

    return 0
}

send_notification() {
    local subject="$1"
    local message="$2"

    # Send email notification if mail is available
    if command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "$subject" $EMAIL
        log_info "Notification email sent to $EMAIL"
    else
        log_warn "Mail command not available, skipping email notification"
    fi
}

verify_renewal() {
    log_info "Verifying certificate renewal..."

    CERT_DIR="/etc/letsencrypt/live"

    for domain_dir in $CERT_DIR/*; do
        if [ -d "$domain_dir" ]; then
            domain=$(basename $domain_dir)
            cert_file="$domain_dir/fullchain.pem"

            if [ -f "$cert_file" ]; then
                # Test SSL connection
                if openssl s_client -connect $domain:443 -servername $domain </dev/null 2>/dev/null | openssl x509 -noout >/dev/null 2>&1; then
                    log_info "SSL certificate for $domain is valid"
                else
                    log_error "SSL certificate for $domain is invalid"
                    return 1
                fi
            fi
        fi
    done

    return 0
}

cleanup_old_certificates() {
    log_info "Cleaning up old certificates..."

    # Certbot automatically cleans up old certificates
    # This is just for additional cleanup if needed
    certbot delete --cert-name dummy 2>/dev/null || true
}

# Main execution
main() {
    log_info "Starting SSL certificate renewal process"

    # Check if renewal is needed
    if check_certificates; then
        log_info "Certificates need renewal"

        # Attempt renewal
        if renew_certificates; then
            # Reload services
            if reload_services; then
                # Verify renewal
                if verify_renewal; then
                    log_info "SSL certificate renewal completed successfully"
                    send_notification "SSL Certificate Renewal Successful" "SSL certificates have been renewed successfully."
                else
                    log_error "SSL certificate verification failed"
                    send_notification "SSL Certificate Renewal Failed" "SSL certificate verification failed after renewal."
                    exit 1
                fi
            else
                log_error "Failed to reload web services"
                send_notification "SSL Certificate Renewal Failed" "Failed to reload web services after certificate renewal."
                exit 1
            fi
        else
            log_error "Certificate renewal failed"
            send_notification "SSL Certificate Renewal Failed" "Certificate renewal process failed."
            exit 1
        fi
    else
        log_info "No certificates need renewal at this time"
    fi

    # Cleanup
    cleanup_old_certificates

    log_info "SSL certificate renewal process completed"
}

# Run main function
main "$@"