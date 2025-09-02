# Branch Protection Rules Setup

This document explains how to configure branch protection rules for the Flow Motion project to ensure code quality and deployment safety.

## Required Status Checks

The following status checks must pass before code can be merged:

### For `main` branch:
- `lint-and-typecheck`
- `test`
- `build (development)`
- `build (production)`
- `security-scan`
- `codeql-analysis`
- `performance-test`
- `deployment-ready`

### For `develop` branch:
- `lint-and-typecheck`
- `test`
- `build (development)`
- `build (production)`

## How to Configure Branch Protection

### Option 1: Manual Configuration via GitHub UI

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Branches**
3. Click **Add rule**
4. Configure the following for `main` branch:
   - **Branch name pattern**: `main`
   - **Require a pull request before merging**
     - [x] Require approvals (1)
     - [x] Dismiss stale pull request approvals when new commits are pushed
     - [x] Require review from Code Owners
   - **Require status checks to pass**
     - [x] Require branches to be up to date before merging
     - [x] Status checks found in the last week for this repository:
       - `lint-and-typecheck`
       - `test`
       - `build (development)`
       - `build (production)`
       - `security-scan`
       - `codeql-analysis`
       - `performance-test`
       - `deployment-ready`
   - **Require conversation resolution before merging**
   - **Include administrators**
   - **Restrict pushes that create matching branches**
   - **Allow force pushes**: No
   - **Allow deletions**: No

5. Configure the following for `develop` branch:
   - **Branch name pattern**: `develop`
   - **Require a pull request before merging**
     - [x] Require approvals (1)
   - **Require status checks to pass**
     - [x] Status checks found in the last week for this repository:
       - `lint-and-typecheck`
       - `test`
       - `build (development)`
       - `build (production)`
   - **Allow force pushes**: No
   - **Allow deletions**: No

### Option 2: Using GitHub CLI

```bash
# Configure main branch protection
gh api repos/{owner}/{repo}/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["lint-and-typecheck","test","build (development)","build (production)","security-scan","codeql-analysis","performance-test","deployment-ready"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":true}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false \
  --field block_creations=true \
  --field required_linear_history=true

# Configure develop branch protection
gh api repos/{owner}/{repo}/branches/develop/protection \
  --method PUT \
  --field required_status_checks='{"strict":false,"contexts":["lint-and-typecheck","test","build (development)","build (production)"]}' \
  --field enforce_admins=false \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false \
  --field block_creations=false \
  --field required_linear_history=false
```

### Option 3: Using the Configuration File

The `.github/branch-protection-rules.json` file contains the complete configuration that can be applied programmatically using GitHub's REST API or third-party tools.

## Required Secrets

Ensure the following secrets are configured in your repository settings:

### For Netlify Deployment:
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`

### For Docker Deployment:
- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`

### For Production Server Access:
- `PRODUCTION_HOST`
- `PRODUCTION_USER`
- `PRODUCTION_SSH_KEY`

### For Database Migrations (optional):
- `DEV_SUPABASE_DB_URL`

### For Code Coverage:
- `CODECOV_TOKEN`

## Testing Branch Protection

To test that branch protection is working correctly:

1. Create a new branch from `main`
2. Make a change that would fail one of the required checks (e.g., introduce a linting error)
3. Create a pull request
4. Verify that the merge button is disabled until all checks pass
5. Fix the issue and verify all checks pass
6. Confirm the pull request can be merged

## Troubleshooting

### Status Checks Not Appearing
- Ensure the workflow file is in the correct location: `.github/workflows/ci.yml`
- Check that the workflow has run at least once after adding new jobs
- Verify the job names in the workflow match the required status checks exactly

### Branch Protection Not Enforcing
- Check that you have admin permissions on the repository
- Verify the branch name pattern matches your branch names
- Ensure "Include administrators" is checked if you want to enforce rules for admins too

### Deployment Jobs Not Running
- Verify that the deployment jobs have the correct `if` conditions
- Check that the required secrets are properly configured
- Ensure the workflow has the necessary permissions for deployments