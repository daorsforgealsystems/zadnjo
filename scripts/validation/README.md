# Post-Deployment Validation Scripts

This directory contains comprehensive scripts for validating deployments after they are released to production or staging environments.

## Scripts Overview

### 1. `smoke-tests.sh`
**Purpose**: Automated smoke tests to verify basic application functionality.

**Features**:
- API endpoint health checks
- Service availability validation
- Database connectivity tests
- Frontend loading verification
- Kubernetes pod status checks
- JSON-based test reporting

**Usage**:
```bash
# Run smoke tests for production
./smoke-tests.sh production

# Run with custom timeout
./smoke-tests.sh staging 45
```

**Exit Codes**:
- `0`: All tests passed
- `1`: Tests failed

### 2. `performance-tests.sh`
**Purpose**: Performance validation to ensure SLAs are met.

**Features**:
- API response time measurement
- Concurrent user load testing
- Database query performance
- Resource usage monitoring
- HTML report generation

**Usage**:
```bash
# Run performance tests for production
./performance-tests.sh production

# Run with custom duration and users
./performance-tests.sh staging 120 20
```

**Parameters**:
- `ENVIRONMENT`: Target environment
- `DURATION`: Test duration in seconds (default: 60)
- `CONCURRENT_USERS`: Number of concurrent users (default: 10)

### 3. `security-scan.sh`
**Purpose**: Security vulnerability scanning and configuration validation.

**Features**:
- Container image vulnerability scanning
- Dependency vulnerability assessment
- SSL/TLS configuration checks
- Security headers validation
- Network security assessment
- JSON vulnerability reporting

**Usage**:
```bash
# Run full security scan
./security-scan.sh production full

# Run quick configuration check
./security-scan.sh staging quick

# Run container-only scan
./security-scan.sh production container
```

**Scan Types**:
- `quick`: Configuration checks only
- `container`: Container image scanning
- `full`: Complete security assessment

### 4. `integration-tests.sh`
**Purpose**: End-to-end workflow validation.

**Features**:
- User registration and authentication
- Order creation and processing
- Inventory synchronization
- Payment processing simulation
- Notification delivery verification
- Data consistency validation

**Usage**:
```bash
# Run integration tests for staging
./integration-tests.sh staging

# Run with custom test user
./integration-tests.sh production custom-user@example.com
```

## Automation Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/post-deployment-validation.yml
name: Post-Deployment Validation

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - staging
          - production
      validation_type:
        description: 'Type of validation'
        required: true
        type: choice
        options:
          - smoke
          - performance
          - security
          - integration
          - all

jobs:
  smoke-tests:
    if: inputs.validation_type == 'smoke' || inputs.validation_type == 'all'
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    steps:
      - uses: actions/checkout@v4
      - name: Run Smoke Tests
        run: |
          chmod +x scripts/validation/smoke-tests.sh
          ./scripts/validation/smoke-tests.sh ${{ inputs.environment }}

  performance-tests:
    if: inputs.validation_type == 'performance' || inputs.validation_type == 'all'
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    steps:
      - uses: actions/checkout@v4
      - name: Run Performance Tests
        run: |
          chmod +x scripts/validation/performance-tests.sh
          ./scripts/validation/performance-tests.sh ${{ inputs.environment }}

  security-scan:
    if: inputs.validation_type == 'security' || inputs.validation_type == 'all'
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    steps:
      - uses: actions/checkout@v4
      - name: Run Security Scan
        run: |
          chmod +x scripts/validation/security-scan.sh
          ./scripts/validation/security-scan.sh ${{ inputs.environment }}

  integration-tests:
    if: inputs.validation_type == 'integration' || inputs.validation_type == 'all'
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    steps:
      - uses: actions/checkout@v4
      - name: Run Integration Tests
        run: |
          chmod +x scripts/validation/integration-tests.sh
          ./scripts/validation/integration-tests.sh ${{ inputs.environment }}
```

### Cron-Based Validation

```bash
# Add to crontab for automated validation
# Run smoke tests every 15 minutes in production
*/15 * * * * /opt/flowmotion/scripts/validation/smoke-tests.sh production

# Run performance tests hourly
0 * * * * /opt/flowmotion/scripts/validation/performance-tests.sh production 300 50

# Run security scan daily at 2 AM
0 2 * * * /opt/flowmotion/scripts/validation/security-scan.sh production full

# Run integration tests every 4 hours
0 */4 * * * /opt/flowmotion/scripts/validation/integration-tests.sh production
```

## Report Generation

### Automated Report Collection

```bash
#!/bin/bash
# scripts/validation/generate-reports.sh

ENVIRONMENT=$1
REPORT_DIR="/tmp/validation_reports_${ENVIRONMENT}_$(date +%Y%m%d_%H%M%S)"

mkdir -p "$REPORT_DIR"

echo "Generating validation reports for $ENVIRONMENT..."

# Collect all recent validation results
find /tmp -name "*${ENVIRONMENT}*.json" -mtime -1 | while read -r file; do
    cp "$file" "$REPORT_DIR/"
done

# Generate HTML summary
cat > "$REPORT_DIR/index.html" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Validation Reports - $ENVIRONMENT</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .report { border: 1px solid #ddd; margin: 10px 0; padding: 10px; }
        .passed { background-color: #d4edda; }
        .failed { background-color: #f8d7da; }
        .warning { background-color: #fff3cd; }
    </style>
</head>
<body>
    <h1>Validation Reports - $ENVIRONMENT</h1>
    <p>Generated: $(date)</p>
EOF

# Process each report
for report in "$REPORT_DIR"/*.json; do
    if [[ -f "$report" ]]; then
        filename=$(basename "$report")
        status=$(jq -r '.overall_status // "unknown"' "$report")
        total=$(jq -r '.summary.total // 0' "$report")
        passed=$(jq -r '.summary.passed // 0' "$report")
        failed=$(jq -r '.summary.failed // 0' "$report")

        cat >> "$REPORT_DIR/index.html" << EOF
    <div class="report $status">
        <h3>$filename</h3>
        <p>Status: <strong>$status</strong></p>
        <p>Total: $total, Passed: $passed, Failed: $failed</p>
    </div>
EOF
    fi
done

cat >> "$REPORT_DIR/index.html" << EOF
</body>
</html>
EOF

echo "Reports generated in: $REPORT_DIR"
```

## Configuration

### Environment Variables

```bash
# Database configuration
export DB_HOST=your-db-host
export DB_PORT=5432
export DB_USER=your-db-user
export DB_NAME=your-db-name

# API endpoints
export API_BASE_URL=https://api.yourdomain.com

# Authentication
export TEST_USER_EMAIL=test@example.com
export TEST_USER_PASSWORD=testpass123

# Webhook for notifications
export NOTIFICATION_WEBHOOK=https://hooks.slack.com/...

# Security scan configuration
export TRIVY_CACHE_DIR=/tmp/trivy-cache
```

### Custom Test Configuration

```json
// config/validation-config.json
{
  "environments": {
    "production": {
      "api_url": "https://api.yourdomain.com",
      "frontend_url": "https://yourdomain.com",
      "timeout": 30,
      "retries": 3
    },
    "staging": {
      "api_url": "https://api.staging.yourdomain.com",
      "frontend_url": "https://staging.yourdomain.com",
      "timeout": 45,
      "retries": 2
    }
  },
  "performance_thresholds": {
    "api_response_time": 500,
    "page_load_time": 3000,
    "error_rate": 0.05
  },
  "security_thresholds": {
    "max_critical_vulns": 0,
    "max_high_vulns": 5
  }
}
```

## Best Practices

### 1. Test Environment Setup
- Use realistic test data
- Ensure test environment mirrors production
- Clean up test data after execution
- Isolate tests to prevent interference

### 2. Performance Testing
- Test under various load conditions
- Monitor resource usage trends
- Establish performance baselines
- Include stress testing scenarios

### 3. Security Validation
- Run security scans regularly
- Address critical vulnerabilities immediately
- Keep vulnerability databases updated
- Implement security in CI/CD pipeline

### 4. Integration Testing
- Test end-to-end business processes
- Include third-party integrations
- Validate data consistency
- Test error handling scenarios

### 5. Reporting and Monitoring
- Generate clear, actionable reports
- Set up automated notifications
- Track validation metrics over time
- Integrate with monitoring dashboards

## Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   chmod +x scripts/validation/*.sh
   ```

2. **Database Connection Failed**
   ```bash
   # Verify environment variables
   echo $DB_HOST $DB_PORT $DB_USER

   # Test connection manually
   psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;"
   ```

3. **API Tests Failing**
   ```bash
   # Check API endpoint availability
   curl -I https://api.yourdomain.com/health

   # Verify authentication
   curl -H "Authorization: Bearer $TOKEN" https://api.yourdomain.com/user/profile
   ```

4. **Performance Test Timeouts**
   ```bash
   # Increase timeout values
   ./performance-tests.sh production 120 5

   # Check network connectivity
   ping api.yourdomain.com
   ```

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
# Set debug environment variable
export DEBUG_VALIDATION=true

# Run scripts with verbose output
bash -x ./smoke-tests.sh production
```

## Related Documentation

- [Post-Deployment Validation Guide](../docs/POST_DEPLOYMENT_VALIDATION.md)
- [Deployment Monitoring Scripts](../deployment-monitoring/README.md)
- [CI/CD Pipeline](../docs/CI-CD.md)
- [Production Environment Configuration](../docs/PRODUCTION_ENVIRONMENT_CONFIG.md)