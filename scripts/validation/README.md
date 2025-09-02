# Post-Deployment Validation Scripts

This directory contains comprehensive scripts for validating deployments after they are released to production or staging environments. The framework has been significantly enhanced with automated testing, comprehensive endpoint validation, integration testing, load testing, regression testing, and automated reporting.

## Enhanced Framework Overview

### Core Components

1. **Pre-Deployment Verification** - Ensures deployment readiness
2. **Post-Deployment Validation** - Comprehensive validation after deployment
3. **Endpoint Testing Framework** - Detailed API validation
4. **Integration Testing Suite** - End-to-end workflow testing
5. **Load Testing Framework** - Performance under stress
6. **Regression Testing** - Detects performance regressions
7. **Continuous Monitoring** - Ongoing health checks
8. **Automated Reporting** - Comprehensive reports and notifications

## Scripts Overview

### 1. `pre-deployment-verification.sh`
**Purpose**: Pre-deployment readiness assessment
**Features**:
- Infrastructure health checks
- Database connectivity validation
- Service dependency verification
- Configuration validation
- Security readiness assessment
- Deployment type specific checks

**Usage**:
```bash
./pre-deployment-verification.sh production rolling
```

### 2. `post-deployment-validation.sh`
**Purpose**: Comprehensive post-deployment validation
**Features**:
- Immediate validation (0-5 minutes)
- Short-term validation (5-30 minutes)
- Long-term validation (30+ minutes)
- Performance validation
- Security validation
- Business logic validation

**Usage**:
```bash
./post-deployment-validation.sh production comprehensive
```

### 3. `endpoint-tests.sh`
**Purpose**: Comprehensive API endpoint testing framework
**Features**:
- Health check validation
- Response time validation
- Status code verification
- Authentication/authorization testing
- Data integrity checks
- Rate limiting validation
- CORS configuration testing

**Usage**:
```bash
./endpoint-tests.sh production 30
```

### 4. `integration-tests-enhanced.sh`
**Purpose**: Enhanced integration testing with comprehensive workflows
**Features**:
- User workflow testing
- Order processing workflows
- Inventory synchronization
- Payment processing
- Notification systems
- Database integration
- External service integration
- Data flow validation
- Business logic testing
- Performance benchmarks

**Usage**:
```bash
./integration-tests-enhanced.sh staging "test-user@example.com"
```

### 5. `load-testing.sh`
**Purpose**: Load testing with multiple patterns
**Features**:
- Gradual load increase
- Spike testing
- Sustained load testing
- Stress testing
- Response time analysis
- Error rate monitoring
- Resource usage tracking
- Comprehensive reporting

**Usage**:
```bash
./load-testing.sh production gradual 300 100
```

### 6. `regression-testing.sh`
**Purpose**: Performance regression detection
**Features**:
- Baseline comparison
- API endpoint regression testing
- Database performance regression
- Business logic regression
- Performance regression detection
- Automated baseline updates
- Detailed regression reports

**Usage**:
```bash
./regression-testing.sh staging /tmp/regression_baseline_staging.json
```

### 7. `continuous-monitoring.sh`
**Purpose**: Ongoing system health monitoring
**Features**:
- Real-time health checks
- Alert generation
- System metrics collection
- Automated notifications
- Historical data tracking
- Configurable monitoring intervals

**Usage**:
```bash
./continuous-monitoring.sh production 300 "https://hooks.slack.com/..."
```

### 8. `generate-validation-report.sh`
**Purpose**: Automated report generation and notifications
**Features**:
- Comprehensive report aggregation
- System metrics collection
- Automated recommendations
- Multi-channel notifications (Slack, Email, SMS)
- HTML report generation
- Status determination
- Historical tracking

**Usage**:
```bash
./generate-validation-report.sh production comprehensive "slack,email"
```

## Automation Integration

### GitHub Actions Workflow

```yaml
name: Post-Deployment Validation

on:
  deployment:
    types: [completed]

jobs:
  validation:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Pre-Deployment Verification
        run: |
          chmod +x scripts/validation/pre-deployment-verification.sh
          ./scripts/validation/pre-deployment-verification.sh production rolling

      - name: Endpoint Testing
        run: |
          chmod +x scripts/validation/endpoint-tests.sh
          ./scripts/validation/endpoint-tests.sh production

      - name: Integration Testing
        run: |
          chmod +x scripts/validation/integration-tests-enhanced.sh
          ./scripts/validation/integration-tests-enhanced.sh production

      - name: Load Testing
        run: |
          chmod +x scripts/validation/load-testing.sh
          ./scripts/validation/load-testing.sh production gradual

      - name: Regression Testing
        run: |
          chmod +x scripts/validation/regression-testing.sh
          ./scripts/validation/regression-testing.sh production

      - name: Generate Report
        run: |
          chmod +x scripts/validation/generate-validation-report.sh
          ./scripts/validation/generate-validation-report.sh production comprehensive

      - name: Send Notifications
        run: |
          ./scripts/validation/generate-validation-report.sh production comprehensive slack
        if: always()
```

### Cron-Based Automation

```bash
# Pre-deployment checks (run before deployments)
*/30 * * * * /opt/logi-core/scripts/validation/pre-deployment-verification.sh production rolling

# Post-deployment validation (run after deployments)
0 */2 * * * /opt/logi-core/scripts/validation/post-deployment-validation.sh production comprehensive

# Continuous monitoring
*/5 * * * * /opt/logi-core/scripts/validation/continuous-monitoring.sh production 300

# Daily comprehensive validation
0 2 * * * /opt/logi-core/scripts/validation/generate-validation-report.sh production comprehensive "slack,email"

# Weekly regression testing
0 3 * * 1 /opt/logi-core/scripts/validation/regression-testing.sh production

# Load testing (monthly)
0 4 1 * * /opt/logi-core/scripts/validation/load-testing.sh production stress
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

# Notification webhooks
export SLACK_WEBHOOK_URL=https://hooks.slack.com/...
export EMAIL_WEBHOOK_URL=https://api.sendgrid.com/...

# Test configuration
export TEST_TIMEOUT=30
export MAX_RETRIES=3
export PERFORMANCE_THRESHOLD=1000
```

### Validation Configuration

```json
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
  "thresholds": {
    "response_time_critical": 5000,
    "response_time_warning": 2000,
    "error_rate_critical": 0.05,
    "error_rate_warning": 0.01,
    "cpu_usage_critical": 90,
    "cpu_usage_warning": 75,
    "memory_usage_critical": 85,
    "memory_usage_warning": 70
  },
  "notifications": {
    "channels": ["slack", "email"],
    "escalation_minutes": 15,
    "critical_recipients": ["devops@company.com", "+1234567890"]
  }
}
```

## Report Generation

### Automated Report Collection

The framework automatically generates comprehensive reports in multiple formats:

- **JSON Reports**: Detailed structured data for programmatic access
- **HTML Reports**: Human-readable web reports with visualizations
- **Summary Reports**: Executive summaries for stakeholders
- **Historical Reports**: Trend analysis over time

### Report Contents

Each comprehensive report includes:

1. **Test Results Summary**
   - Pass/fail status for each test suite
   - Performance metrics and benchmarks
   - Error rates and failure analysis

2. **System Metrics**
   - Kubernetes pod status and resource usage
   - Database connection pools and performance
   - System resource utilization

3. **Recommendations**
   - Actionable insights based on test results
   - Priority levels for issues found
   - Suggested remediation steps

4. **Historical Trends**
   - Performance trends over time
   - Regression detection and analysis
   - Improvement tracking

## Best Practices

### 1. Test Environment Setup
- Use realistic test data that mirrors production
- Ensure test environments are isolated from production
- Clean up test data after execution
- Maintain consistent test environments across deployments

### 2. Performance Benchmarking
- Establish performance baselines for all critical paths
- Monitor trends and set appropriate thresholds
- Include stress testing in regular validation cycles
- Document performance requirements and SLAs

### 3. Security Validation
- Run security scans regularly, not just after deployments
- Address critical vulnerabilities immediately
- Keep vulnerability databases and scanning tools updated
- Implement security testing in CI/CD pipelines

### 4. Integration Testing
- Test end-to-end business processes regularly
- Include third-party integrations in validation cycles
- Validate data consistency across all systems
- Test error handling and recovery scenarios

### 5. Monitoring and Alerting
- Set up comprehensive monitoring for all critical systems
- Configure appropriate alert thresholds and escalation
- Ensure notifications reach the right people at the right time
- Regularly review and update monitoring configurations

### 6. Continuous Improvement
- Learn from each validation cycle and deployment
- Update test cases based on findings and new requirements
- Improve automation coverage and efficiency
- Refine thresholds and benchmarks based on real usage patterns

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

4. **Load Test Timeouts**
   ```bash
   # Increase timeout values
   ./load-testing.sh production gradual 300 50

   # Check network connectivity
   ping api.yourdomain.com
   ```

5. **Report Generation Issues**
   ```bash
   # Check jq installation
   which jq

   # Verify report directory permissions
   ls -la /tmp/validation_reports_*/
   ```

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
# Set debug environment variables
export DEBUG_VALIDATION=true
export VERBOSE_LOGGING=true

# Run scripts with verbose output
bash -x ./endpoint-tests.sh production

# Check detailed logs
tail -f /tmp/validation_reports_*/validation_report.json
```

## Related Documentation

- [Testing Framework Documentation](../docs/TESTING_FRAMEWORK.md)
- [Deployment Triggering Guide](../docs/DEPLOYMENT_TRIGGERING_GUIDE.md)
- [Deployment Monitoring Scripts](../deployment-monitoring/README.md)
- [CI/CD Pipeline](../docs/CI-CD.md)
- [Production Environment Configuration](../docs/PRODUCTION_ENVIRONMENT_CONFIG.md)
- [Rollback Procedures](../docs/ROLLBACK_PROCEDURES.md)

---

This enhanced validation framework provides comprehensive, automated testing capabilities that ensure deployment quality, performance, and reliability across all critical dimensions of your application infrastructure.