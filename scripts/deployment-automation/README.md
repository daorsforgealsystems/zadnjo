# Deployment Automation Scripts

This directory contains comprehensive scripts for automating deployment processes, managing multi-environment deployments, and tracking deployment history.

## Scripts Overview

### 1. `one-click-deploy.sh`
**Purpose**: Single-command deployment execution with full lifecycle management.

**Features**:
- Pre-deployment validation
- Build artifact generation
- Environment-specific deployment
- Post-deployment validation
- Comprehensive logging and status tracking
- Automatic rollback on failures

**Usage**:
```bash
# Deploy to staging
./one-click-deploy.sh staging full

# Deploy frontend only to production
./one-click-deploy.sh production frontend

# Deploy with validation skipped
./one-click-deploy.sh staging backend false
```

**Parameters**:
- `ENVIRONMENT`: Target environment (staging|production)
- `DEPLOYMENT_TYPE`: Type of deployment (full|frontend|backend|database)
- `SKIP_VALIDATION`: Skip post-deployment validation (true|false)

### 2. `multi-env-deploy.sh`
**Purpose**: Orchestrate deployments across multiple environments simultaneously or sequentially.

**Features**:
- Parallel or sequential deployment execution
- Environment readiness validation
- Cross-environment dependency management
- Consolidated reporting and notifications
- Rollback coordination across environments

**Usage**:
```bash
# Deploy to all environments sequentially
./multi-env-deploy.sh staging all full false

# Deploy to specific environments in parallel
./multi-env-deploy.sh dev 'staging,production' backend true

# Deploy to production only
./multi-env-deploy.sh staging production full false
```

**Parameters**:
- `SOURCE_ENV`: Source environment for promotion
- `TARGET_ENVS`: Target environments (comma-separated or 'all')
- `DEPLOYMENT_TYPE`: Type of deployment
- `PARALLEL`: Run deployments in parallel (true|false)

### 3. `pipeline-orchestrator.sh`
**Purpose**: Execute complex deployment pipelines with stages, approvals, and conditional logic.

**Features**:
- Configurable pipeline stages
- Manual approval gates
- Conditional execution based on previous stage results
- Comprehensive pipeline status tracking
- Integration with external approval systems

**Usage**:
```bash
# Run default pipeline
./pipeline-orchestrator.sh

# Run custom pipeline configuration
./pipeline-orchestrator.sh config/production-pipeline.json production true

# Run pipeline with auto-approval
./pipeline-orchestrator.sh config/staging-pipeline.json staging true
```

**Parameters**:
- `PIPELINE_CONFIG`: Pipeline configuration file (optional)
- `ENVIRONMENT`: Target environment
- `AUTO_APPROVE`: Auto-approve stages requiring approval

### 4. `status-reporter.sh`
**Purpose**: Generate comprehensive status reports and notifications.

**Features**:
- Multiple report types (summary, detailed, health)
- Various output formats (console, JSON, HTML, Slack)
- Configurable time ranges
- Automated report generation and delivery

**Usage**:
```bash
# Generate summary report for last 24 hours
./status-reporter.sh summary 24h console

# Generate detailed JSON report
./status-reporter.sh detailed 6h json

# Send health report to Slack
./status-reporter.sh health 1h slack
```

**Parameters**:
- `REPORT_TYPE`: Type of report (summary|detailed|health)
- `TIME_RANGE`: Time range for data (1h|6h|24h|7d)
- `OUTPUT_FORMAT`: Output format (console|json|html|slack)

### 5. `deployment-history.sh`
**Purpose**: Track and manage deployment history with advanced querying and reporting.

**Features**:
- Complete deployment lifecycle tracking
- Advanced search and filtering capabilities
- Statistical analysis and reporting
- Artifact and validation result association
- Automatic cleanup of old records

**Usage**:
```bash
# List recent deployments
./deployment-history.sh list 20

# Search for specific deployment
./deployment-history.sh search deploy_001

# Generate statistics for last 30 days
./deployment-history.sh stats 30d

# Show deployment details
./deployment-history.sh show deploy_001

# Clean up history older than 90 days
./deployment-history.sh cleanup 90
```

**Actions**:
- `list`: List deployments with optional filtering
- `search`: Search deployments by ID or criteria
- `stats`: Generate statistical reports
- `show`: Display detailed deployment information
- `cleanup`: Remove old deployment records

## Pipeline Configuration

### Pipeline Configuration Format

```json
{
  "name": "Production Deployment Pipeline",
  "environment": "production",
  "stages": [
    {
      "name": "Code Quality",
      "type": "quality",
      "steps": [
        {
          "name": "Lint",
          "command": "npm run lint",
          "timeout": 300
        },
        {
          "name": "Type Check",
          "command": "npm run type-check",
          "timeout": 300
        }
      ]
    },
    {
      "name": "Security Scan",
      "type": "security",
      "steps": [
        {
          "name": "Dependency Scan",
          "command": "./scripts/validation/security-scan.sh production quick",
          "timeout": 600
        }
      ]
    },
    {
      "name": "Build",
      "type": "build",
      "steps": [
        {
          "name": "Build Frontend",
          "command": "npm run build:netlify",
          "timeout": 600
        }
      ]
    },
    {
      "name": "Deploy",
      "type": "deploy",
      "requires_approval": true,
      "steps": [
        {
          "name": "Deploy to Production",
          "command": "./scripts/deployment-automation/one-click-deploy.sh production full false",
          "timeout": 1800
        }
      ]
    },
    {
      "name": "Validation",
      "type": "validation",
      "steps": [
        {
          "name": "Smoke Tests",
          "command": "./scripts/validation/smoke-tests.sh production",
          "timeout": 300
        },
        {
          "name": "Integration Tests",
          "command": "./scripts/validation/integration-tests.sh production",
          "timeout": 600
        }
      ]
    }
  ]
}
```

## Integration Examples

### Complete CI/CD Pipeline

```yaml
# .github/workflows/ci-cd-pipeline.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Quality Checks
        run: ./scripts/deployment-automation/pipeline-orchestrator.sh config/quality-pipeline.json staging false

  deploy-staging:
    needs: quality-gate
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Staging
        run: ./scripts/deployment-automation/one-click-deploy.sh staging full false

  deploy-production:
    needs: deploy-staging
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Production
        run: ./scripts/deployment-automation/pipeline-orchestrator.sh config/production-pipeline.json production false

  status-report:
    needs: [deploy-staging, deploy-production]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: Generate Status Report
        run: ./scripts/deployment-automation/status-reporter.sh summary 24h slack
```

### Automated Multi-Environment Promotion

```bash
#!/bin/bash
# scripts/automated-promotion.sh

SOURCE_ENV=$1
TARGET_ENVS=$2

echo "Starting automated promotion from $SOURCE_ENV to $TARGET_ENVS"

# Run validations on source environment
if ./scripts/validation/smoke-tests.sh "$SOURCE_ENV" &&
   ./scripts/validation/integration-tests.sh "$SOURCE_ENV"; then

    echo "✅ Source environment validation passed"

    # Deploy to target environments
    if ./scripts/deployment-automation/multi-env-deploy.sh "$SOURCE_ENV" "$TARGET_ENVS" full false; then

        echo "✅ Multi-environment deployment completed"

        # Generate report
        ./scripts/deployment-automation/status-reporter.sh summary 1h html

        # Send notifications
        ./scripts/deployment-automation/status-reporter.sh summary 1h slack

    else
        echo "❌ Multi-environment deployment failed"
        exit 1
    fi

else
    echo "❌ Source environment validation failed"
    exit 1
fi
```

### Scheduled Maintenance Deployments

```bash
# Add to crontab for scheduled deployments
# Weekly staging refresh every Monday at 2 AM
0 2 * * 1 /opt/flowmotion/scripts/deployment-automation/one-click-deploy.sh staging full false

# Monthly production maintenance on first Sunday at 3 AM
0 3 1-7 * * [ $(date +\%u) -eq 7 ] /opt/flowmotion/scripts/deployment-automation/pipeline-orchestrator.sh config/maintenance-pipeline.json production true

# Daily status reports at 6 AM
0 6 * * * /opt/flowmotion/scripts/deployment-automation/status-reporter.sh summary 24h slack

# Weekly cleanup on Sunday at 4 AM
0 4 * * 0 /opt/flowmotion/scripts/deployment-automation/deployment-history.sh cleanup 90
```

## Configuration

### Environment Variables

```bash
# Deployment configuration
export DEPLOYMENT_WEBHOOK=https://hooks.slack.com/...
export MULTI_DEPLOY_WEBHOOK=https://hooks.slack.com/...
export PIPELINE_WEBHOOK=https://hooks.slack.com/...
export APPROVAL_WEBHOOK=https://hooks.slack.com/...

# Status reporting
export SLACK_WEBHOOK=https://hooks.slack.com/...

# Database configuration
export DB_HOST=your-db-host
export DB_USER=your-db-user
export DB_NAME=your-db-name

# Kubernetes configuration
export KUBECONFIG=/path/to/kubeconfig
```

### Directory Structure

```
/var/log/flowmotion/
├── deployments/          # Individual deployment logs
├── pipelines/           # Pipeline execution logs
├── multi_deployments/   # Multi-environment deployment logs
└── history/            # Deployment history files

/tmp/
├── deployment_status_*.json    # Current deployment status
├── pipeline_status_*.json      # Current pipeline status
├── validation_results/         # Validation result files
└── reports/                   # Generated reports
```

## Best Practices

### 1. Pipeline Design
- Keep pipelines simple and focused
- Use approval gates for production deployments
- Implement proper error handling and rollback
- Document pipeline configurations clearly

### 2. Multi-Environment Management
- Test deployments in staging before production
- Use feature flags for gradual rollouts
- Implement proper environment isolation
- Monitor cross-environment dependencies

### 3. Status Reporting
- Set up automated daily/weekly reports
- Configure alerts for critical issues
- Archive reports for compliance
- Use appropriate report formats for different audiences

### 4. History Management
- Regularly clean up old deployment records
- Implement retention policies based on compliance requirements
- Use history data for trend analysis and improvement
- Associate related artifacts and validation results

### 5. Security Considerations
- Store sensitive configuration securely
- Use least privilege for deployment accounts
- Implement audit logging for all deployment activities
- Regularly rotate credentials and tokens

### 6. Monitoring and Alerting
- Set up comprehensive monitoring for all automation
- Implement alerts for deployment failures
- Track deployment metrics and KPIs
- Create dashboards for deployment visibility

## Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   # Make scripts executable
   chmod +x scripts/deployment-automation/*.sh

   # Check file permissions
   ls -la scripts/deployment-automation/
   ```

2. **Kubernetes Connection Failed**
   ```bash
   # Verify kubeconfig
   kubectl config current-context

   # Check cluster access
   kubectl cluster-info

   # Test namespace access
   kubectl get pods -n logi-core
   ```

3. **Database Connection Issues**
   ```bash
   # Test database connectivity
   psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1;"

   # Check environment variables
   echo $DB_HOST $DB_USER $DB_NAME
   ```

4. **Webhook Notifications Not Working**
   ```bash
   # Test webhook URL
   curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"Test"}' \
        "$SLACK_WEBHOOK"

   # Verify webhook URL format
   echo "$SLACK_WEBHOOK" | grep -E "https://hooks\.slack\.com"
   ```

5. **Pipeline Approval Timeouts**
   ```bash
   # Increase approval timeout in pipeline config
   {
     "name": "Deploy",
     "requires_approval": true,
     "approval_timeout": 3600,
     "steps": [...]
   }

   # Or run with auto-approval
   ./pipeline-orchestrator.sh config/pipeline.json production true
   ```

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
# Set debug environment variable
export DEBUG_DEPLOYMENT=true

# Run scripts with verbose output
bash -x ./one-click-deploy.sh staging full

# Check detailed logs
tail -f /var/log/flowmotion/deployments/deploy_*.log
```

## Related Documentation

- [Deployment Triggering Guide](../DEPLOYMENT_TRIGGERING_GUIDE.md)
- [Deployment Monitoring Scripts](../deployment-monitoring/README.md)
- [Post-Deployment Validation](../POST_DEPLOYMENT_VALIDATION.md)
- [CI/CD Pipeline](../CI-CD.md)
- [Production Environment Configuration](../PRODUCTION_ENVIRONMENT_CONFIG.md)