# Development Linking Guide

This guide explains how to link your local `rn-buoy` packages to another React Native app (like `wb-mobile-app`) for testing without publishing to npm.

## Overview

The linking scripts use the `file:` protocol to create symlinks from your development app to the source packages in this monorepo. This allows you to:

- Test changes instantly in a development build (not just Expo Go)
- Work with native dependencies (like `react-native-mmkv`)
- Avoid publishing to npm for every change
- Get hot reloading for most changes

## Quick Start

### Link Packages

From the `rn-buoy` root directory:

```bash
./scripts/link-to-dev-app.sh
```

This will:
1. Backup your `wb-mobile-app/package.json` to `package.json.backup`
2. Update all `@react-buoy/*` dependencies to use `file:` references
3. Run `pnpm install` to create the symlinks
4. Show you next steps and troubleshooting tips

### Unlink Packages

When you're done testing and want to restore npm packages:

```bash
./scripts/unlink-from-dev-app.sh
```

This will:
1. Restore the original `package.json` from backup
2. Clean `node_modules` and `pnpm-lock.yaml`
3. Reinstall packages from npm

## How It Works

### The `file:` Protocol

The script modifies your `wb-mobile-app/package.json` to replace:

```json
{
  "@react-buoy/core": "^0.1.27"
}
```

With:

```json
{
  "@react-buoy/core": "file:../rn-buoy/packages/devtools-floating-menu"
}
```

When you run `pnpm install`, pnpm creates symlinks in `node_modules/@react-buoy/*` that point directly to your source packages.

### Metro Resolution

React Native's Metro bundler will resolve imports based on the `react-native` field in each package's `package.json`:

```json
{
  "main": "lib/commonjs/index",
  "module": "lib/module/index",
  "types": "lib/typescript/index.d.ts",
  "react-native": "src/index.tsx"  // ← Metro uses this!
}
```

This means Metro reads **source files** directly, giving you instant hot reloading without rebuilding!

## Configuration

### Updating Paths

If your apps are in different locations, edit the paths in both scripts:

**In `scripts/link-to-dev-app.sh` and `scripts/unlink-from-dev-app.sh`:**

```bash
# Configuration
RN_BUOY_ROOT="/Users/austinjohnson/Desktop/rn-buoy"
WB_MOBILE_APP_ROOT="/Users/austinjohnson/Desktop/wb-mobile-app"
```

### Adding/Removing Packages

If you add a new package to the monorepo, update the `PACKAGES` array in `scripts/link-to-dev-app.sh`:

```bash
PACKAGES=(
  "devtools-floating-menu:@react-buoy/core"
  "shared:@react-buoy/shared-ui"
  "env-tools:@react-buoy/env"
  "network:@react-buoy/network"
  "storage:@react-buoy/storage"
  "debug-borders:@react-buoy/debug-borders"
  "route-events:@react-buoy/route-events"
  "react-query:@react-buoy/react-query"
  "your-new-package:@react-buoy/your-new-package"  # Add here
)
```

Format: `"folder-name:npm-package-name"`

## Workflow

### Typical Development Flow

1. **Link the packages** (one time setup):
   ```bash
   cd /Users/austinjohnson/Desktop/rn-buoy
   ./scripts/link-to-dev-app.sh
   ```

2. **Start Metro in wb-mobile-app**:
   ```bash
   cd /Users/austinjohnson/Desktop/wb-mobile-app
   pnpm start
   ```

3. **Run the development build**:
   ```bash
   pnpm run ios  # or pnpm run android
   ```

4. **Make changes in rn-buoy**:
   - Edit files in `packages/*/src/`
   - Changes hot reload automatically in wb-mobile-app
   - No rebuild needed for JS/TS changes!

5. **When done testing**, unlink:
   ```bash
   cd /Users/austinjohnson/Desktop/rn-buoy
   ./scripts/unlink-from-dev-app.sh
   ```

### What Requires Rebuilding?

| Change Type | Requires Rebuild? | Requires Metro Restart? |
|-------------|-------------------|-------------------------|
| JS/TS code changes | ❌ No | ❌ No (hot reload) |
| Adding new files | ❌ No | ⚠️ Sometimes |
| Changing package structure | ✅ Yes | ✅ Yes |
| Native code changes | ✅ Yes | ✅ Yes |
| Adding native dependencies | ✅ Yes | ✅ Yes |

## Troubleshooting

### Changes Not Reflecting

**Problem**: You made changes in rn-buoy but they're not showing in wb-mobile-app.

**Solutions**:
1. Clear Metro cache:
   ```bash
   cd /Users/austinjohnson/Desktop/wb-mobile-app
   pnpm start --clear
   ```

2. Verify symlinks exist:
   ```bash
   ls -la /Users/austinjohnson/Desktop/wb-mobile-app/node_modules/@react-buoy
   # Should show symlinks (lrwxr-xr-x)
   ```

3. Check Metro is resolving to source:
   - Look at Metro output when importing
   - Should see paths like `packages/*/src/*` not `packages/*/lib/*`

### Build Errors in rn-buoy

**Problem**: The packages have TypeScript errors and won't build.

**Solution**: That's okay! You don't need to build packages for linking. Metro reads source files directly. The linking script skips the build step for this reason.

### Symlinks Broken

**Problem**: `node_modules/@react-buoy/*` are broken symlinks.

**Solutions**:
1. Ensure rn-buoy is at the correct path
2. Re-run the link script:
   ```bash
   ./scripts/link-to-dev-app.sh
   ```

### Metro Can't Find Module

**Problem**: Metro error: `Unable to resolve module @react-buoy/core`

**Solutions**:
1. Stop Metro
2. Clear watchman cache:
   ```bash
   watchman watch-del-all
   ```
3. Clear Metro cache:
   ```bash
   rm -rf /tmp/metro-*
   ```
4. Restart Metro:
   ```bash
   pnpm start --clear
   ```

### Native Changes Not Working

**Problem**: You changed native code but it's not updating.

**Solution**: You must rebuild the app:
```bash
cd /Users/austinjohnson/Desktop/wb-mobile-app
pnpm run ios  # or pnpm run android
```

### Cannot Find jq

**Problem**: Script error: `jq is not installed`

**Solution**: Install jq:
```bash
brew install jq
```

## Advanced Usage

### Testing Specific Package Versions

You can mix linked and npm packages by manually editing `package.json`:

```json
{
  "dependencies": {
    "@react-buoy/core": "file:../rn-buoy/packages/devtools-floating-menu",  // Linked
    "@react-buoy/network": "^0.1.27",  // From npm
    "@react-buoy/storage": "file:../rn-buoy/packages/storage"  // Linked
  }
}
```

Then run `pnpm install` to apply changes.

### Multiple Development Apps

To link to multiple apps, create separate scripts or use a variable:

```bash
# In link-to-dev-app.sh, make WB_MOBILE_APP_ROOT configurable
WB_MOBILE_APP_ROOT="${1:-/Users/austinjohnson/Desktop/wb-mobile-app}"
```

Usage:
```bash
./scripts/link-to-dev-app.sh /path/to/another/app
```

### Checking What's Linked

View current state:
```bash
cd /Users/austinjohnson/Desktop/wb-mobile-app
grep "@react-buoy" package.json
```

Or check the symlinks:
```bash
ls -la node_modules/@react-buoy
```

## Comparison with Other Methods

### vs. npm link / pnpm link --global

**File Protocol (`file:`) - Current Approach**
- ✅ Simpler - just edits package.json
- ✅ More reliable - no global state
- ✅ Works with pnpm's strict mode
- ✅ Easy to see what's linked (in package.json)
- ✅ Survives pnpm cache clears

**Global Linking (pnpm link --global)**
- ❌ Requires global registry
- ❌ Can have pnpm store version conflicts
- ❌ Less visible - need to remember what's linked
- ❌ Doesn't work well with pnpm's isolated node_modules

### vs. pnpm Workspace

**File Protocol (`file:`) - Current Approach**
- ✅ Keeps repos separate
- ✅ Tests "real" published package structure
- ✅ Easy to switch between linked/npm versions
- ❌ Manual setup (run script)

**Workspace (monorepo)**
- ✅ Automatic, no setup
- ✅ Instant changes
- ❌ Couples repositories together
- ❌ Less "production-like" testing

## Safety

### Backup and Restore

The link script automatically creates `package.json.backup` before making changes. If something goes wrong:

```bash
cd /Users/austinjohnson/Desktop/wb-mobile-app
mv package.json.backup package.json
pnpm install
```

### Git Status

The linking changes are **not meant to be committed**. Before committing:

1. Always unlink first:
   ```bash
   ./scripts/unlink-from-dev-app.sh
   ```

2. Or add to `.gitignore` in wb-mobile-app:
   ```
   package.json.backup
   ```

3. Check git diff before committing:
   ```bash
   cd /Users/austinjohnson/Desktop/wb-mobile-app
   git diff package.json
   ```

## FAQ

**Q: Do I need to rebuild packages in rn-buoy after changes?**
A: No! Metro reads source files directly via the `react-native` field.

**Q: Can I test this in Expo Go?**
A: The linking works, but Expo Go has limitations (no native dependencies). Use a development build.

**Q: Will this work on CI/CD?**
A: No, CI/CD should use published npm packages. Only use linking for local development.

**Q: Can I publish packages while they're linked?**
A: Yes, but unlink wb-mobile-app first to avoid confusion.

**Q: What if I delete rn-buoy while linked?**
A: wb-mobile-app will have broken symlinks. Run the unlink script or manually restore package.json.

**Q: Does this work with yarn or npm?**
A: The scripts use pnpm, but the `file:` protocol works with all package managers. You'd need to update the scripts to use `yarn` or `npm` instead of `pnpm`.

## Summary

- **Link**: `./scripts/link-to-dev-app.sh` - Sets up development linking
- **Unlink**: `./scripts/unlink-from-dev-app.sh` - Restores npm packages
- **Hot reload**: Works for JS/TS changes automatically
- **Rebuild**: Required for native changes
- **Safe**: Creates backup, easy to restore
- **Flexible**: Can mix linked and npm packages

Happy developing! 🚀
