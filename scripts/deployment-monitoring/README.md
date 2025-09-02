# Deployment Monitoring Scripts

This directory contains comprehensive scripts for monitoring, analyzing, and managing deployments in the Flow Motion logistics platform.

## Scripts Overview

### 1. `monitor-deployment.sh`
**Purpose**: Real-time deployment status monitoring with health checks and alerting.

**Features**:
- Continuous monitoring of all services and infrastructure components
- Real-time health status updates
- Configurable monitoring intervals
- JSON-based status tracking
- Alert generation for issues

**Usage**:
```bash
# Monitor production environment
./monitor-deployment.sh production deploy_20231201_143000 30

# Monitor staging with default settings
./monitor-deployment.sh staging

# Monitor with custom interval (60 seconds)
./monitor-deployment.sh production latest 60
```

**Environment Variables**:
- `DB_HOST`: Database host (default: localhost)
- `DB_PORT`: Database port (default: 5432)
- `DB_USER`: Database user (default: logistics)

### 2. `aggregate-logs.sh`
**Purpose**: Log aggregation and analysis across all services.

**Features**:
- Collects logs from Kubernetes pods, services, and ingress
- Analyzes error patterns and rates
- Generates detailed analysis reports
- Supports multiple time ranges
- Identifies top error messages and response time patterns

**Usage**:
```bash
# Analyze logs from last hour
./aggregate-logs.sh production 1h

# Analyze logs from last 2 hours with custom output directory
./aggregate-logs.sh staging 2h /tmp/custom-analysis

# Analyze logs from last 30 minutes
./aggregate-logs.sh production 30m
```

**Supported Time Ranges**:
- `1h`, `2h`, `6h`, `12h`, `1d` (hours/days)
- `30m`, `45m` (minutes)

### 3. `track-progress.sh`
**Purpose**: Deployment progress tracking with detailed stage monitoring.

**Features**:
- Tracks deployment through multiple stages
- Monitors individual steps within each stage
- Calculates estimated completion time
- Provides real-time progress updates
- Supports both interactive and automated modes

**Usage**:
```bash
# Interactive monitoring mode
./track-progress.sh deploy_001 production interactive

# Automated deployment execution
./track-progress.sh deploy_002 staging automated

# Monitor with auto-generated ID
./track-progress.sh
```

**Stages Tracked**:
1. Pre-deployment Checks
2. Deployment Execution
3. Post-deployment Validation
4. Monitoring Setup

### 4. `detect-failures.sh`
**Purpose**: Automated failure detection and alerting system.

**Features**:
- Monitors pod crashes and service availability
- Tracks error rates in application logs
- Checks database connectivity and resource usage
- Detects network issues and timeout errors
- Sends alerts via webhooks (Slack, etc.)
- Generates health reports

**Usage**:
```bash
# Monitor production with default settings
./detect-failures.sh production

# Monitor staging with custom threshold and interval
./detect-failures.sh staging 3 30

# Monitor with custom threshold (alert on 3+ errors)
./detect-failures.sh production 3
```

**Environment Variables**:
- `ALERT_WEBHOOK_URL`: Webhook URL for sending alerts
- `DB_HOST`: Database host
- `DB_PORT`: Database port
- `DB_USER`: Database user

**Alert Levels**:
- `LOW`: Informational alerts
- `MEDIUM`: Warning alerts requiring attention
- `HIGH`: Critical alerts requiring immediate action
- `CRITICAL`: System-down alerts

### 5. `trigger-rollback.sh`
**Purpose**: Automated rollback triggering and execution system.

**Features**:
- Analyzes deployment health before rollback
- Supports multiple rollback strategies
- Creates backups before rollback
- Validates rollback success
- Sends notifications throughout the process

**Usage**:
```bash
# Manual rollback with immediate strategy
./trigger-rollback.sh deploy_001 production false immediate

# Automatic rollback with gradual strategy
./trigger-rollback.sh latest staging true gradual

# Canary rollback for production
./trigger-rollback.sh deploy_002 production false canary
```

**Rollback Strategies**:
- `immediate`: Rollback all services at once
- `gradual`: Rollback services one by one
- `canary`: Gradual rollout of previous version

**Environment Variables**:
- `ROLLBACK_WEBHOOK_URL`: Webhook URL for rollback notifications
- `DB_HOST`: Database host
- `DB_USER`: Database user
- `DB_NAME`: Database name

## Integration Examples

### Complete Monitoring Setup

```bash
#!/bin/bash
# Start comprehensive monitoring

ENVIRONMENT="production"
DEPLOYMENT_ID="deploy_$(date +%Y%m%d_%H%M%S)"

# Start real-time monitoring in background
./monitor-deployment.sh "$ENVIRONMENT" "$DEPLOYMENT_ID" 30 &

# Start failure detection
./detect-failures.sh "$ENVIRONMENT" 5 60 &

# Track deployment progress
./track-progress.sh "$DEPLOYMENT_ID" "$ENVIRONMENT" interactive

# Cleanup background processes
pkill -f "monitor-deployment.sh"
pkill -f "detect-failures.sh"
```

### Automated Deployment Pipeline

```bash
#!/bin/bash
# Automated deployment with monitoring

ENVIRONMENT="staging"
DEPLOYMENT_ID="deploy_$(date +%Y%m%d_%H%M%S)"

echo "Starting automated deployment..."

# Start monitoring in background
./monitor-deployment.sh "$ENVIRONMENT" "$DEPLOYMENT_ID" 30 &
MONITOR_PID=$!

./detect-failures.sh "$ENVIRONMENT" 3 60 &
DETECTOR_PID=$!

# Execute deployment
./track-progress.sh "$DEPLOYMENT_ID" "$ENVIRONMENT" automated

# Check if deployment was successful
if [[ $? -eq 0 ]]; then
    echo "✅ Deployment successful"

    # Run log analysis
    ./aggregate-logs.sh "$ENVIRONMENT" 1h

    # Send success notification
    curl -X POST -H 'Content-type: application/json' \
         --data '{"text":"✅ Deployment successful","attachments":[{"color":"good","text":"All systems operational"}]}' \
         "$NOTIFICATION_WEBHOOK"
else
    echo "❌ Deployment failed, triggering rollback..."

    # Trigger automatic rollback
    ./trigger-rollback.sh "$DEPLOYMENT_ID" "$ENVIRONMENT" true immediate

    # Send failure notification
    curl -X POST -H 'Content-type: application/json' \
         --data '{"text":"❌ Deployment failed - Rollback initiated","attachments":[{"color":"danger","text":"Check logs for details"}]}' \
         "$NOTIFICATION_WEBHOOK"
fi

# Cleanup
kill $MONITOR_PID $DETECTOR_PID 2>/dev/null || true
```

### Health Check Dashboard

```bash
#!/bin/bash
# Simple health dashboard

while true; do
    clear
    echo "=== Flow Motion Health Dashboard ==="
    echo "Time: $(date)"
    echo ""

    # Run quick health checks
    echo "Service Status:"
    kubectl get pods -n logi-core --no-headers | head -10

    echo ""
    echo "Recent Alerts:"
    tail -5 /var/log/flowmotion/alerts_production.log 2>/dev/null || echo "No recent alerts"

    echo ""
    echo "Press Ctrl+C to exit"
    sleep 30
done
```

## Configuration Files

### Monitoring Configuration

Create a configuration file for custom monitoring settings:

```bash
# config/monitoring.conf
ENVIRONMENT=production
MONITOR_INTERVAL=30
ERROR_THRESHOLD=5
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/...
LOG_LEVEL=info
BACKUP_RETENTION_DAYS=7
```

### Alert Rules

Define custom alert rules:

```bash
# config/alert-rules.conf
# Format: SERVICE:PATTERN:THRESHOLD:LEVEL:MESSAGE

api-gateway:error.*timeout:10:HIGH:High timeout rate detected
database:connection.*failed:5:CRITICAL:Database connectivity issues
inventory-service:ERROR:20:MEDIUM:High error rate in inventory service
```

## Best Practices

### 1. Monitoring Strategy
- Run monitoring scripts continuously during deployments
- Set up alerts for critical services first
- Use different thresholds for different environments
- Regularly review and update alert rules

### 2. Log Analysis
- Run log aggregation daily or after deployments
- Archive analysis reports for trend analysis
- Set up automated log rotation
- Monitor log volume trends

### 3. Failure Detection
- Configure alerts for your specific failure patterns
- Set up escalation policies for different alert levels
- Test alert systems regularly
- Document false positive patterns

### 4. Rollback Procedures
- Always test rollback procedures in staging
- Have multiple rollback strategies available
- Document rollback triggers and conditions
- Keep rollback backups for extended periods

### 5. Integration
- Integrate with existing CI/CD pipelines
- Set up notifications to relevant teams
- Create dashboards for monitoring metrics
- Automate as much as possible

## Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   # Ensure scripts are executable
   chmod +x scripts/deployment-monitoring/*.sh

   # Check Kubernetes permissions
   kubectl auth can-i get pods -n logi-core
   ```

2. **Database Connection Failed**
   ```bash
   # Verify database environment variables
   echo $DB_HOST $DB_PORT $DB_USER

   # Test database connectivity
   pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER
   ```

3. **Webhook Alerts Not Working**
   ```bash
   # Test webhook URL
   curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"Test alert"}' \
        "$ALERT_WEBHOOK_URL"

   # Check webhook URL format
   echo "$ALERT_WEBHOOK_URL" | grep -E "https://hooks\.slack\.com"
   ```

4. **High CPU Usage**
   ```bash
   # Increase monitoring intervals
   ./monitor-deployment.sh production deploy_001 60

   # Run monitoring less frequently
   ./detect-failures.sh production 5 120
   ```

### Debug Mode

Enable debug logging for troubleshooting:

```bash
# Set debug environment variable
export DEBUG_MONITORING=true

# Run scripts with verbose output
bash -x ./monitor-deployment.sh production
```

## Related Documentation

- [Deployment Guide](../DEPLOYMENT.md)
- [CI/CD Pipeline](../CI-CD.md)
- [Production Environment Configuration](../PRODUCTION_ENVIRONMENT_CONFIG.md)
- [Monitoring and Alerting Setup](../MONITORING_ALERTING.md)
- [Rollback Procedures](../ROLLBACK_PROCEDURES.md)