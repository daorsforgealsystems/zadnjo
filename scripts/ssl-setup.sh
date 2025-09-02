#!/bin/bash

# SSL Certificate Setup Script
# This script automates SSL certificate setup using Let's Encrypt

set -e

# Configuration
DOMAIN=${1:-"yourdomain.com"}
EMAIL=${2:-"admin@$DOMAIN"}
WEBROOT=${3:-"/var/www/html"}
CERTBOT_ARGS=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root"
        exit 1
    fi

    # Check if domain resolves
    if ! nslookup $DOMAIN >/dev/null 2>&1; then
        log_error "Domain $DOMAIN does not resolve. Please configure DNS first."
        exit 1
    fi

    # Check if ports are open
    if ! nc -z localhost 80 >/dev/null 2>&1; then
        log_warn "Port 80 is not open. Make sure your web server is running."
    fi

    log_info "Prerequisites check completed"
}

install_certbot() {
    log_info "Installing Certbot..."

    # Detect OS
    if command -v apt >/dev/null 2>&1; then
        apt update
        apt install -y certbot python3-certbot-nginx
    elif command -v yum >/dev/null 2>&1; then
        yum install -y certbot python3-certbot-nginx
    elif command -v dnf >/dev/null 2>&1; then
        dnf install -y certbot python3-certbot-nginx
    else
        log_error "Unsupported package manager. Please install Certbot manually."
        exit 1
    fi

    log_info "Certbot installed successfully"
}

setup_ssl_certificate() {
    log_info "Setting up SSL certificate for $DOMAIN..."

    # Create webroot directory if it doesn't exist
    mkdir -p $WEBROOT

    # Request certificate
    if certbot certonly --webroot -w $WEBROOT -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive; then
        log_info "SSL certificate obtained successfully"
    else
        log_error "Failed to obtain SSL certificate"
        exit 1
    fi
}

configure_nginx() {
    log_info "Configuring Nginx for SSL..."

    NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"

    cat > $NGINX_CONF << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    # Enable site
    ln -sf $NGINX_CONF /etc/nginx/sites-enabled/

    # Test configuration
    nginx -t

    # Reload nginx
    systemctl reload nginx

    log_info "Nginx configured for SSL"
}

setup_auto_renewal() {
    log_info "Setting up automatic certificate renewal..."

    # Add renewal to crontab
    CRON_JOB="0 */12 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'"

    # Check if cron job already exists
    if ! crontab -l | grep -q "certbot renew"; then
        (crontab -l ; echo "$CRON_JOB") | crontab -
        log_info "Auto-renewal cron job added"
    else
        log_info "Auto-renewal cron job already exists"
    fi
}

verify_ssl() {
    log_info "Verifying SSL certificate..."

    # Wait for certificate to be active
    sleep 5

    # Check certificate
    if openssl s_client -connect $DOMAIN:443 -servername $DOMAIN </dev/null 2>/dev/null | openssl x509 -noout -dates >/dev/null 2>&1; then
        log_info "SSL certificate is valid"

        # Get certificate info
        echo "Certificate details:"
        openssl s_client -connect $DOMAIN:443 -servername $DOMAIN </dev/null 2>/dev/null | openssl x509 -noout -subject -issuer -dates
    else
        log_error "SSL certificate verification failed"
        exit 1
    fi
}

# Main execution
main() {
    echo "SSL Certificate Setup for $DOMAIN"
    echo "================================="

    check_prerequisites
    install_certbot
    setup_ssl_certificate
    configure_nginx
    setup_auto_renewal
    verify_ssl

    log_info "SSL setup completed successfully!"
    log_info "Your site is now available at https://$DOMAIN"
    log_info "Certificates will auto-renew every 12 hours"
}

# Run main function
main "$@"