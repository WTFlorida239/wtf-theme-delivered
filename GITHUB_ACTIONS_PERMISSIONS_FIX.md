# GitHub Actions Permissions Fix

## Current Issue
GitHub Actions workflows are failing due to insufficient permissions.

## Required Permissions
- contents: read
- actions: read
- security-events: write
- statuses: write
- checks: write

## How to Fix

### Method 1: Repository Settings
1. Go to repository Settings → Actions → General
2. Under "Workflow permissions" select "Read and write permissions"
3. Check "Allow GitHub Actions to create and approve pull requests"

### Method 2: Update Workflow Files
Add this to each workflow file under the 'jobs' section:

```yaml
permissions:
  contents: read
  actions: read
  security-events: write
  statuses: write
  checks: write
```

### Method 3: Personal Access Token
1. Create PAT with 'repo' and 'workflow' scopes
2. Update git remote: `git remote set-url origin https://TOKEN@github.com/USER/REPO.git`

## Verification
After applying fixes, run: `npm run health:check`
