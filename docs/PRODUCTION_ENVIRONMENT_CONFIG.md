# Production Environment Configuration for Flow Motion Application

This guide provides comprehensive configuration for production environments, including environment variables, database setup, monitoring, logging, backup automation, and SSL certificate integration.

## Table of Contents

1. [Environment Variables Setup](#environment-variables-setup)
2. [Database Production Configuration](#database-production-configuration)
3. [Monitoring and Logging Setup](#monitoring-and-logging-setup)
4. [Backup Automation](#backup-automation)
5. [SSL Certificate Integration](#ssl-certificate-integration)

## Environment Variables Setup

### Core Application Variables

Create a `.env.production` file with the following variables:

```bash
# Application Configuration
NODE_ENV=production
APP_NAME=FlowMotion
APP_VERSION=1.0.0
APP_PORT=3000
APP_HOST=0.0.0.0

# Database Configuration
DATABASE_URL=postgresql://flowmotion_prod:secure_password@db-host:5432/flowmotion_prod
DB_HOST=db-host
DB_PORT=5432
DB_NAME=flowmotion_prod
DB_USER=flowmotion_prod
DB_PASSWORD=secure_password
DB_SSL=true
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=60000

# Redis Configuration
REDIS_URL=redis://redis-host:6379
REDIS_PASSWORD=secure_redis_password
REDIS_DB=0
REDIS_TLS=true

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-256-bits
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-token-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# API Keys and Secrets
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
SENDGRID_API_KEY=SG.your-sendgrid-api-key
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# External Services
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
LOG_LEVEL=info
LOG_FORMAT=json

# File Storage
AWS_S3_BUCKET=flowmotion-prod-bucket
AWS_S3_REGION=us-east-1
AWS_S3_ACCESS_KEY_ID=your-aws-access-key
AWS_S3_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_CLOUDFRONT_URL=https://your-cloudfront-distribution.cloudfront.net

# Email Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
FROM_EMAIL=noreply@flowmotion.com
FROM_NAME=Flow Motion

# Security
CORS_ORIGIN=https://yourdomain.com
SESSION_SECRET=your-session-secret-key
ENCRYPTION_KEY=32-character-encryption-key
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
PROMETHEUS_METRICS_PORT=9090
HEALTH_CHECK_ENDPOINT=/health
METRICS_ENDPOINT=/metrics

# Backup Configuration
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=flowmotion-backups

# SSL Configuration
SSL_CERT_PATH=/etc/ssl/certs/flowmotion.crt
SSL_KEY_PATH=/etc/ssl/private/flowmotion.key
SSL_CA_PATH=/etc/ssl/certs/ca-bundle.crt
FORCE_HTTPS=true
```

### Environment Variable Validation

Create a script to validate required environment variables:

```bash
#!/bin/bash
# scripts/validate-env.sh

REQUIRED_VARS=(
  "DATABASE_URL"
  "JWT_SECRET"
  "REDIS_URL"
  "STRIPE_SECRET_KEY"
  "SENDGRID_API_KEY"
  "SENTRY_DSN"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!var}" ]]; then
    MISSING_VARS+=("$var")
  fi
done

if [[ ${#MISSING_VARS[@]} -gt 0 ]]; then
  echo "Error: Missing required environment variables:"
  printf '  - %s\n' "${MISSING_VARS[@]}"
  exit 1
fi

echo "All required environment variables are set."
```

### Secure Environment Variable Management

#### Using AWS Systems Manager Parameter Store

```bash
# Store parameters
aws ssm put-parameter \
  --name "/flowmotion/prod/database/url" \
  --value "postgresql://..." \
  --type "SecureString" \
  --description "Production database URL"

aws ssm put-parameter \
  --name "/flowmotion/prod/jwt/secret" \
  --value "your-jwt-secret" \
  --type "SecureString"

# Retrieve parameters in application
aws ssm get-parameters-by-path \
  --path "/flowmotion/prod" \
  --with-decryption \
  --recursive
```

#### Using Azure Key Vault

```bash
# Create Key Vault
az keyvault create \
  --name flowmotion-prod-kv \
  --resource-group flowmotion-rg \
  --location eastus

# Store secrets
az keyvault secret set \
  --vault-name flowmotion-prod-kv \
  --name database-url \
  --value "postgresql://..."

# Retrieve secrets
az keyvault secret show \
  --vault-name flowmotion-prod-kv \
  --name database-url
```

## Database Production Configuration

### PostgreSQL Production Setup

#### Database Server Configuration

```sql
-- postgresql.conf optimizations for production
shared_buffers = 256MB                    # 25% of RAM
effective_cache_size = 1GB               # 75% of RAM
maintenance_work_mem = 64MB              # Per connection
checkpoint_completion_target = 0.9       # Spread checkpoints
wal_buffers = 16MB                       # 1/32 of shared_buffers
default_statistics_target = 100          # Better query planning
random_page_cost = 1.1                   # SSD optimization
effective_io_concurrency = 200           # SSD optimization
work_mem = 4MB                          # Per connection sort/hash
min_wal_size = 1GB                      # Minimum WAL size
max_wal_size = 4GB                      # Maximum WAL size
max_connections = 200                   # Maximum connections
```

#### Database User and Permissions

```sql
-- Create production database and user
CREATE DATABASE flowmotion_prod;
CREATE USER flowmotion_prod WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE flowmotion_prod TO flowmotion_prod;

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO flowmotion_prod;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO flowmotion_prod;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO flowmotion_prod;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO flowmotion_prod;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO flowmotion_prod;
```

#### Connection Pooling with PgBouncer

```ini
# /etc/pgbouncer/pgbouncer.ini
[databases]
flowmotion_prod = host=localhost port=5432 dbname=flowmotion_prod

[pgbouncer]
listen_port = 6432
listen_addr = 127.0.0.1
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3
max_db_connections = 50
max_user_connections = 50
```

#### Database Backup Configuration

```bash
# Install pgBackRest
sudo apt install pgbackrest

# Configure pgBackRest
sudo tee /etc/pgbackrest.conf > /dev/null <<EOF
[global]
repo1-path=/var/lib/pgbackrest
repo1-retention-full=2
repo1-retention-diff=6
repo1-retention-archive=30
process-max=4
log-level-console=info
log-level-file=debug
start-fast=y

[flowmotion-prod]
pg1-path=/var/lib/postgresql/14/main
pg1-port=5432
pg1-user=postgres
EOF

# Initialize repository
sudo -u postgres pgbackrest stanza-create --stanza=flowmotion-prod

# Create backup
sudo -u postgres pgbackrest backup --stanza=flowmotion-prod --type=full
```

### Redis Production Configuration

```redis.conf
# Redis production configuration
bind 127.0.0.1
protected-mode yes
port 6379
timeout 0
tcp-keepalive 300
daemonize yes
supervised systemd
loglevel notice
logfile /var/log/redis/redis-server.log
databases 16
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /var/lib/redis
slave-serve-stale-data yes
slave-read-only yes
repl-diskless-sync no
repl-diskless-sync-delay 5
repl-disable-tcp-nodelay no
slave-priority 100
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
lua-time-limit 5000
slowlog-log-slower-than 10000
slowlog-max-len 128
notify-keyspace-events ""
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
list-max-ziplist-size -2
list-compress-depth 0
set-max-intset-entries 512
zset-max-ziplist-entries 128
zset-max-ziplist-value 64
hll-sparse-max-bytes 3000
activerehashing yes
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit slave 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60
hz 10
aof-rewrite-incremental-fsync yes
```

## Monitoring and Logging Setup

### Prometheus and Grafana Setup

#### Docker Compose Configuration

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: flowmotion-prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    ports:
      - "9090:9090"
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    container_name: flowmotion-grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=secure_password
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
    ports:
      - "3001:3000"
    depends_on:
      - prometheus
    networks:
      - monitoring

  node-exporter:
    image: prom/node-exporter:latest
    container_name: flowmotion-node-exporter
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    ports:
      - "9100:9100"
    networks:
      - monitoring

volumes:
  prometheus_data:
  grafana_data:

networks:
  monitoring:
    driver: bridge
```

#### Prometheus Configuration

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'flowmotion-app'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
```

### Centralized Logging with ELK Stack

#### Elasticsearch Configuration

```yaml
# docker-compose.logging.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.5.0
    container_name: flowmotion-elasticsearch
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - xpack.security.enabled=false
      - xpack.monitoring.enabled=false
      - xpack.graph.enabled=false
      - xpack.watcher.enabled=false
      - xpack.ml.enabled=false
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
      - "9300:9300"
    networks:
      - logging

  logstash:
    image: docker.elastic.co/logstash/logstash:8.5.0
    container_name: flowmotion-logstash
    volumes:
      - ./logging/logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5044:5044"
      - "5000:5000/tcp"
      - "5000:5000/udp"
      - "9600:9600"
    environment:
      LS_JAVA_OPTS: "-Xmx256m -Xms256m"
    networks:
      - logging
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.5.0
    container_name: flowmotion-kibana
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    networks:
      - logging
    depends_on:
      - elasticsearch

volumes:
  elasticsearch_data:

networks:
  logging:
    driver: bridge
```

#### Logstash Configuration

```conf
# logging/logstash.conf
input {
  tcp {
    port => 5000
    codec => json_lines
  }
  udp {
    port => 5000
    codec => json_lines
  }
}

filter {
  if [type] == "flowmotion-app" {
    json {
      source => "message"
    }
    
    date {
      match => ["timestamp", "ISO8601"]
      target => "@timestamp"
    }
    
    mutate {
      remove_field => ["timestamp"]
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "flowmotion-%{+YYYY.MM.dd}"
  }
  
  stdout {
    codec => rubydebug
  }
}
```

### Application Logging Configuration

```javascript
// Application logging setup
const winston = require('winston');
const ElasticsearchTransport = require('winston-elasticsearch');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'flowmotion-api' },
  transports: [
    // Console logging for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File logging
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
    
    // Elasticsearch logging for production
    ...(process.env.NODE_ENV === 'production' ? [
      new ElasticsearchTransport({
        level: 'info',
        clientOpts: {
          node: process.env.ELASTICSEARCH_NODE,
          auth: {
            username: process.env.ELASTICSEARCH_USER,
            password: process.env.ELASTICSEARCH_PASSWORD
          }
        },
        indexPrefix: 'flowmotion-logs'
      })
    ] : [])
  ]
});

module.exports = logger;
```

## Backup Automation

### Automated Database Backup Script

```bash
#!/bin/bash
# scripts/backup-database.sh

set -e

# Configuration
BACKUP_DIR="/opt/flowmotion/backups"
DB_NAME="flowmotion_prod"
DB_USER="flowmotion_prod"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"
LOG_FILE="${BACKUP_DIR}/backup.log"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Log backup start
echo "$(date): Starting database backup" >> "$LOG_FILE"

# Create backup
pg_dump -h localhost -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"

# Verify backup
if [[ -f "$BACKUP_FILE" ]]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "$(date): Backup completed successfully. Size: $BACKUP_SIZE" >> "$LOG_FILE"
else
    echo "$(date): Backup failed!" >> "$LOG_FILE"
    exit 1
fi

# Upload to S3
if [[ -n "$AWS_S3_BUCKET" ]]; then
    aws s3 cp "$BACKUP_FILE" "s3://$AWS_S3_BUCKET/backups/database/"
    echo "$(date): Backup uploaded to S3" >> "$LOG_FILE"
fi

# Clean up old backups (keep last 30 days)
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
echo "$(date): Old backups cleaned up" >> "$LOG_FILE"
```

### File System Backup Script

```bash
#!/bin/bash
# scripts/backup-files.sh

set -e

# Configuration
SOURCE_DIR="/opt/flowmotion/uploads"
BACKUP_DIR="/opt/flowmotion/backups/files"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/files_${TIMESTAMP}.tar.gz"
LOG_FILE="${BACKUP_DIR}/backup.log"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Log backup start
echo "$(date): Starting file system backup" >> "$LOG_FILE"

# Create compressed backup
tar -czf "$BACKUP_FILE" -C "$SOURCE_DIR" .

# Verify backup
if [[ -f "$BACKUP_FILE" ]]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "$(date): File backup completed successfully. Size: $BACKUP_SIZE" >> "$LOG_FILE"
else
    echo "$(date): File backup failed!" >> "$LOG_FILE"
    exit 1
fi

# Upload to S3
if [[ -n "$AWS_S3_BUCKET" ]]; then
    aws s3 cp "$BACKUP_FILE" "s3://$AWS_S3_BUCKET/backups/files/"
    echo "$(date): File backup uploaded to S3" >> "$LOG_FILE"
fi

# Clean up old backups (keep last 7 days)
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
echo "$(date): Old file backups cleaned up" >> "$LOG_FILE"
```

### Backup Verification Script

```bash
#!/bin/bash
# scripts/verify-backups.sh

set -e

# Configuration
BACKUP_DIR="/opt/flowmotion/backups"
LOG_FILE="${BACKUP_DIR}/verification.log"

echo "$(date): Starting backup verification" >> "$LOG_FILE"

# Check database backups
LATEST_DB_BACKUP=$(find "$BACKUP_DIR" -name "*.sql.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)

if [[ -f "$LATEST_DB_BACKUP" ]]; then
    DB_BACKUP_AGE=$(($(date +%s) - $(stat -c %Y "$LATEST_DB_BACKUP")))
    if [[ $DB_BACKUP_AGE -gt 86400 ]]; then # 24 hours
        echo "$(date): WARNING: Latest database backup is older than 24 hours" >> "$LOG_FILE"
    else
        echo "$(date): Database backup is current" >> "$LOG_FILE"
    fi
else
    echo "$(date): ERROR: No database backups found" >> "$LOG_FILE"
    exit 1
fi

# Check file backups
LATEST_FILE_BACKUP=$(find "$BACKUP_DIR/files" -name "*.tar.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)

if [[ -f "$LATEST_FILE_BACKUP" ]]; then
    FILE_BACKUP_AGE=$(($(date +%s) - $(stat -c %Y "$LATEST_FILE_BACKUP")))
    if [[ $FILE_BACKUP_AGE -gt 604800 ]]; then # 7 days
        echo "$(date): WARNING: Latest file backup is older than 7 days" >> "$LOG_FILE"
    else
        echo "$(date): File backup is current" >> "$LOG_FILE"
    fi
else
    echo "$(date): ERROR: No file backups found" >> "$LOG_FILE"
    exit 1
fi

echo "$(date): Backup verification completed" >> "$LOG_FILE"
```

### Cron Jobs for Automated Backups

```bash
# Add to crontab (crontab -e)
# Database backup - daily at 2 AM
0 2 * * * /opt/flowmotion/scripts/backup-database.sh

# File system backup - daily at 3 AM
0 3 * * * /opt/flowmotion/scripts/backup-files.sh

# Backup verification - hourly
0 * * * * /opt/flowmotion/scripts/verify-backups.sh

# Log rotation - daily at 4 AM
0 4 * * * /usr/sbin/logrotate /etc/logrotate.d/flowmotion
```

## SSL Certificate Integration

### Let's Encrypt SSL Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Certificate files location:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### Nginx SSL Configuration

```nginx
# /etc/nginx/sites-available/flowmotion
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Proxy to application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Static files
    location /static/ {
        alias /opt/flowmotion/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### SSL Certificate Renewal Automation

```bash
# Add to crontab for automatic renewal
# Test renewal
0 12 * * * /usr/bin/certbot renew --dry-run

# Actual renewal (runs twice daily)
0 0,12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx
```

### Docker SSL Configuration

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: flowmotion-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
      - ./nginx/sites-enabled:/etc/nginx/sites-enabled
    depends_on:
      - api-gateway
    networks:
      - flowmotion

  api-gateway:
    build:
      context: ./logi-core/apps/api-gateway
      dockerfile: Dockerfile
    container_name: flowmotion-api-gateway
    environment:
      - NODE_ENV=production
      - FORCE_HTTPS=true
    volumes:
      - ./ssl:/app/ssl:ro
    networks:
      - flowmotion

networks:
  flowmotion:
    driver: bridge
```

## Configuration Validation

### Environment Configuration Validator

```bash
#!/bin/bash
# scripts/validate-config.sh

set -e

CONFIG_FILE=".env.production"
ERRORS=()

# Check if config file exists
if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "Error: Configuration file $CONFIG_FILE not found"
    exit 1
fi

# Required variables
REQUIRED_VARS=(
    "DATABASE_URL"
    "JWT_SECRET"
    "REDIS_URL"
    "STRIPE_SECRET_KEY"
    "SENDGRID_API_KEY"
)

# Check required variables
for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^$var=" "$CONFIG_FILE"; then
        ERRORS+=("Missing required variable: $var")
    fi
done

# Validate database URL format
DB_URL=$(grep "^DATABASE_URL=" "$CONFIG_FILE" | cut -d'=' -f2)
if [[ -n "$DB_URL" ]] && [[ ! "$DB_URL" =~ ^postgresql:// ]]; then
    ERRORS+=("DATABASE_URL must start with postgresql://")
fi

# Validate JWT secret length
JWT_SECRET=$(grep "^JWT_SECRET=" "$CONFIG_FILE" | cut -d'=' -f2)
if [[ -n "$JWT_SECRET" ]] && [[ ${#JWT_SECRET} -lt 32 ]]; then
    ERRORS+=("JWT_SECRET must be at least 32 characters long")
fi

# Check for placeholder values
PLACEHOLDER_VARS=$(grep -E "=(your-|placeholder|change-me)" "$CONFIG_FILE" | cut -d'=' -f1)
if [[ -n "$PLACEHOLDER_VARS" ]]; then
    ERRORS+=("Found placeholder values in: $PLACEHOLDER_VARS")
fi

# Report errors
if [[ ${#ERRORS[@]} -gt 0 ]]; then
    echo "Configuration validation failed:"
    for error in "${ERRORS[@]}"; do
        echo "  - $error"
    done
    exit 1
fi

echo "Configuration validation passed!"
```

## Next Steps

After configuring the production environment:

1. Review [Deployment Automation Scripts](../scripts/README.md)
2. Set up [Monitoring Dashboards](../docs/MONITORING_DASHBOARDS.md)
3. Configure [CI/CD Pipeline](../docs/CI-CD.md)
4. Test [Disaster Recovery Procedures](../docs/DISASTER_RECOVERY.md)

## Security Considerations

- Store secrets in secure vaults (AWS Secrets Manager, Azure Key Vault, etc.)
- Use environment-specific configuration files
- Implement secret rotation policies
- Regular security audits and updates
- Network segmentation and access controls
- Encrypted backups and secure transfer protocols

## Performance Optimization

- Database connection pooling
- Redis caching strategies
- CDN integration for static assets
- Horizontal scaling configuration
- Resource monitoring and alerting
- Query optimization and indexing