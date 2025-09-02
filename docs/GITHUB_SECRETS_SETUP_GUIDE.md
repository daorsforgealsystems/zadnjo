# GitHub Repository Secrets Setup Guide

This guide provides comprehensive instructions for configuring all required GitHub repository secrets for the CI/CD pipeline. These secrets are essential for automated deployment, testing, and monitoring.

## Table of Contents

1. [Overview](#overview)
2. [Required Secrets](#required-secrets)
3. [Optional Secrets](#optional-secrets)
4. [Setup Instructions](#setup-instructions)
5. [Validation](#validation)
6. [Security Best Practices](#security-best-practices)
7. [Troubleshooting](#troubleshooting)

## Overview

The CI/CD pipeline uses GitHub Actions and requires several secrets to function properly. These secrets enable:

- Frontend deployment to Netlify
- Container image building and pushing to Docker Hub
- Backend deployment to production servers
- Test coverage reporting to Codecov
- Database migrations (optional)
- Environment-specific configuration

## Required Secrets

### 1. Netlify Deployment Secrets

#### NETLIFY_AUTH_TOKEN
**Purpose**: Authentication token for Netlify CLI to deploy the frontend
**Used in**: `deploy-frontend` job in CI pipeline

**How to obtain:**
1. Go to [Netlify](https://app.netlify.com/)
2. Navigate to **User Settings** → **Applications**
3. Scroll to **Personal access tokens** section
4. Click **New access token**
5. Give it a descriptive name (e.g., "Flow Motion CI/CD")
6. Copy the generated token

**Format**: A long alphanumeric string starting with `nf...`

#### NETLIFY_SITE_ID
**Purpose**: Unique identifier for your Netlify site
**Used in**: `deploy-frontend` job in CI pipeline

**How to obtain:**
1. Go to your Netlify site dashboard
2. Navigate to **Site Settings** → **General**
3. Copy the **Site ID** (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### 2. Docker Registry Secrets

#### DOCKER_USERNAME
**Purpose**: Docker Hub username for pushing container images
**Used in**: `deploy-backend` job in CI pipeline

**How to obtain:**
- Your Docker Hub username (visible in Docker Hub profile)

#### DOCKER_PASSWORD
**Purpose**: Docker Hub password or access token
**Used in**: `deploy-backend` job in CI pipeline

**How to obtain:**
1. Go to [Docker Hub](https://hub.docker.com/)
2. Navigate to **Account Settings** → **Security**
3. Click **New Access Token**
4. Give it a descriptive name (e.g., "Flow Motion CI/CD")
5. Set appropriate permissions (Read/Write)
6. Copy the generated token

**Note**: Use an access token instead of your main password for better security

### 3. Production Server Deployment Secrets

#### PRODUCTION_HOST
**Purpose**: IP address or hostname of the production server
**Used in**: `deploy-backend` job in CI pipeline

**How to obtain:**
- Your production server's public IP address or domain name
- Example: `your-server.example.com` or `192.168.1.100`

#### PRODUCTION_USER
**Purpose**: SSH username for connecting to the production server
**Used in**: `deploy-backend` job in CI pipeline

**How to obtain:**
- The SSH username configured on your production server
- Common values: `ubuntu`, `ec2-user`, `root`, or a custom user

#### PRODUCTION_SSH_KEY
**Purpose**: Private SSH key for passwordless authentication to production server
**Used in**: `deploy-backend` job in CI pipeline

**How to obtain:**
1. Generate a new SSH key pair (recommended):
   ```bash
   ssh-keygen -t ed25519 -C "github-actions@yourdomain.com" -f ~/.ssh/github_actions
   ```
2. Or use an existing private key
3. Copy the entire private key content (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`)

**Important**: Never commit private keys to version control

### 4. Test Coverage Reporting

#### CODECOV_TOKEN
**Purpose**: Authentication token for uploading test coverage to Codecov
**Used in**: `test` job in CI pipeline

**How to obtain:**
1. Go to [Codecov](https://app.codecov.io/)
2. Sign in with your GitHub account
3. Select your repository
4. Navigate to **Settings** → **Repository Upload Token**
5. Copy the token

**Format**: A UUID-like string (e.g., `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

## Optional Secrets

### Development Environment Secrets

#### DEV_SUPABASE_DB_URL
**Purpose**: PostgreSQL connection string for development database migrations
**Used in**: `apply-migrations` job (optional)

**Format**: `postgresql://username:password@host:port/database`

#### DEV_SUPABASE_URL
**Purpose**: Supabase project URL for development environment
**Used in**: `build` job for development builds

**Format**: `https://your-project.supabase.co`

#### DEV_SUPABASE_ANON_KEY
**Purpose**: Supabase anonymous key for development environment
**Used in**: `build` job for development builds

### Production Environment Secrets

#### PROD_SUPABASE_URL
**Purpose**: Supabase project URL for production environment
**Used in**: `build` job for production builds

**Format**: `https://your-project.supabase.co`

#### PROD_SUPABASE_ANON_KEY
**Purpose**: Supabase anonymous key for production environment
**Used in**: `build` job for production builds

## Setup Instructions

### Step 1: Access GitHub Repository Settings

1. Go to your GitHub repository
2. Click **Settings** tab
3. Scroll down to **Security** section in the left sidebar
4. Click **Secrets and variables**
5. Click **Actions**

### Step 2: Add Required Secrets

For each secret listed above:

1. Click **New repository secret**
2. Enter the **Name** exactly as specified (case-sensitive)
3. Paste the **Value** from the service provider
4. Click **Add secret**

### Step 3: Verify Secret Names

Ensure all secret names match exactly:
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`
- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`
- `PRODUCTION_HOST`
- `PRODUCTION_USER`
- `PRODUCTION_SSH_KEY`
- `CODECOV_TOKEN`

## Validation

### Manual Validation

You can validate secrets are set correctly by:

1. Checking the **Actions** secrets page in repository settings
2. Running a test workflow (see troubleshooting section)
3. Using the setup script (see next section)

### Automated Validation

Use the provided setup script to validate all secrets:

```bash
# Run the validation script
./scripts/validate-secrets.sh
```

## Security Best Practices

### 1. Access Token Usage
- Use dedicated access tokens instead of main account passwords
- Set minimal required permissions for each token
- Rotate tokens regularly (at least quarterly)

### 2. SSH Key Management
- Generate unique SSH keys for CI/CD
- Use strong encryption (ed25519 recommended)
- Never reuse SSH keys across different services

### 3. Secret Rotation
- Implement a regular rotation schedule
- Update secrets immediately if compromised
- Use GitHub's secret update functionality

### 4. Environment Separation
- Use different secrets for different environments
- Never use production secrets in development
- Implement proper access controls

### 5. Monitoring and Auditing
- Monitor secret usage in GitHub Actions logs
- Set up alerts for failed deployments
- Regularly audit secret access

## Troubleshooting

### Common Issues

#### 1. "Secret not found" errors
- Check secret name spelling (case-sensitive)
- Ensure secret is added to the correct repository
- Verify the secret value is not empty

#### 2. Authentication failures
- Regenerate tokens if they may have expired
- Check token permissions and scopes
- Verify account has necessary access

#### 3. SSH connection issues
- Ensure SSH key is in correct format
- Verify server accepts the key
- Check firewall and security group settings

#### 4. Docker push failures
- Verify Docker Hub credentials
- Check repository permissions
- Ensure Docker Hub account is not rate-limited

### Testing Secrets

Create a simple test workflow to validate secrets:

```yaml
# .github/workflows/test-secrets.yml
name: Test Secrets
on: workflow_dispatch

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Test Netlify secrets
        run: |
          if [ -z "$NETLIFY_AUTH_TOKEN" ]; then echo "NETLIFY_AUTH_TOKEN not set"; exit 1; fi
          if [ -z "$NETLIFY_SITE_ID" ]; then echo "NETLIFY_SITE_ID not set"; exit 1; fi
          echo "✅ Netlify secrets OK"

      - name: Test Docker secrets
        run: |
          if [ -z "$DOCKER_USERNAME" ]; then echo "DOCKER_USERNAME not set"; exit 1; fi
          if [ -z "$DOCKER_PASSWORD" ]; then echo "DOCKER_PASSWORD not set"; exit 1; fi
          echo "✅ Docker secrets OK"

      - name: Test SSH secrets
        run: |
          if [ -z "$PRODUCTION_HOST" ]; then echo "PRODUCTION_HOST not set"; exit 1; fi
          if [ -z "$PRODUCTION_USER" ]; then echo "PRODUCTION_USER not set"; exit 1; fi
          if [ -z "$PRODUCTION_SSH_KEY" ]; then echo "PRODUCTION_SSH_KEY not set"; exit 1; fi
          echo "✅ SSH secrets OK"

      - name: Test Codecov secret
        run: |
          if [ -z "$CODECOV_TOKEN" ]; then echo "CODECOV_TOKEN not set"; exit 1; fi
          echo "✅ Codecov secret OK"
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
          DOCKER_USERNAME: ${{ secrets.DOCKER_USERNAME }}
          DOCKER_PASSWORD: ${{ secrets.DOCKER_PASSWORD }}
          PRODUCTION_HOST: ${{ secrets.PRODUCTION_HOST }}
          PRODUCTION_USER: ${{ secrets.PRODUCTION_USER }}
          PRODUCTION_SSH_KEY: ${{ secrets.PRODUCTION_SSH_KEY }}
          CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN }}
```

### Getting Help

If you encounter issues:
1. Check GitHub Actions logs for detailed error messages
2. Verify all prerequisites are met
3. Test individual services manually
4. Consult service-specific documentation
5. Contact your DevOps team or repository maintainers

## Additional Resources

- [GitHub Actions Security Guide](https://docs.github.com/en/actions/security-guides)
- [Netlify Build Hooks](https://docs.netlify.com/configure-builds/build-hooks/)
- [Docker Hub Access Tokens](https://docs.docker.com/docker-hub/access-tokens/)
- [Codecov Documentation](https://docs.codecov.com/docs)
- [Supabase Environment Variables](https://supabase.com/docs/guides/getting-started)

---

**Last Updated**: 2025-09-02
**Version**: 1.0