# Branch Protection Guidelines

This document outlines the branch protection rules implemented in our repository to maintain code quality and ensure a stable codebase.

## Protected Branches

The following branches are protected:

- `main` - Production-ready code
- `develop` - Integration branch for the next release

## Branch Protection Rules

### Main Branch (`main`)

The `main` branch has the following protection rules:

1. **Require pull request before merging**
   - At least 2 approvals required from code owners or maintainers
   - Dismiss stale pull request approvals when new commits are pushed
   - Require review from Code Owners

2. **Require status checks to pass before merging**
   - Required status checks:
     - `lint-and-typecheck`
     - `test`
     - `build`
     - `security-scan`
     - `deployment-ready`
   - Require branches to be up to date before merging

3. **Restrict who can push to matching branches**
   - Only administrators and designated maintainers can push directly

4. **Additional settings**
   - Do not allow bypassing the above settings
   - Allow force pushes: **No**
   - Allow deletions: **No**

### Development Branch (`develop`)

The `develop` branch has the following protection rules:

1. **Require pull request before merging**
   - At least 1 approval required
   - Dismiss stale pull request approvals when new commits are pushed

2. **Require status checks to pass before merging**
   - Required status checks:
     - `lint-and-typecheck`
     - `test`
     - `build`
   - Require branches to be up to date before merging

3. **Additional settings**
   - Allow force pushes: **No**
   - Allow deletions: **No**

## Required Status Checks

All PRs must pass the following status checks before they can be merged:

| Status Check | Description | Required for Main | Required for Develop |
|--------------|-------------|-------------------|----------------------|
| `lint-and-typecheck` | Code style and type checking | ✅ | ✅ |
| `test` | Unit and integration tests | ✅ | ✅ |
| `build` | Application builds successfully | ✅ | ✅ |
| `security-scan` | Security vulnerability scanning | ✅ | ❌ |
| `deployment-ready` | All checks pass for deployment | ✅ | ❌ |
| `bundle-analysis` | Bundle size analysis | ❌ | ❌ |

## Merge Requirements

The following requirements must be met for all merges:

1. **Up-to-date branch**: The feature branch must be up-to-date with the base branch before merging
2. **Required reviews**: All required reviews must be approved
3. **Passing status checks**: All required status checks must pass
4. **No merge conflicts**: All conflicts must be resolved before merging

## Merge Methods

The following merge methods are allowed:

| Branch | Allowed Merge Methods |
|--------|------------------------|
| `main` | Squash and merge only |
| `develop` | Squash and merge, Merge commit |

### Squash Merging Requirements

When using "Squash and merge", the squashed commit message must:

1. Follow the same format as the PR title
2. Preserve co-authors from the original commits
3. Include a summary of key changes

## Setting Up Branch Protection

### GitHub Repository Settings

To set up these branch protection rules in GitHub:

1. Go to the repository on GitHub
2. Click on "Settings"
3. Click on "Branches" in the left sidebar
4. Under "Branch protection rules", click "Add rule"
5. Enter the branch name pattern (e.g., `main` or `develop`)
6. Configure the protection settings according to this document
7. Click "Create" or "Save changes"

## Enforcing Branch Protection

These branch protection rules are enforced through:

1. GitHub repository settings
2. Continuous Integration pipeline
3. Code ownership validation
4. Automated checks in the pull request process

Bypassing these protections requires administrator intervention and should only be done in exceptional circumstances with proper documentation and justification.