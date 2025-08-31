# Commit Message Guidelines

This document outlines our commit message conventions to maintain a clean and informative git history that integrates well with our issue tracking systems.

## Table of Contents

- [Commit Message Format](#commit-message-format)
- [Types of Changes](#types-of-changes)
- [Scope](#scope)
- [Subject](#subject)
- [Body](#body)
- [Footer](#footer)
- [Breaking Changes](#breaking-changes)
- [Issue References](#issue-references)
- [Examples](#examples)

## Commit Message Format

Each commit message consists of a **header**, **body**, and **footer**. The header has a special format that includes a **type**, **scope**, and **subject**:

```
<type>(<scope>): <subject>

<body>

<footer>
```

- **Header**: Required, must not be longer than 72 characters
- **Body**: Optional, provides detailed explanation
- **Footer**: Optional, contains issue references and notes about breaking changes

## Types of Changes

The `<type>` must be one of the following:

| Type | Description |
|------|-------------|
| `feat` | A new feature or enhancement |
| `fix` | A bug fix |
| `docs` | Documentation only changes |
| `style` | Changes that do not affect code behavior (formatting, whitespace) |
| `refactor` | Code changes that neither fix bugs nor add features |
| `perf` | Performance improvements |
| `test` | Adding or correcting tests |
| `chore` | Build process, dependency updates, or maintenance tasks |
| `ci` | Changes to CI configuration files and scripts |
| `revert` | Reverting a previous commit |
| `security` | Security-related changes |

## Scope

The `<scope>` is optional and should be a noun describing the section of the codebase affected by the change:

- `auth` - Authentication-related changes
- `api` - API-related changes
- `ui` - User interface components
- `db` - Database changes
- `config` - Configuration changes
- `deps` - Dependency updates
- Specific service names (e.g., `inventory-service`, `user-service`)
- Module names (e.g., `routing`, `notifications`)

If no scope fits, you can use `*` or omit the scope entirely.

## Subject

The `<subject>` is a short description of the change:

- Use imperative, present tense: "add" not "added" or "adds"
- Do not capitalize the first letter
- No period (.) at the end
- Keep it under 50 characters when possible
- Be descriptive and specific

## Body

The commit body is optional but recommended for complex changes:

- Use to explain the motivation behind the change
- Explain what and why vs. how
- Use imperative, present tense
- Include relevant background information
- Wrap lines at 72 characters

## Footer

The footer is optional and should contain:

- References to issues or tickets being addressed/closed
- Notes about breaking changes
- Co-author acknowledgments

## Breaking Changes

All breaking changes must be mentioned in the footer with the description of the change, justification, and migration notes:

```
BREAKING CHANGE: <description of what changed and what needs to be done to migrate>
```

## Issue References

Always reference issues using the following keywords:

| Keyword | Effect |
|---------|--------|
| `Closes #123` | Closes GitHub issue #123 when the commit is merged into the default branch |
| `Fixes #123` | Fixes GitHub issue #123 when the commit is merged into the default branch |
| `Resolves PROJ-123` | Indicates resolution of JIRA ticket PROJ-123 |
| `Addresses #123` | Addresses part of GitHub issue #123 without closing it |
| `Related to #123` | Indicates relationship to GitHub issue #123 without resolving it |

You can reference multiple issues:
```
Closes #123, #124
Fixes #123, Addresses #456
```

## Examples

### Good Commit Messages

```
feat(auth): implement JWT-based authentication

Implement JWT-based authentication system with token refresh capabilities.
The new system supports both session and token-based authentication modes.

Closes #123
```

```
fix(api): prevent race condition in concurrent requests

When multiple requests were processed simultaneously, a race condition could
occur causing inconsistent responses. This fix adds a locking mechanism to
ensure request processing integrity.

Fixes PROJ-456
```

```
refactor(inventory-service): optimize product search algorithm

Improved search performance by replacing linear search with indexed lookup.
Average query time reduced by 80% in benchmark tests.
```

```
chore(deps): update dependencies to latest versions

- React: 17.0.2 -> 18.0.0
- TypeScript: 4.5.5 -> 4.7.2
- Express: 4.17.3 -> 4.18.1

Addresses #789
```

```
docs: update API documentation with new endpoints

Added documentation for the newly implemented inventory management endpoints.
Updated authentication examples to reflect the new JWT requirements.

Closes PROJ-321
```

```
feat(checkout): add support for multiple payment methods

BREAKING CHANGE: The payment processing API now requires a payment method
parameter. Existing integrations need to specify 'credit_card' as the
payment method to maintain current behavior.

Resolves PROJ-987
```

### Bad Commit Messages

❌ **Bad examples:**

```
fixed bug
```
*Too vague, doesn't follow format*

```
Added new feature for users that allows them to update their profile information including name, email, and avatar which resolves the long-standing issue reported by many customers over the last few months
```
*Too long for a subject line, should be split into subject and body*

```
FEAT(AUTH): IMPLEMENT LOGIN SYSTEM
```
*All caps is not necessary and harder to read*

```
feat: did some stuff
```
*Not descriptive enough*

```
chore: updates
```
*Not specific enough about what was updated*

## Squashing Commits

When squashing multiple commits during a PR merge, ensure the squashed commit message:

1. Follows the same format as individual commit messages
2. Includes the PR number in the subject line, e.g., `feat(auth): implement JWT authentication (#123)`
3. Summarizes all significant changes from the individual commits
4. Preserves all issue references and breaking change notifications
5. Includes co-author credits for collaborative work

## Tooling Support

Consider using tools to enforce these conventions:

- [Commitizen](https://github.com/commitizen/cz-cli): Command line tool for formatting commit messages
- [commitlint](https://github.com/conventional-changelog/commitlint): Linter for checking commit message format
- Git hooks (via Husky) to validate commit messages before they're submitted

You can set up these tools in your local development environment to help maintain consistent commit messages.