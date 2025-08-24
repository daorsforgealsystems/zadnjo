# Components.json Validation Setup

## Overview

This setup ensures your `components.json` stays stable and prevents configuration drift that could break shadcn/ui tooling.

## Schema Validation

✅ **Current Status**: 
- Schema URL: `https://ui.shadcn.com/schema.json` (stable, auto-updating)
- Config validation: **Enabled** in both local dev and CI

## Local Development Commands

```powershell
# Validate components.json only
npm run validate:components

# Full validation (lint + type-check + components)  
npm run check

# Run before committing
npm run check && npm run test
```

## What Gets Validated

### ✅ **Critical Checks (Build Breaking)**
- Schema URL presence and format
- Required fields: `$schema`, `style`, `rsc`, `tsx`, `tailwind`, `aliases`
- File path validation (CSS and Tailwind config files exist)
- Required alias mappings

### ⚠️ **Warning Checks (Non-Breaking)**  
- `cssVariables: true` setting
- `rsc: false` for Vite setup
- `tsx: true` for TypeScript
- Alias consistency (using `@/` prefix)

## CI Integration

The validation runs automatically in GitHub Actions as part of the `lint-and-typecheck` job:

```yaml
- name: Validate components.json
  run: npm run validate:components
```

## Configuration Stability

### ✅ **Safe to Change**
- `baseColor`: Theme color (slate, gray, etc.)
- `style`: Component style variant
- File paths (if files actually moved)

### ⚠️ **Change with Caution**
- `cssVariables`: Should stay `true` for proper theming
- `rsc`: Should stay `false` for Vite setup
- `tsx`: Should stay `true` for TypeScript
- Alias mappings: Breaking changes affect imports

### 🚫 **Don't Change Without Good Reason**
- `$schema`: Keep pointing to latest unless tooling breaks
- Required field structure

## Troubleshooting

### If validation fails:
1. Check the validation output for specific errors
2. Compare against a working `components.json`
3. Verify file paths exist
4. Test with `npx shadcn@latest add button` to ensure tooling works

### If CI fails:
1. Run `npm run check` locally first
2. Fix any validation errors
3. Commit and push again

## Manual Validation (Alternative)

If you prefer using shadcn CLI directly:
```powershell
# Check if components.json is valid for shadcn tooling
npx shadcn@latest add --help
```

## Files Modified
- `package.json`: Added `validate:components` script
- `.github/workflows/ci.yml`: Added validation step
- `scripts/validate-components.js`: Validation logic