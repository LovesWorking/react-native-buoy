# Beta Releases Guide

This guide explains how to release beta versions of packages for testing without affecting production users.

## Overview

Beta releases allow you to:
- Test packages in real applications before releasing to production
- Iterate quickly without worrying about breaking production users
- Publish experimental features for early feedback
- Test dependency changes and compatibility

Beta packages are published with a `beta` tag on npm instead of `latest`, so users must explicitly opt-in to use them.

## Quick Start

```bash
# Release all packages as beta (with tests)
pnpm run release:beta

# Release all packages as beta (skip tests for faster iteration)
pnpm run release:beta -- --skip-tests

# Preview what would be published without actually publishing
pnpm run release:beta:dry

# Release with alpha tag instead of beta
pnpm run release:beta:alpha

# Release with canary tag
pnpm run release:beta:canary
```

## Version Format

Beta versions follow this format:
```
0.1.32 → 0.1.33-beta.0
0.1.33-beta.0 → 0.1.33-beta.1
0.1.33-beta.1 → 0.1.33-beta.2
```

Each beta release increments the beta number. When you're ready for production, run the normal release process which will publish `0.1.33` as `latest`.

## Script Options

### `scripts/release-beta.sh`

```bash
Usage: scripts/release-beta.sh [prerelease-id] [options]

Arguments:
  prerelease-id    Pre-release identifier (default: beta)
                   Examples: beta, alpha, rc, canary

Options:
  --dry-run        Show what would be published without actually publishing
  --skip-tests     Skip lint, typecheck, and smoke tests
  --with-git       Create git commits and tags (default: no git operations)
  --help           Show this help message

Examples:
  ./scripts/release-beta.sh                    # Release as beta
  ./scripts/release-beta.sh alpha              # Release as alpha
  ./scripts/release-beta.sh --dry-run          # Preview without publishing
  ./scripts/release-beta.sh beta --with-git    # Release beta and commit
  ./scripts/release-beta.sh --skip-tests       # Skip tests for faster iteration
```

## npm Scripts

Convenient npm scripts are available in the root `package.json`:

```bash
# Release with beta tag
pnpm run release:beta

# Preview without publishing
pnpm run release:beta:dry

# Release with alpha tag
pnpm run release:beta:alpha

# Release with canary tag
pnpm run release:beta:canary
```

## Testing Beta Packages

### In Your Development App

After publishing beta packages, install them in your app:

```bash
# Install the latest beta version
npm install @react-buoy/core@beta
npm install @react-buoy/network@beta

# Or install a specific beta version
npm install @react-buoy/core@0.1.33-beta.2
```

### Using Local Development

For even faster iteration, use local package linking instead of publishing:

```bash
# In rn-buoy repo
./scripts/link-to-dev-app.sh

# Make changes - they hot reload in your app!

# When done testing
./scripts/unlink-from-dev-app.sh
```

See [DEV_LINKING_GUIDE.md](./DEV_LINKING_GUIDE.md) for details.

## Workflow Examples

### Example 1: Quick Testing Iteration

```bash
# 1. Make changes to packages
# 2. Release beta (skip tests for speed)
pnpm run release:beta -- --skip-tests

# 3. Install in your app
npm install @react-buoy/core@beta

# 4. Test in your app
# 5. If issues found, fix and repeat from step 2
```

### Example 2: Careful Release with Validation

```bash
# 1. Preview what will be published
pnpm run release:beta:dry

# 2. If everything looks good, release
pnpm run release:beta

# 3. Install and test
npm install @react-buoy/core@beta

# 4. If tests pass, promote to production
pnpm run release
```

### Example 3: Alpha Testing

```bash
# Release as alpha for very experimental features
pnpm run release:beta:alpha

# Install alpha version
npm install @react-buoy/core@alpha
```

## Git Workflow

### Default Behavior (No Git Operations)

By default, beta releases do NOT create git commits or tags. This keeps your git history clean while testing:

```bash
pnpm run release:beta
# Version changes are made but not committed
# You can revert with: git reset --hard HEAD && pnpm install
```

### With Git Commits (Optional)

If you want to commit beta versions to git:

```bash
pnpm run release:beta -- --with-git
# Creates "chore: release beta packages" commit
# Pushes commit and tags to remote
```

## Promoting Beta to Production

Once you've tested your beta release and are confident it works:

```bash
# 1. Make sure you're on a clean working tree
git status

# 2. Run the normal release process
pnpm run release

# This will:
# - Bump versions from 0.1.33-beta.2 → 0.1.33
# - Publish with @latest tag
# - Create git commits and tags
# - Push to remote
```

## Cleaning Up After Beta Testing

If you made version changes during dry runs or beta releases that you want to discard:

```bash
# Revert all changes and reinstall
git reset --hard HEAD
pnpm install
```

## Best Practices

### DO:
- ✅ Use `--dry-run` first to preview changes
- ✅ Use beta releases for testing breaking changes
- ✅ Test beta packages in a real app before promoting to production
- ✅ Use `--skip-tests` for rapid iteration during development
- ✅ Use specific version numbers (`@0.1.33-beta.2`) for reproducible testing

### DON'T:
- ❌ Don't rely on beta versions in production apps
- ❌ Don't skip testing before promoting beta to latest
- ❌ Don't forget to test all affected packages together
- ❌ Don't publish beta versions with uncommitted changes

## Troubleshooting

### Issue: "Working tree is dirty"
**Solution:** Commit or stash your changes before running the release script.

```bash
git status                    # See what's changed
git add .                     # Stage changes
git commit -m "description"   # Commit changes
```

### Issue: Beta version already exists on npm
**Solution:** The script will skip packages that are already published. To publish a new beta:

```bash
# Make changes and release again
# Version will increment: 0.1.33-beta.0 → 0.1.33-beta.1
pnpm run release:beta
```

### Issue: Want to test without publishing
**Solution:** Use local linking instead:

```bash
./scripts/link-to-dev-app.sh
# Make changes - they hot reload
./scripts/unlink-from-dev-app.sh
```

### Issue: Dry run left version changes
**Solution:** The script should auto-cleanup, but if not:

```bash
git reset --hard HEAD
git clean -fd .changeset/
pnpm install
```

## Technical Details

### How It Works

1. **Pre-release mode**: Uses `changeset pre enter <tag>` to enable pre-release versioning
2. **Generate changeset**: Creates a changeset for all packages with patch bumps
3. **Version bump**: Runs `changeset version` to update package.json files
4. **Build & test**: Builds packages and runs tests (unless `--skip-tests`)
5. **Publish**: Publishes with `--tag <prerelease-id>` instead of `--tag latest`
6. **Cleanup**: In dry-run mode, reverts all changes

### Package Publish Order

Packages are published sequentially in dependency order:
1. `@react-buoy/shared-ui` (no dependencies)
2. `@react-buoy/core` (depends on shared-ui)
3. `@react-buoy/env` (depends on shared-ui)
4. `@react-buoy/network` (depends on shared-ui, react-query)
5. `@react-buoy/storage` (depends on shared-ui)
6. `@react-buoy/react-query` (depends on shared-ui)
7. `@react-buoy/route-events` (depends on shared-ui)
8. `@react-buoy/debug-borders` (depends on shared-ui)
9. `@react-buoy/bottom-sheet` (depends on shared-ui)

This ensures dependents always have access to the latest types from their dependencies.

## Additional Resources

- [Changesets Documentation](https://github.com/changesets/changesets)
- [npm dist-tags](https://docs.npmjs.com/cli/v8/commands/npm-dist-tag)
- [Semantic Versioning](https://semver.org/)
- [DEV_LINKING_GUIDE.md](./DEV_LINKING_GUIDE.md) - Local development workflow
