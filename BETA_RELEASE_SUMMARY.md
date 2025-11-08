# Beta Release System - Implementation Summary

## What Was Created

A complete beta release system for testing packages before production release.

## Files Added/Modified

### New Files
1. **`scripts/release-beta.sh`** - Main beta release script with dry-run support
2. **`BETA_RELEASES.md`** - Comprehensive documentation and guide
3. **`BETA_RELEASE_SUMMARY.md`** - This summary document

### Modified Files
1. **`package.json`** - Added npm scripts for beta releases
2. **`CLAUDE.md`** - Added reference to beta release documentation

## New npm Scripts

```bash
pnpm run release:beta          # Release all packages as beta
pnpm run release:beta:dry      # Preview without publishing
pnpm run release:beta:alpha    # Release with alpha tag
pnpm run release:beta:canary   # Release with canary tag
```

## Key Features

### 1. Safe Testing with Dry Run
```bash
pnpm run release:beta:dry
# Shows what will be published without actually publishing
# Automatically cleans up all changes after preview
```

### 2. Flexible Pre-release Tags
```bash
pnpm run release:beta          # Uses @beta tag
pnpm run release:beta:alpha    # Uses @alpha tag
pnpm run release:beta:canary   # Uses @canary tag
```

### 3. Smart Git Handling
- Default: No git commits (keeps history clean during testing)
- Optional: `--with-git` flag to commit and tag releases
- Dry run properly reverts all version changes including commits

### 4. Speed Options
```bash
# Full validation (default)
pnpm run release:beta

# Skip tests for rapid iteration
pnpm run release:beta -- --skip-tests
```

## How It Works

1. **Pre-release Mode**: Enters changeset pre-release mode with specified tag
2. **Generate Changesets**: Creates changesets for all packages
3. **Version Bump**: Updates versions (e.g., 0.1.32 → 0.1.33-beta.0)
4. **Build & Test**: Builds packages and runs lint/typecheck/smoke tests
5. **Publish**: Publishes with `--tag beta` instead of `--tag latest`
6. **Cleanup**: In dry-run mode, reverts all changes

## Version Format

```
Current:  0.1.32
Beta 1:   0.1.33-beta.0
Beta 2:   0.1.33-beta.1
Beta 3:   0.1.33-beta.2
Release:  0.1.33 (promoted from beta)
```

## Testing Workflow

### Quick Testing
```bash
# 1. Release beta
pnpm run release:beta -- --skip-tests

# 2. Install in your app
npm install @react-buoy/core@beta

# 3. Test and iterate
```

### Safe Testing
```bash
# 1. Preview first
pnpm run release:beta:dry

# 2. Release if okay
pnpm run release:beta

# 3. Test in app
npm install @react-buoy/core@beta

# 4. Promote to production if tests pass
pnpm run release
```

## Safety Features

- ✅ Requires clean working tree (no uncommitted changes)
- ✅ Dry run mode for safe previewing
- ✅ Automatic cleanup of all changes in dry run
- ✅ Sequential publishing in dependency order
- ✅ Skip already-published versions
- ✅ No git commits by default (opt-in with --with-git)

## Installation in Apps

```bash
# Install latest beta
npm install @react-buoy/core@beta

# Install specific beta version
npm install @react-buoy/core@0.1.33-beta.2

# Back to production version
npm install @react-buoy/core@latest
```

## Production Release

When beta testing is complete:

```bash
pnpm run release
# Bumps: 0.1.33-beta.2 → 0.1.33
# Publishes with @latest tag
# Creates git commits and tags
```

## Documentation

Full documentation available in [BETA_RELEASES.md](./BETA_RELEASES.md) including:
- Detailed usage examples
- Best practices
- Troubleshooting guide
- Technical details
- Workflow examples

## Testing Status

✅ Dry run tested and working
✅ Cleanup verified
✅ Version management confirmed
✅ Documentation complete
✅ Ready for use

## Next Steps

You can now:
1. Start using `pnpm run release:beta:dry` to preview beta releases
2. Use `pnpm run release:beta` when ready to publish
3. Test beta packages in your development app
4. Promote to production when testing is complete

See [BETA_RELEASES.md](./BETA_RELEASES.md) for the complete guide.
