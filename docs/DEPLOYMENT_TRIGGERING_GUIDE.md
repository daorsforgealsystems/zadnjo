# Deployment Triggering Guide

This guide provides comprehensive procedures for triggering deployments across different environments and scenarios. It covers both manual and automated deployment strategies, ensuring consistent and reliable release processes.

## Table of Contents

1. [Manual Deployment Triggering](#manual-deployment-triggering)
2. [Automated Deployment Scheduling](#automated-deployment-scheduling)
3. [Branch-Based Deployment Strategies](#branch-based-deployment-strategies)
4. [Deployment Approval Workflows](#deployment-approval-workflows)
5. [Emergency Deployment Procedures](#emergency-deployment-procedures)
6. [Deployment Prerequisites](#deployment-prerequisites)
7. [Post-Trigger Verification](#post-trigger-verification)

## Manual Deployment Triggering

### Frontend Deployment (Netlify)

#### Production Deployment

```bash
# Method 1: Using Netlify CLI
npm run build:netlify
netlify deploy --prod --dir=dist

# Method 2: Manual build and deploy
npm run build:netlify
netlify deploy --prod --dir=dist --message="Production deployment v1.2.3"

# Method 3: Deploy from specific commit
netlify deploy --prod --dir=dist --message="Deploy $(git rev-parse --short HEAD)"
```

#### Staging Deployment

```bash
# Deploy to staging environment
npm run build:dev
netlify deploy --alias=staging --dir=dist
```

#### Preview Deployment

```bash
# Deploy preview for pull request
netlify deploy --dir=dist --alias=pr-$(git branch --show-current | sed 's/.*\///')
```

### Backend Deployment (Kubernetes)

#### Manual Kubernetes Deployment

```bash
# Update image tag in kustomization
cd logi-core/k8s/overlays/prod
kustomize edit set image ghcr.io/your-org/logi-core-api-gateway:v1.2.3

# Apply changes
kubectl apply -k .

# Verify deployment
kubectl rollout status deployment/api-gateway -n logi-core
```

#### Docker Compose Deployment

```bash
# Update docker-compose.prod.yml with new image tags
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Verify services
docker-compose -f docker-compose.prod.yml ps
```

### Database Migration Deployment

```bash
# Manual migration application
kubectl exec -it $(kubectl get pods -l app=postgres -o jsonpath="{.items[0].metadata.name}") -- \
  psql -U logistics -d logistics -f /docker-entrypoint-initdb.d/migrations/001_new_migration.sql

# Verify migration
kubectl exec -it $(kubectl get pods -l app=postgres -o jsonpath="{.items[0].metadata.name}") -- \
  psql -U logistics -d logistics -c "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1;"
```

## Automated Deployment Scheduling

### GitHub Actions Scheduled Deployments

#### Nightly Staging Deployment

```yaml
# .github/workflows/nightly-staging.yml
name: Nightly Staging Deployment

on:
  schedule:
    - cron: '0 2 * * 1-5'  # Monday to Friday at 2 AM UTC
  workflow_dispatch:

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test -- --run

      - name: Build staging
        run: npm run build:dev
        env:
          VITE_API_BASE_URL: ${{ secrets.STAGING_API_URL }}

      - name: Deploy to staging
        run: npx netlify-cli deploy --dir=dist --alias=staging
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

#### Weekly Production Backup and Health Check

```yaml
# .github/workflows/weekly-maintenance.yml
name: Weekly Maintenance

on:
  schedule:
    - cron: '0 3 * * 0'  # Sunday at 3 AM UTC
  workflow_dispatch:

jobs:
  backup-and-health:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Health check
        run: curl -f https://yourdomain.com/health

      - name: Trigger backup
        run: |
          ssh user@production-server "/opt/flowmotion/scripts/backup-database.sh"

      - name: Send notification
        uses: slackapi/slack-github-action@v1
        with:
          payload: '{"text":"Weekly maintenance completed"}'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Cron-Based Deployments

#### Automated Patch Deployment

```bash
# Add to production server crontab
# Deploy security patches every Sunday at 4 AM
0 4 * * 0 /opt/flowmotion/scripts/deploy-patches.sh

# deploy-patches.sh
#!/bin/bash
set -e

echo "Starting automated patch deployment..."

# Pull latest changes
cd /opt/flowmotion
git pull origin main

# Run security updates
npm audit fix

# Build and deploy
npm run build:netlify
netlify deploy --prod --dir=dist --message="Automated patch deployment $(date)"

echo "Patch deployment completed successfully"
```

## Branch-Based Deployment Strategies

### Git Flow Deployment Strategy

#### Branch Mapping

| Branch | Environment | Trigger | Auto-deploy |
|--------|-------------|---------|-------------|
| `main` | Production | Merge to main | Yes (Netlify) |
| `develop` | Staging | Push to develop | Yes (Netlify) |
| `release/*` | Pre-production | Push to release/* | Manual approval |
| `feature/*` | Feature | PR to develop | Preview deploy |
| `hotfix/*` | Hotfix | Push to hotfix/* | Manual approval |

#### Branch Protection Rules

```yaml
# .github/settings.yml (if using github-settings)
repository:
  name: flow-motion
  branches:
    - name: main
      protection:
        required_status_checks:
          contexts:
            - "lint-and-typecheck"
            - "test"
            - "build (production)"
            - "security-scan"
            - "deployment-ready"
        required_pull_request_reviews:
          required_approving_review_count: 2
        restrictions: null
        enforce_admins: true
        allow_force_pushes: false
        allow_deletions: false
    - name: develop
      protection:
        required_status_checks:
          contexts:
            - "lint-and-typecheck"
            - "test"
            - "build (development)"
        required_pull_request_reviews:
          required_approving_review_count: 1
```

### Environment-Specific Deployment

#### Multi-Environment Deployment Script

```bash
#!/bin/bash
# scripts/deploy-to-env.sh

ENVIRONMENT=$1
BRANCH=${2:-$(git branch --show-current)}

if [[ -z "$ENVIRONMENT" ]]; then
    echo "Usage: $0 <environment> [branch]"
    echo "Environments: dev, staging, prod"
    exit 1
fi

case $ENVIRONMENT in
    dev)
        KUSTOMIZE_DIR="logi-core/k8s/overlays/dev"
        NETLIFY_ALIAS="dev"
        ;;
    staging)
        KUSTOMIZE_DIR="logi-core/k8s/overlays/staging"
        NETLIFY_ALIAS="staging"
        ;;
    prod)
        KUSTOMIZE_DIR="logi-core/k8s/overlays/prod"
        NETLIFY_ALIAS="production"
        ;;
    *)
        echo "Unknown environment: $ENVIRONMENT"
        exit 1
        ;;
esac

echo "Deploying branch $BRANCH to $ENVIRONMENT environment..."

# Frontend deployment
npm run build:netlify
netlify deploy --alias=$NETLIFY_ALIAS --dir=dist

# Backend deployment
cd $KUSTOMIZE_DIR
kustomize edit set image ghcr.io/your-org/logi-core-api-gateway:$(git rev-parse --short HEAD)
kubectl apply -k .

echo "Deployment to $ENVIRONMENT completed"
```

## Deployment Approval Workflows

### GitHub Environments and Approvals

#### Production Environment Setup

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to deploy'
        required: true
        type: string

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.inputs.version }}

      - name: Deploy to production
        run: |
          echo "Deploying version ${{ github.event.inputs.version }} to production"
          # Add deployment commands here
```

#### Required Reviewers Configuration

```yaml
# .github/workflows/require-approval.yml
name: Require Deployment Approval

on:
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened]

jobs:
  require-approval:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Require approval
        run: |
          if [[ "${{ github.event.pull_request.draft }}" == "true" ]]; then
            echo "Draft PR - skipping approval requirement"
            exit 0
          fi

          # Check if PR has required approvals
          APPROVALS=$(gh pr view ${{ github.event.pull_request.number }} --json reviews --jq '.reviews | map(select(.state == "APPROVED")) | length')

          if [[ $APPROVALS -lt 2 ]]; then
            echo "PR requires at least 2 approvals for production deployment"
            exit 1
          fi
```

### Slack Integration for Approvals

#### Slack Approval Workflow

```yaml
# .github/workflows/slack-approval.yml
name: Slack Deployment Approval

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

jobs:
  request-approval:
    runs-on: ubuntu-latest
    steps:
      - name: Send Slack notification
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Deployment approval requested for ${{ github.event.inputs.environment }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Deployment Approval Required*\nEnvironment: ${{ github.event.inputs.environment }}\nBranch: ${{ github.ref_name }}\nCommit: ${{ github.sha }}"
                  }
                },
                {
                  "type": "actions",
                  "elements": [
                    {
                      "type": "button",
                      "text": {
                        "type": "plain_text",
                        "text": "Approve"
                      },
                      "style": "primary",
                      "action_id": "approve_deployment"
                    },
                    {
                      "type": "button",
                      "text": {
                        "type": "plain_text",
                        "text": "Reject"
                      },
                      "style": "danger",
                      "action_id": "reject_deployment"
                    }
                  ]
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Emergency Deployment Procedures

### Hotfix Deployment Process

#### Emergency Hotfix Steps

1. **Create Hotfix Branch**
   ```bash
   git checkout -b hotfix/critical-security-fix main
   ```

2. **Implement Fix**
   ```bash
   # Make necessary changes
   git add .
   git commit -m "HOTFIX: Critical security vulnerability fix"
   ```

3. **Bypass Normal Process**
   ```bash
   # Skip tests if necessary (document reason)
   git push origin hotfix/critical-security-fix

   # Manual deployment
   ./scripts/emergency-deploy.sh production
   ```

4. **Notify Team**
   ```bash
   # Send emergency notification
   curl -X POST -H 'Content-type: application/json' \
     --data '{"text":"🚨 EMERGENCY DEPLOYMENT: Critical security fix deployed to production"}' \
     $SLACK_WEBHOOK_URL
   ```

#### Emergency Deployment Script

```bash
#!/bin/bash
# scripts/emergency-deploy.sh

ENVIRONMENT=$1
SKIP_TESTS=${2:-false}

if [[ -z "$ENVIRONMENT" ]]; then
    echo "Usage: $0 <environment> [skip-tests]"
    exit 1
fi

echo "🚨 EMERGENCY DEPLOYMENT TO $ENVIRONMENT 🚨"
echo "Timestamp: $(date)"
echo "User: $(whoami)"
echo "Branch: $(git branch --show-current)"
echo "Commit: $(git rev-parse --short HEAD)"

# Emergency confirmation
read -p "Are you sure you want to proceed with emergency deployment? (yes/no): " confirm
if [[ "$confirm" != "yes" ]]; then
    echo "Emergency deployment cancelled"
    exit 1
fi

# Skip tests if specified
if [[ "$SKIP_TESTS" == "true" ]]; then
    echo "⚠️  SKIPPING TESTS AS REQUESTED"
else
    echo "Running critical tests..."
    npm run test:critical || exit 1
fi

# Deploy based on environment
case $ENVIRONMENT in
    production)
        echo "Deploying to production..."
        npm run build:netlify
        netlify deploy --prod --dir=dist --message="EMERGENCY: $(git log -1 --oneline)"
        ;;
    staging)
        echo "Deploying to staging..."
        npm run build:dev
        netlify deploy --alias=staging --dir=dist
        ;;
    *)
        echo "Unknown environment: $ENVIRONMENT"
        exit 1
        ;;
esac

echo "✅ Emergency deployment completed"
echo "📝 Document the reason for this emergency deployment"
```

### Rollback Procedures

#### Quick Rollback Script

```bash
#!/bin/bash
# scripts/rollback.sh

ENVIRONMENT=$1
TARGET_VERSION=${2:-previous}

if [[ -z "$ENVIRONMENT" ]]; then
    echo "Usage: $0 <environment> [target-version]"
    exit 1
fi

echo "Rolling back $ENVIRONMENT environment to $TARGET_VERSION..."

case $ENVIRONMENT in
    production)
        # Netlify rollback
        netlify deploy --prod --dir=dist --message="ROLLBACK to $TARGET_VERSION"
        ;;
    staging)
        # Kubernetes rollback
        kubectl rollout undo deployment/api-gateway -n logi-core
        ;;
    *)
        echo "Unknown environment: $ENVIRONMENT"
        exit 1
        ;;
esac

echo "✅ Rollback completed"
```

## Deployment Prerequisites

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Security scan completed
- [ ] Code review approved
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Backup completed
- [ ] Rollback plan documented
- [ ] Team notified of deployment window

### Environment Readiness Verification

```bash
#!/bin/bash
# scripts/verify-deployment-readiness.sh

ENVIRONMENT=$1

echo "Verifying deployment readiness for $ENVIRONMENT..."

# Check environment variables
if [[ ! -f ".env.$ENVIRONMENT" ]]; then
    echo "❌ Environment file .env.$ENVIRONMENT not found"
    exit 1
fi

# Validate configuration
./scripts/validate-config.sh ".env.$ENVIRONMENT"

# Check database connectivity
if ! pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; then
    echo "❌ Database not accessible"
    exit 1
fi

# Verify service health
if ! curl -f https://api.$ENVIRONMENT.yourdomain.com/health; then
    echo "❌ API health check failed"
    exit 1
fi

echo "✅ $ENVIRONMENT environment is ready for deployment"
```

## Post-Trigger Verification

### Deployment Verification Steps

1. **Monitor Deployment Progress**
   ```bash
   # Kubernetes deployment status
   kubectl get pods -n logi-core
   kubectl rollout status deployment/api-gateway -n logi-core

   # Netlify deployment status
   netlify status
   ```

2. **Health Checks**
   ```bash
   # Application health
   curl -f https://yourdomain.com/health

   # API endpoints
   curl -f https://api.yourdomain.com/v1/status

   # Database connectivity
   kubectl exec -it $(kubectl get pods -l app=postgres -o jsonpath="{.items[0].metadata.name}") -- \
     psql -U logistics -d logistics -c "SELECT 1;"
   ```

3. **Log Verification**
   ```bash
   # Check application logs
   kubectl logs -f deployment/api-gateway -n logi-core

   # Check ingress logs
   kubectl logs -f deployment/nginx-ingress -n ingress-nginx
   ```

4. **Performance Monitoring**
   ```bash
   # Check response times
   curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com/

   # Monitor error rates
   kubectl get events -n logi-core --sort-by=.metadata.creationTimestamp
   ```

### Automated Post-Deployment Validation

```bash
#!/bin/bash
# scripts/post-deployment-validation.sh

ENVIRONMENT=$1
TIMEOUT=${2:-300}  # 5 minutes default

echo "Starting post-deployment validation for $ENVIRONMENT..."

START_TIME=$(date +%s)

# Wait for deployment to complete
echo "Waiting for deployment to stabilize..."
sleep 30

# Health checks
echo "Performing health checks..."
HEALTH_CHECKS_PASSED=0
TOTAL_CHECKS=0

# Application health
((TOTAL_CHECKS++))
if curl -f --max-time 10 https://$ENVIRONMENT.yourdomain.com/health; then
    ((HEALTH_CHECKS_PASSED++))
    echo "✅ Application health check passed"
else
    echo "❌ Application health check failed"
fi

# API health
((TOTAL_CHECKS++))
if curl -f --max-time 10 https://api.$ENVIRONMENT.yourdomain.com/v1/health; then
    ((HEALTH_CHECKS_PASSED++))
    echo "✅ API health check passed"
else
    echo "❌ API health check failed"
fi

# Database connectivity
((TOTAL_CHECKS++))
if kubectl exec -it $(kubectl get pods -l app=postgres -o jsonpath="{.items[0].metadata.name}") -- \
  psql -U logistics -d logistics -c "SELECT 1;" >/dev/null 2>&1; then
    ((HEALTH_CHECKS_PASSED++))
    echo "✅ Database connectivity check passed"
else
    echo "❌ Database connectivity check failed"
fi

# Performance check
((TOTAL_CHECKS++))
RESPONSE_TIME=$(curl -w "%{time_total}" -o /dev/null -s https://$ENVIRONMENT.yourdomain.com/)
if (( $(echo "$RESPONSE_TIME < 2.0" | bc -l) )); then
    ((HEALTH_CHECKS_PASSED++))
    echo "✅ Performance check passed (response time: ${RESPONSE_TIME}s)"
else
    echo "❌ Performance check failed (response time: ${RESPONSE_TIME}s)"
fi

# Calculate success rate
SUCCESS_RATE=$(( HEALTH_CHECKS_PASSED * 100 / TOTAL_CHECKS ))

if [[ $SUCCESS_RATE -ge 75 ]]; then
    echo "✅ Post-deployment validation PASSED ($HEALTH_CHECKS_PASSED/$TOTAL_CHECKS checks)"
    exit 0
else
    echo "❌ Post-deployment validation FAILED ($HEALTH_CHECKS_PASSED/$TOTAL_CHECKS checks)"
    exit 1
fi
```

## Related Documentation

- [Deployment Guide](DEPLOYMENT.md) - General deployment procedures
- [CI/CD Guide](CI-CD.md) - Automated deployment pipelines
- [Production Environment Configuration](PRODUCTION_ENVIRONMENT_CONFIG.md) - Environment setup
- [Monitoring and Alerting](MONITORING_ALERTING.md) - Post-deployment monitoring
- [Rollback Procedures](ROLLBACK_PROCEDURES.md) - Recovery procedures

## Best Practices

1. **Always test deployments in staging first**
2. **Use feature flags for risky changes**
3. **Have a rollback plan ready**
4. **Monitor deployments closely for the first 30 minutes**
5. **Document any deviations from standard procedures**
6. **Communicate deployment schedules to the team**
7. **Use automated validation wherever possible**
8. **Keep deployment windows short to minimize impact**