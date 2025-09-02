# SSL Certificate Setup Guide

This guide covers comprehensive SSL/TLS certificate setup and management for production environments, including automation scripts and best practices.

## Table of Contents

1. [SSL Certificate Types](#ssl-certificate-types)
2. [Let's Encrypt Automation](#lets-encrypt-automation)
3. [SSL Certificate Installation](#ssl-certificate-installation)
4. [Certificate Renewal Automation](#certificate-renewal-automation)
5. [Docker SSL Configuration](#docker-ssl-configuration)
6. [Security Best Practices](#security-best-practices)
7. [Troubleshooting](#troubleshooting)

## SSL Certificate Types

### Domain Validated (DV)
- Basic validation
- Suitable for most websites
- Issued quickly (minutes to hours)

### Organization Validated (OV)
- Validates domain and organization
- Shows organization name in certificate
- Takes longer to issue (days)

### Extended Validation (EV)
- Highest level of validation
- Shows organization name in browser address bar
- Most expensive and time-consuming

## Let's Encrypt Automation

### Prerequisites

1. Domain pointing to your server
2. Port 80 and 443 open
3. Web server installed (nginx/apache)

### Installation

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

### Certificate Issuance

```bash
# For nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# For apache
sudo certbot --apache -d yourdomain.com -d www.yourdomain.com

# Standalone (no web server)
sudo certbot certonly --standalone -d yourdomain.com
```

### Wildcard Certificates

```bash
# DNS challenge for wildcard
sudo certbot certonly --manual --preferred-challenges dns -d "*.yourdomain.com"
```

## SSL Certificate Installation

### Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### Apache Configuration

```apache
<VirtualHost *:443>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/yourdomain.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/yourdomain.com/privkey.pem

    # SSL Protocol and Cipher Configuration
    SSLProtocol all -SSLv2 -SSLv3 -TLSv1 -TLSv1.1
    SSLCipherSuite ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384

    # HSTS
    Header always set Strict-Transport-Security "max-age=63072000"

    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
</VirtualHost>

<VirtualHost *:80>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    Redirect permanent / https://yourdomain.com/
</VirtualHost>
```

## Certificate Renewal Automation

### Automatic Renewal Setup

```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab for automatic renewal
sudo crontab -e

# Add this line (runs twice daily)
0 */12 * * * /usr/bin/certbot renew --quiet
```

### Custom Renewal Script

```bash
#!/bin/bash
# ssl-renewal.sh

DOMAIN="yourdomain.com"
EMAIL="admin@yourdomain.com"
WEBROOT="/var/www/html"

# Renew certificate
certbot certonly --webroot -w $WEBROOT -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive

# Reload web server
if [ $? -eq 0 ]; then
    systemctl reload nginx
    echo "SSL certificate renewed and nginx reloaded"
else
    echo "SSL renewal failed"
    exit 1
fi
```

## Docker SSL Configuration

### Docker Compose with SSL

```yaml
version: '3.8'
services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
      - ./web:/var/www/html
    depends_on:
      - app

  app:
    build: .
    environment:
      - NODE_ENV=production
    volumes:
      - ./ssl:/app/ssl:ro
```

### Nginx Configuration for Docker

```nginx
upstream app {
    server app:3000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/ssl/certs/fullchain.pem;
    ssl_certificate_key /etc/ssl/certs/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;

    location / {
        proxy_pass http://app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Security Best Practices

### SSL/TLS Configuration

1. **Use Strong Ciphers**
   - Disable weak ciphers (RC4, 3DES)
   - Prefer ECDHE key exchange
   - Use AES-GCM ciphers

2. **Enable HSTS**
   - Set appropriate max-age (6 months minimum)
   - Include subdomains if applicable
   - Use preload if possible

3. **Certificate Transparency**
   - Monitor certificate logs
   - Use CT-enabled certificates

### Key Management

1. **Private Key Protection**
   - Store private keys securely
   - Use file permissions (600)
   - Consider HSM for high-security environments

2. **Key Rotation**
   - Rotate keys regularly
   - Use different keys for different purposes
   - Implement key backup procedures

### Monitoring and Alerts

1. **Certificate Expiration Monitoring**
   - Set up alerts 30 days before expiration
   - Monitor certificate health
   - Automate renewal notifications

2. **SSL Labs Testing**
   - Regular SSL Labs scans
   - Aim for A+ rating
   - Fix identified vulnerabilities

## Troubleshooting

### Common Issues

1. **Certificate Not Trusted**
   - Check certificate chain
   - Verify intermediate certificates
   - Update CA certificates

2. **Mixed Content Errors**
   - Ensure all resources load over HTTPS
   - Update internal links
   - Check third-party resources

3. **SSL Handshake Failures**
   - Check SSL protocol versions
   - Verify cipher suites
   - Test with SSL Labs

### Debugging Commands

```bash
# Check certificate details
openssl x509 -in certificate.pem -text -noout

# Test SSL connection
openssl s_client -connect yourdomain.com:443

# Check certificate chain
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com | openssl x509 -noout -text

# Test SSL configuration
curl -I https://yourdomain.com
```

### Renewal Issues

1. **Renewal Fails**
   - Check DNS configuration
   - Verify domain ownership
   - Ensure ports are open

2. **Automatic Renewal Not Working**
   - Check crontab configuration
   - Verify script permissions
   - Review log files

## Alternative SSL Providers

### Cloudflare SSL

1. Enable "Always Use HTTPS"
2. Choose SSL mode (Flexible, Full, Full Strict)
3. Upload custom certificates if needed

### AWS Certificate Manager

1. Request certificate in ACM console
2. Validate domain ownership
3. Attach to load balancer or CloudFront

### Commercial Certificates

1. **DigiCert**: High-trust certificates
2. **GlobalSign**: Enterprise solutions
3. **Comodo**: Cost-effective options

## Performance Optimization

1. **OCSP Stapling**
   - Enable OCSP stapling in web server
   - Reduces certificate validation time

2. **Session Resumption**
   - Enable session tickets
   - Configure session cache

3. **HTTP/2**
   - Enable HTTP/2 for better performance
   - Multiplex multiple requests

This guide provides a comprehensive foundation for SSL certificate management. Always test configurations in staging environments before production deployment.