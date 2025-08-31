# Contributing Guidelines

Thank you for your interest in contributing to our project! This document outlines our branching strategy, pull request workflow, and other important guidelines to ensure a consistent development process.

## Table of Contents

- [Branching Strategy](#branching-strategy)
- [Branch Naming Conventions](#branch-naming-conventions)
- [Pull Request Process](#pull-request-process)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Code Review Process](#code-review-process)
- [Post-Merge Cleanup](#post-merge-cleanup)

## Branching Strategy

This project follows a modified GitFlow workflow with two main branches:

- `main`: Production-ready code that has been thoroughly tested and is deployed to production
- `develop`: Integration branch for feature development, contains code for the next release

All development work should be done in separate branches created from `develop` (or in some cases, `main` for hotfixes).

## Branch Naming Conventions

Branch names must follow this pattern:
```
<type>/<ticket-reference>-<short-description>
```

### Branch Types

- `feature/` - New functionality or enhancements
- `fix/` - Bug fixes
- `hotfix/` - Critical production fixes
- `chore/` - Maintenance tasks, dependency updates, etc.
- `docs/` - Documentation updates
- `refactor/` - Code refactoring without changing behavior
- `test/` - Adding or modifying tests

### Ticket Reference

Include the issue tracking identifier when applicable:
- JIRA tickets: `PROJ-123`
- GitHub issues: `issue-123`
- For version-specific hotfixes: `v2.1.3`

### Short Description

A brief, hyphenated description of the change. Keep it concise and descriptive.

### Examples

✅ **Good branch names:**
- `feature/PROJ-123-user-authentication`
- `fix/bug-critical-login-error`
- `hotfix/security-patch-v2.1.3`
- `chore/update-dependencies`
- `docs/api-documentation-update`
- `refactor/PROJ-456-optimize-routing-algorithm`
- `test/add-inventory-service-tests`

❌ **Bad branch names:**
- `my-feature` (missing type prefix and description)
- `feature/new-stuff` (missing ticket reference and poor description)
- `feature_PROJ-123_add_authentication` (incorrect separators)
- `fix/PROJ-123` (missing description)

## Pull Request Process

### PR Title Format

Pull request titles must follow one of these formats:

1. For ticket-related work:
   ```
   [PROJ-123] Brief description of changes
   ```

2. For specific change types without tickets:
   ```
   <Type>: Brief description of changes (#issue-number)
   ```
   
   Where `<Type>` is one of:
   - `Feature` - New functionality
   - `Fix` - Bug fixes
   - `Docs` - Documentation changes
   - `Style` - Code style/formatting changes
   - `Refactor` - Code changes that neither fix bugs nor add features
   - `Perf` - Performance improvements
   - `Test` - Adding or correcting tests
   - `Chore` - Maintenance tasks, dependency updates, etc.

### PR Description

Every pull request must use the provided PR template and include:

1. A clear summary of changes
2. Testing performed
3. Breaking changes (if any)
4. Links to related issues using the appropriate keywords:
   - `Closes #123` or `Closes PROJ-123` (automatically closes the issue when PR is merged)
   - `Fixes #123` (fixes an issue)
   - `Resolves PROJ-123` (resolves a ticket)
   - `Addresses #123` (partially addresses an issue)
5. Reviewer checklist
6. Deployment notes (if applicable)
7. Changelog entry

### Linking to Issues

Every PR should be linked to at least one issue or ticket using one of the [GitHub keywords](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue#linking-a-pull-request-to-an-issue-using-a-keyword) in the PR description:

- `Closes #123` - Closes GitHub issue 123 when PR is merged
- `Fixes #123` - Fixes GitHub issue 123 when PR is merged
- `Resolves PROJ-123` - Indicates resolution of JIRA ticket PROJ-123

### Changelog Entries

All PRs must include a changelog entry in the PR description under the appropriate category:
- Feature: New features or enhancements
- Fix: Bug fixes
- Security: Security-related changes
- Deprecated: Features being deprecated
- Other: Changes that don't fit the above categories

## Code Review Process

1. All code changes require at least one review from an appropriate code owner
2. Address all reviewer comments before merge
3. Maintainers may request changes to conform to project standards
4. All required status checks must pass before merging

## Post-Merge Cleanup

After your PR is merged:

1. Delete your feature branch (automated for most PRs)
2. Update any related tickets/issues with relevant information
3. Verify the changes work as expected in the target environment

---

These guidelines help maintain code quality and consistency throughout the project. Thank you for following them!