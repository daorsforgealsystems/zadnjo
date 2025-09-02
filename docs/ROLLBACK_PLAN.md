# Rollback Plan for Flow Motion Logistics Platform

## Overview

This document outlines the rollback procedures for the Flow Motion logistics platform. Rollback procedures should be used when a deployment introduces critical issues that cannot be resolved through other means.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Rollback Scenarios](#rollback-scenarios)
3. [Application Rollback](#application-rollback)
4. [Database Rollback](#database-rollback)
5. [Infrastructure Rollback](#infrastructure-rollback)
6. [Emergency Procedures](#emergency-procedures)
7. [Post-Rollback Verification](#post-rollback-verification)
8. [Communication Plan](#communication-plan)

## Prerequisites

### Required Tools
- Docker and Docker Compose
- Git version control
- Database backup/restore scripts
- Access to deployment environment
- Monitoring and logging access

### Required Access
- SSH access to production servers
- Database admin privileges
- Container registry access
- CI/CD pipeline access

### Pre-Rollback Checklist
- [ ] Identify the issue and confirm rollback is necessary
- [ ] Notify stakeholders and team members
- [ ] Create backup of current state
- [ ] Document the rollback reason and process
- [ ] Prepare rollback environment

## Rollback Scenarios

### Scenario 1: Application Code Issues
**Symptoms**: Application crashes, incorrect functionality, performance degradation
**Rollback Method**: Container image rollback
**Estimated Time**: 10-15 minutes

### Scenario 2: Database Schema Changes
**Symptoms**: Data corruption, migration failures, application errors
**Rollback Method**: Database restore from backup
**Estimated Time**: 20-30 minutes

### Scenario 3: Infrastructure Configuration
**Symptoms**: Service connectivity issues, resource constraints
**Rollback Method**: Infrastructure as Code rollback
**Estimated Time**: 15-25 minutes

### Scenario 4: Complete System Failure
**Symptoms**: Multiple services down, data center issues
**Rollback Method**: Full environment rollback
**Estimated Time**: 30-60 minutes

## Application Rollback

### Container-Based Rollback

1. **Identify Previous Working Version**
   ```bash
   # List available container images
   docker images flow-motion-api

   # Check deployment history
   kubectl rollout history deployment/flow-motion-api
   ```

2. **Rollback Container Image**
   ```bash
   # For Docker Compose
   docker-compose pull  # Pull previous images
   docker-compose up -d --no-deps api-gateway

   # For Kubernetes
   kubectl rollout undo deployment/flow-motion-api --to-revision=2
   ```

3. **Verify Rollback**
   ```bash
   # Check container status
   docker-compose ps

   # Check application health
   curl http://localhost:8080/health
   ```

### Git-Based Rollback

1. **Identify Commit to Rollback To**
   ```bash
   git log --oneline -10
   git tag -l  # List release tags
   ```

2. **Rollback Code Changes**
   ```bash
   # Create revert commit
   git revert <problematic-commit-hash>

   # Or reset to previous commit (CAUTION: destructive)
   git reset --hard <previous-commit-hash>
   ```

3. **Redeploy Application**
   ```bash
   # Trigger CI/CD pipeline
   # Or manual deployment
   docker-compose build --no-cache
   docker-compose up -d
   ```

## Database Rollback

### Using Automated Scripts

1. **List Available Backups**
   ```bash
   ls -la /backups/logistics_backup_*.sql.gz
   ```

2. **Execute Database Restore**
   ```bash
   # Use the restore script
   ./scripts/restore-database.sh /backups/logistics_backup_20231201_020000.sql.gz
   ```

3. **Verify Database Integrity**
   ```bash
   # Connect to database and run checks
   psql -h localhost -U postgres -d logistics -c "SELECT COUNT(*) FROM users;"
   psql -h localhost -U postgres -d logistics -c "SELECT COUNT(*) FROM orders;"
   ```

### Manual Database Rollback

1. **Create Current Backup (Safety)**
   ```bash
   pg_dump -h localhost -U postgres -d logistics > pre_rollback_backup.sql
   ```

2. **Stop Application Services**
   ```bash
   docker-compose stop api-gateway user-service order-service
   ```

3. **Restore from Backup**
   ```bash
   # Terminate connections
   psql -h localhost -U postgres -d postgres -c "
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE datname = 'logistics' AND pid <> pg_backend_pid();"

   # Drop and recreate database
   psql -h localhost -U postgres -d postgres -c "DROP DATABASE logistics;"
   psql -h localhost -U postgres -d postgres -c "CREATE DATABASE logistics;"

   # Restore data
   psql -h localhost -U postgres -d logistics < backup_file.sql
   ```

4. **Restart Services**
   ```bash
   docker-compose start api-gateway user-service order-service
   ```

## Infrastructure Rollback

### Docker Compose Rollback

1. **Backup Current Configuration**
   ```bash
   cp docker-compose.yml docker-compose.yml.backup
   cp docker-compose.prod.yml docker-compose.prod.yml.backup
   ```

2. **Revert Configuration Changes**
   ```bash
   git checkout HEAD~1 docker-compose.yml
   git checkout HEAD~1 docker-compose.prod.yml
   ```

3. **Restart Services**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### Kubernetes Rollback

1. **Check Deployment History**
   ```bash
   kubectl rollout history deployment/flow-motion-api
   ```

2. **Rollback Deployment**
   ```bash
   kubectl rollout undo deployment/flow-motion-api --to-revision=1
   ```

3. **Verify Rollback**
   ```bash
   kubectl get pods
   kubectl logs deployment/flow-motion-api
   ```

## Emergency Procedures

### Immediate Shutdown
```bash
# Stop all services immediately
docker-compose down

# Or for Kubernetes
kubectl scale deployment --replicas=0 --all
```

### Data Recovery
1. Identify last known good backup
2. Restore database from backup
3. Verify data integrity
4. Restart services with minimal configuration

### Communication
1. Notify all stakeholders immediately
2. Update status page
3. Provide ETA for resolution
4. Document incident details

## Post-Rollback Verification

### Health Checks
```bash
# Check all service health endpoints
curl http://localhost:8080/health
curl http://localhost:4001/api/health
curl http://localhost:8000/health
curl http://localhost:4003/health
```

### Functional Testing
- [ ] User authentication works
- [ ] Basic CRUD operations function
- [ ] API responses are correct
- [ ] Database queries execute successfully
- [ ] External integrations work

### Performance Monitoring
- [ ] Response times within acceptable limits
- [ ] Memory and CPU usage normal
- [ ] Database connection pool healthy
- [ ] Error rates below threshold

### Data Integrity
```sql
-- Run data integrity checks
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM orders;
SELECT COUNT(*) FROM inventory_items;

-- Check for data consistency
SELECT * FROM orders WHERE created_at > NOW() - INTERVAL '1 hour';
```

## Communication Plan

### Internal Communication
- **Slack/Teams Channel**: #incidents
- **Email Distribution**: dev-team@company.com
- **Status Page**: Internal status dashboard

### External Communication
- **Customer Notification**: Via email/SMS for critical outages
- **Status Page**: Public status page (status.company.com)
- **Social Media**: Twitter/Facebook updates for major incidents

### Rollback Notification Template
```
Subject: Flow Motion Platform - Rollback Completed

Dear Team,

We have successfully rolled back the Flow Motion platform to version X.X.X due to [brief reason].

Status: ✅ Rollback completed
Duration: [time taken]
Impact: [affected services/users]
Next Steps: [monitoring period, follow-up actions]

Please monitor the system closely and report any issues.

Best regards,
DevOps Team
```

## Rollback Checklist

### Pre-Rollback
- [ ] Incident documented with timeline
- [ ] Root cause identified
- [ ] Rollback plan approved
- [ ] Backup created
- [ ] Stakeholders notified

### During Rollback
- [ ] Services stopped gracefully
- [ ] Rollback executed successfully
- [ ] Configuration changes reverted
- [ ] Services restarted
- [ ] Health checks passing

### Post-Rollback
- [ ] Functional testing completed
- [ ] Performance monitoring active
- [ ] Data integrity verified
- [ ] Stakeholders updated
- [ ] Incident report completed

## Contact Information

**DevOps Team**
- Primary: devops@company.com
- Secondary: +1-555-0123
- On-call: PagerDuty integration

**Database Team**
- DBA: dba@company.com
- Emergency: +1-555-0124

**Infrastructure Team**
- SRE: sre@company.com
- Emergency: +1-555-0125

---

**Last Updated**: December 2024
**Version**: 1.0
**Review Frequency**: Quarterly