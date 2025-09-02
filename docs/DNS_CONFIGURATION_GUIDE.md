# DNS Configuration Guide

This guide provides comprehensive instructions for setting up DNS configuration for your domain, covering multiple domain registrars and DNS providers. It includes configurations for Netlify frontend, backend API endpoints, CDN optimization, and DNS propagation verification.

## Table of Contents

1. [Domain Registrar Setup](#domain-registrar-setup)
2. [DNS Record Configuration](#dns-record-configuration)
3. [Netlify Frontend Configuration](#netlify-frontend-configuration)
4. [Backend API Endpoints](#backend-api-endpoints)
5. [CDN and Performance Optimization](#cdn-and-performance-optimization)
6. [DNS Propagation Verification](#dns-propagation-verification)

## Domain Registrar Setup

### GoDaddy

1. Log in to your GoDaddy account
2. Navigate to "My Products" > "Domains"
3. Click on your domain name
4. Click "DNS" in the left sidebar
5. You'll see the DNS management interface

### Namecheap

1. Log in to your Namecheap account
2. Go to "Domain List" and click "Manage" next to your domain
3. Click on "Advanced DNS" tab
4. You'll see the DNS records management area

### Cloudflare

1. Sign up for a Cloudflare account
2. Add your domain to Cloudflare
3. Update your domain's nameservers at your registrar to Cloudflare's nameservers
4. Access DNS settings in the Cloudflare dashboard

### Route 53 (AWS)

1. Log in to AWS Management Console
2. Navigate to Route 53 service
3. Create a hosted zone for your domain
4. Update your domain's nameservers at your registrar

## DNS Record Configuration

### Basic DNS Records

#### A Record (IPv4 Address)
```
Type: A
Name: @
Value: YOUR_SERVER_IP
TTL: 600
```

#### AAAA Record (IPv6 Address) - Optional
```
Type: AAAA
Name: @
Value: YOUR_SERVER_IPV6
TTL: 600
```

#### CNAME Record (Canonical Name)
```
Type: CNAME
Name: www
Value: yourdomain.com
TTL: 600
```

### MX Records (Mail Exchange)
```
Type: MX
Name: @
Value: 10 mail.yourdomain.com
TTL: 600
```

## Netlify Frontend Configuration

### Custom Domain Setup

1. In Netlify dashboard, go to your site settings
2. Navigate to "Domain management"
3. Add your custom domain
4. Follow Netlify's instructions to configure DNS

### Required DNS Records for Netlify

#### Primary Domain (A Record)
```
Type: A
Name: @
Value: 75.2.60.5
TTL: 3600
```

#### WWW Subdomain (CNAME Record)
```
Type: CNAME
Name: www
Value: your-site-name.netlify.app
TTL: 3600
```

#### Netlify DNS (if using Netlify DNS)
Update your domain's nameservers to:
- dns1.p01.nsone.net
- dns2.p01.nsone.net
- dns3.p01.nsone.net
- dns4.p01.nsone.net

## Backend API Endpoints

### API Subdomain Configuration

#### A Record for API
```
Type: A
Name: api
Value: YOUR_BACKEND_SERVER_IP
TTL: 600
```

#### CNAME for API (if using load balancer)
```
Type: CNAME
Name: api
Value: your-load-balancer-domain.com
TTL: 600
```

### Multiple Environment Setup

#### Staging API
```
Type: A
Name: staging-api
Value: YOUR_STAGING_SERVER_IP
TTL: 600
```

#### Development API
```
Type: A
Name: dev-api
Value: YOUR_DEV_SERVER_IP
TTL: 600
```

## CDN and Performance Optimization

### Cloudflare CDN Setup

1. Add your domain to Cloudflare
2. Enable CDN features:
   - Always Online
   - Auto Minify
   - Brotli compression
   - HTTP/2 and HTTP/3

### DNS Records for CDN

#### CNAME for CDN
```
Type: CNAME
Name: cdn
Value: your-cdn-provider.com
TTL: 600
```

### Performance Records

#### SPF Record (Sender Policy Framework)
```
Type: TXT
Name: @
Value: "v=spf1 include:_spf.google.com ~all"
TTL: 600
```

#### DKIM Record
```
Type: TXT
Name: google._domainkey
Value: "v=DKIM1; k=rsa; p=YOUR_DKIM_KEY"
TTL: 600
```

#### DMARC Record
```
Type: TXT
Name: _dmarc
Value: "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"
TTL: 600
```

## DNS Propagation Verification

### Using Command Line Tools

#### Check A Record
```bash
nslookup yourdomain.com
```

#### Check CNAME Record
```bash
nslookup www.yourdomain.com
```

#### Check MX Records
```bash
nslookup -type=MX yourdomain.com
```

### Online DNS Tools

1. **DNS Checker**: https://dnschecker.org/
2. **MX Toolbox**: https://mxtoolbox.com/
3. **IntoDNS**: https://intodns.com/

### Propagation Time

- DNS changes typically take 24-48 hours to propagate globally
- Some providers may update faster (Cloudflare: ~5 minutes)
- Use multiple DNS servers to check propagation status

### Troubleshooting

#### Common Issues

1. **DNS Not Propagating**
   - Clear DNS cache: `ipconfig /flushdns` (Windows) or `sudo killall -HUP mDNSResponder` (macOS)
   - Wait additional time for global propagation

2. **Wrong Records**
   - Double-check record values and TTL settings
   - Ensure records are saved and active

3. **Registrar vs DNS Provider**
   - If using external DNS (like Cloudflare), ensure nameservers are updated at registrar

### Verification Checklist

- [ ] A record points to correct IP
- [ ] CNAME records resolve properly
- [ ] MX records are configured for email
- [ ] SSL certificate is valid
- [ ] Website loads correctly
- [ ] Email delivery works
- [ ] All subdomains resolve

## Security Considerations

1. **DNSSEC**: Enable DNSSEC if supported by your registrar
2. **Regular Audits**: Periodically review DNS records
3. **Backup Records**: Keep a backup of all DNS configurations
4. **Access Control**: Limit DNS management access to authorized personnel

## Monitoring and Maintenance

1. Set up DNS monitoring alerts
2. Regularly check for DNS vulnerabilities
3. Update records when infrastructure changes
4. Document all DNS changes with timestamps

This guide covers the essential DNS configuration steps for a production environment. Always test changes in a staging environment before applying to production.