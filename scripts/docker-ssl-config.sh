#!/bin/bash

# Docker SSL Configuration Script
# This script sets up SSL certificates for Docker containers

set -e

# Configuration
DOMAIN=${1:-"yourdomain.com"}
EMAIL=${2:-"admin@$DOMAIN"}
DOCKER_COMPOSE_FILE=${3:-"docker-compose.yml"}
SSL_DIR="./ssl"

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

    # Check if Docker is installed
    if ! command -v docker >/dev/null 2>&1; then
        log_error "Docker is not installed"
        exit 1
    fi

    # Check if Docker Compose is installed
    if ! command -v docker-compose >/dev/null 2>&1; then
        log_error "Docker Compose is not installed"
        exit 1
    fi

    # Check if domain resolves
    if ! nslookup $DOMAIN >/dev/null 2>&1; then
        log_error "Domain $DOMAIN does not resolve"
        exit 1
    fi

    log_info "Prerequisites check completed"
}

setup_ssl_directory() {
    log_info "Setting up SSL directory structure..."

    # Create SSL directory
    mkdir -p $SSL_DIR
    mkdir -p $SSL_DIR/certs
    mkdir -p $SSL_DIR/private

    # Create .gitkeep files to ensure directories are tracked
    touch $SSL_DIR/certs/.gitkeep
    touch $SSL_DIR/private/.gitkeep

    # Set proper permissions
    chmod 755 $SSL_DIR
    chmod 755 $SSL_DIR/certs
    chmod 700 $SSL_DIR/private

    log_info "SSL directory structure created"
}

generate_self_signed_cert() {
    log_info "Generating self-signed certificate for initial setup..."

    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout $SSL_DIR/private/$DOMAIN.key \
        -out $SSL_DIR/certs/$DOMAIN.crt \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"

    # Create fullchain.pem (same as cert for self-signed)
    cp $SSL_DIR/certs/$DOMAIN.crt $SSL_DIR/certs/fullchain.pem

    log_info "Self-signed certificate generated"
}

setup_letsencrypt_cert() {
    log_info "Setting up Let's Encrypt certificate..."

    # Check if certbot is available
    if ! command -v certbot >/dev/null 2>&1; then
        log_warn "Certbot not found, using self-signed certificate"
        generate_self_signed_cert
        return
    fi

    # Create temporary webroot for challenge
    TEMP_WEBROOT="/tmp/certbot-webroot"
    mkdir -p $TEMP_WEBROOT

    # Request certificate
    if certbot certonly --webroot -w $TEMP_WEBROOT -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive; then
        # Copy certificates to SSL directory
        cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $SSL_DIR/certs/
        cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $SSL_DIR/private/

        log_info "Let's Encrypt certificate obtained"
    else
        log_warn "Failed to obtain Let's Encrypt certificate, using self-signed"
        generate_self_signed_cert
    fi

    # Cleanup
    rm -rf $TEMP_WEBROOT
}

create_nginx_config() {
    log_info "Creating Nginx configuration for Docker..."

    cat > nginx.conf << EOF
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Upstream for app
    upstream app {
        server app:3000;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name $DOMAIN www.$DOMAIN;
        return 301 https://\$server_name\$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name $DOMAIN www.$DOMAIN;

        # SSL configuration
        ssl_certificate /etc/ssl/certs/fullchain.pem;
        ssl_certificate_key /etc/ssl/private/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=63072000" always;

        # Proxy to app
        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
        }

        # Static files
        location /static/ {
            alias /app/static/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOF

    log_info "Nginx configuration created"
}

create_docker_compose() {
    log_info "Creating Docker Compose configuration..."

    cat > $DOCKER_COMPOSE_FILE << EOF
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/ssl:ro
      - nginx_logs:/var/log/nginx
    depends_on:
      - app
    restart: unless-stopped

  app:
    build: .
    environment:
      - NODE_ENV=production
      - SSL_CERT_PATH=/etc/ssl/certs/fullchain.pem
      - SSL_KEY_PATH=/etc/ssl/private/privkey.pem
    volumes:
      - ./ssl:/etc/ssl:ro
    restart: unless-stopped

volumes:
  nginx_logs:
EOF

    log_info "Docker Compose configuration created"
}

create_dockerfile() {
    log_info "Creating sample Dockerfile..."

    cat > Dockerfile << EOF
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
EOF

    log_info "Dockerfile created"
}

setup_renewal_script() {
    log_info "Setting up certificate renewal script..."

    cat > ssl-renewal-docker.sh << EOF
#!/bin/bash
# SSL Certificate Renewal for Docker

DOMAIN="$DOMAIN"
SSL_DIR="$SSL_DIR"
EMAIL="$EMAIL"

# Renew certificate
certbot certonly --webroot -w /tmp/certbot-webroot -d \$DOMAIN -d www.\$DOMAIN --email \$EMAIL --agree-tos --non-interactive

# Copy new certificates
cp /etc/letsencrypt/live/\$DOMAIN/fullchain.pem \$SSL_DIR/certs/
cp /etc/letsencrypt/live/\$DOMAIN/privkey.pem \$SSL_DIR/private/

# Reload nginx
docker-compose restart nginx

echo "SSL certificate renewed and nginx reloaded"
EOF

    chmod +x ssl-renewal-docker.sh

    log_info "Renewal script created"
}

verify_setup() {
    log_info "Verifying Docker SSL setup..."

    # Check if certificates exist
    if [ -f "$SSL_DIR/certs/fullchain.pem" ] && [ -f "$SSL_DIR/private/privkey.pem" ]; then
        log_info "SSL certificates found"
    else
        log_error "SSL certificates not found"
        exit 1
    fi

    # Validate certificate
    if openssl x509 -in $SSL_DIR/certs/fullchain.pem -noout -subject >/dev/null 2>&1; then
        log_info "SSL certificate is valid"
    else
        log_error "SSL certificate is invalid"
        exit 1
    fi

    log_info "Docker SSL setup verification completed"
}

# Main execution
main() {
    echo "Docker SSL Configuration for $DOMAIN"
    echo "==================================="

    check_prerequisites
    setup_ssl_directory
    setup_letsencrypt_cert
    create_nginx_config
    create_docker_compose
    create_dockerfile
    setup_renewal_script
    verify_setup

    log_info "Docker SSL setup completed successfully!"
    log_info "Run 'docker-compose up -d' to start your application"
    log_info "Certificates will be available at $SSL_DIR"
}

# Run main function
main "$@"