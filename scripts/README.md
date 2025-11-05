# Scripts Directory

This directory contains utility scripts for the React Native Buoy monorepo.

## Development Linking Scripts

### `link-to-dev-app.sh`

Links all `@react-buoy/*` packages to `wb-mobile-app` for local development testing.

**Usage:**
```bash
./scripts/link-to-dev-app.sh
# or
pnpm run link:dev
```

**What it does:**
1. Backs up `wb-mobile-app/package.json`
2. Updates all `@react-buoy/*` dependencies to use `file:` protocol
3. Runs `pnpm install` to create symlinks
4. Allows instant hot reloading of changes

### `unlink-from-dev-app.sh`

Restores `wb-mobile-app` to use published npm packages.

**Usage:**
```bash
./scripts/unlink-from-dev-app.sh
# or
pnpm run unlink:dev
```

**What it does:**
1. Restores original `package.json` from backup
2. Cleans `node_modules` and lockfile
3. Reinstalls packages from npm

### Full Documentation

See [DEV_LINKING_GUIDE.md](../DEV_LINKING_GUIDE.md) for complete documentation on:
- How linking works
- Configuration options
- Troubleshooting
- Advanced usage
- FAQ

## Other Scripts

### `create-package.js`

Creates a new package in the monorepo with proper structure.

**Usage:**
```bash
pnpm run create:package
```

### `check-build-artifacts.js`

Checks for build artifacts in `src/` directories (they should only be in `lib/`).

**Usage:**
```bash
pnpm run check:build-artifacts
```

### `release.sh` / `release-all.sh`

Handles the release process for publishing packages to npm.

**Usage:**
```bash
pnpm run release        # Release with changesets
pnpm run release:all    # Release all packages
```

### `gpt5-zip-repo.sh`

Creates a zip archive of the repo for sharing/review.

**Usage:**
```bash
pnpm run zip              # Default output
pnpm run zip:review       # Custom output path
```

### `screenshot.sh`

Takes screenshots for documentation.

**Usage:**
```bash
pnpm run screenshot
```

## Configuration

Most scripts use hardcoded paths. If you need to change paths, edit the variables at the top of each script:

```bash
# Example from link-to-dev-app.sh
RN_BUOY_ROOT="/Users/austinjohnson/Desktop/rn-buoy"
WB_MOBILE_APP_ROOT="/Users/austinjohnson/Desktop/wb-mobile-app"
```

## Requirements

### For Development Linking

- **jq**: JSON processor
  ```bash
  brew install jq
  ```

- **pnpm**: Package manager
  ```bash
  npm install -g pnpm
  ```

### For Other Scripts

Check individual script requirements as needed.
