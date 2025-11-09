# React Native Buoy - AI Assistant Guidelines

This is a monorepo for React Native developer tools. Please read these guidelines carefully before making changes.

## ⚠️ CRITICAL BUILD RULES

### DO NOT run `tsc` or `npx tsc` directly in this repo!

**Why?** Running TypeScript compiler directly will emit `.d.ts`, `.d.ts.map`, and `.js` build artifacts into the `src/` directories, polluting the source code.

### ✅ CORRECT way to build packages:

```bash
# Build all packages
pnpm run build

# Build a specific package
cd packages/[package-name]
pnpm run build

# This uses react-native-builder-bob which properly outputs to lib/ directories
```

### ❌ NEVER do this:

```bash
tsc                    # NO - emits files to src/
npx tsc                # NO - emits files to src/
tsc -p tsconfig.json   # NO - emits files to src/
```

## Project Structure

This is a pnpm workspace monorepo with the following structure:

```
rn-buoy/
├── packages/          # All library packages
│   ├── devtools-floating-menu/  # Main devtools UI
│   ├── shared/        # Shared UI components
│   ├── env-tools/     # Environment variable tools
│   ├── network/       # Network monitoring
│   ├── storage/       # AsyncStorage browser
│   ├── react-query/   # React Query devtools
│   ├── route-events/  # Navigation tracking
│   └── debug-borders/ # Visual debug borders
├── example/           # Example app (Expo Go)
└── example-dev-build/ # Example app (Development Build)
```

## Build System

Each package uses **react-native-builder-bob** to build three targets:
- `lib/commonjs/` - CommonJS modules
- `lib/module/` - ES modules
- `lib/typescript/` - TypeScript declaration files

The root `tsconfig.json` has `"noEmit": true` to prevent accidental file emission.

## Common Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Run the example apps (interactive - choose Expo Go or Dev Build)
pnpm run start        # Metro bundler (prompts for choice)
pnpm run ios         # iOS simulator (prompts for choice)
pnpm run android     # Android emulator (prompts for choice)

# Run specific example app directly (with cache isolation)
pnpm run start:example       # Run Expo Go app (port 8081)
pnpm run start:dev           # Run Development Build app (port 8082)
pnpm run start:example:clean # Run Expo Go with fresh cache
pnpm run start:dev:clean     # Run Dev Build with fresh cache

# Legacy commands (still work via choose-example.js)
pnpm run start:go    # Run Expo Go app
pnpm run start:dev   # Run Development Build app
pnpm run ios:go      # Run Expo Go on iOS
pnpm run ios:dev     # Run Dev Build on iOS
pnpm run android:go  # Run Expo Go on Android
pnpm run android:dev # Run Dev Build on Android

# Cache management (IMPORTANT for multi-instance scenarios)
pnpm run cache:health         # Check cache health and port status
pnpm run clean:cache          # Clean all Metro caches
pnpm run clean:cache:example  # Clean only example app cache
pnpm run clean:cache:dev      # Clean only dev-build app cache

# Type checking (safe - doesn't emit files)
pnpm run typecheck

# Clean build artifacts
pnpm run clean

# Fresh install and build
pnpm run fresh

# Create a new package
pnpm run create:package
```

## Making Changes

1. **Source files** live in `packages/*/src/` directories
2. **Build artifacts** go to `packages/*/lib/` directories
3. Never manually create or edit files in `lib/` directories
4. Always run `pnpm run build` after making changes to source files

## Type Checking vs Building

- **Type checking**: `pnpm run typecheck` - checks types without emitting files ✅
- **Building**: `pnpm run build` - compiles and emits to lib/ directories ✅
- **Direct tsc**: NEVER - will pollute src/ with build artifacts ❌

## Git Workflow

The `.gitignore` is configured to ignore:
- `lib/` directories (build outputs)
- Build artifacts in `src/` directories (`.d.ts`, `.d.ts.map`, `.js`)

If you see build artifacts in `src/` directories, they were created by mistake and should be deleted.

## Publishing

Packages are published to npm under the `@react-buoy` scope:
- `@react-buoy/core`
- `@react-buoy/shared-ui`
- `@react-buoy/env`
- `@react-buoy/network`
- `@react-buoy/storage`
- `@react-buoy/react-query`
- `@react-buoy/route-events`
- `@react-buoy/debug-borders`

Version management uses changesets:

```bash
# Create a changeset
pnpm changeset

# Version packages
pnpm run release:version

# Publish to npm
pnpm run release:publish

# Release beta versions for testing (see BETA_RELEASES.md)
pnpm run release:beta        # Publish beta versions
pnpm run release:beta:dry    # Preview without publishing
```

For testing packages before production release, see [BETA_RELEASES.md](./BETA_RELEASES.md).

## Testing Changes

### In the Example Apps

We have two example apps for testing:

1. **`example/` - Expo Go App**
   - For testing packages without native dependencies
   - Fastest testing workflow - just scan QR code
   - Use when testing pure JavaScript/TypeScript changes

2. **`example-dev-build/` - Development Build App**
   - For testing packages WITH native dependencies
   - Requires building native app first
   - Use when testing native modules or changes requiring native code

```bash
# Interactive mode (choose which app to run)
pnpm run start        # Prompts you to choose
pnpm run ios         # Prompts you to choose
pnpm run android     # Prompts you to choose

# Direct mode (skip the prompt)
pnpm run start:go    # Run Expo Go app
pnpm run start:dev   # Run Dev Build app
```

### In an External Development Build App

To test packages in an external development build (e.g., `wb-mobile-app`) with native dependencies:

```bash
# Link packages for local development (one-time setup)
./scripts/link-to-dev-app.sh

# Make changes in packages - they'll hot reload in the dev app!

# When done testing, unlink
./scripts/unlink-from-dev-app.sh
```

See [DEV_LINKING_GUIDE.md](./DEV_LINKING_GUIDE.md) for full documentation.

### Before Committing

```bash
# 1. Build all packages
pnpm run build

# 2. Run type checking
pnpm run typecheck

# 3. Run linting
pnpm run lint

# Or run all tests at once
pnpm run test
```

## Metro Cache Isolation for Multi-Instance Development

**CRITICAL**: This monorepo has TWO example apps that can run simultaneously:
- `example/` (Expo Go) - Runs on port **8081**
- `example-dev-build/` (Development Build) - Runs on port **8082**

### Cache Isolation Configuration

Both apps are configured with **project-specific cache isolation** to prevent cache contamination:
- Unique `cacheVersion` per app (uses package name)
- Project-specific cache directories (`node_modules/.cache/metro/`)
- Project-specific file map caches (`.metro-file-map/`)
- `stickyWorkers: false` to prevent worker state bleeding
- Fixed port assignments to prevent device connection conflicts

### Running Multiple Apps Simultaneously

**Best Practice**: Always clean cache when switching between single and multi-instance workflows:

```bash
# Start example app on port 8081
pnpm run start:example:clean

# In a DIFFERENT terminal, start dev-build on port 8082
pnpm run start:dev:clean
```

**Device Connection Setup**:

For Android (ADB reverse):
```bash
# Terminal 1 (example app)
adb reverse tcp:8081 tcp:8081

# Terminal 2 (dev-build app)
adb reverse tcp:8082 tcp:8082
```

For iOS Simulators:
- Simulator A: Dev Menu (Cmd+D) → Configure Bundler → `localhost:8081`
- Simulator B: Dev Menu (Cmd+D) → Configure Bundler → `localhost:8082`

### Cache Management

**When to clear cache**:
- Switching between single and multi-instance workflows
- Experiencing "funky" behavior (mixed environment variables, wrong app on simulator)
- Hot reload affecting wrong app
- After pulling major changes from git

**Commands**:
```bash
pnpm run cache:health  # Check cache status and running ports
pnpm run clean:cache   # Nuclear option - clears everything
```

**Cache Locations**:
- Project-specific: `example/node_modules/.cache/metro/`
- Project-specific: `example-dev-build/node_modules/.cache/metro/`
- File maps: `example/.metro-file-map/`, `example-dev-build/.metro-file-map/`
- Legacy system cache: `/tmp/metro-*` (should be empty with new config)

### Troubleshooting Multi-Instance Issues

**Problem**: Wrong app appears on simulator
- **Cause**: Device connection to wrong port
- **Solution**: Check iOS Dev Menu bundler URL or Android ADB reverse

**Problem**: Environment variables mixed between apps
- **Cause**: Cache collision (shouldn't happen with new config)
- **Solution**: `pnpm run clean:cache && restart both apps`

**Problem**: Hot reload affects both apps
- **Cause**: Device connection misconfiguration
- **Solution**: Verify each simulator is connected to correct port

**Problem**: Watchman errors or "too many files"
- **Cause**: Watchman daemon shared between instances (architectural limitation)
- **Solution**: `watchman watch-del-all && restart apps`

## AI Assistant Best Practices

1. **Always read this file first** when working in this repo
2. **Never run `tsc` directly** - use `pnpm run build` or `pnpm run typecheck`
3. **Only edit source files** in `src/` directories, never in `lib/`
4. **Use the package manager**: Run `pnpm install` not `npm install`
5. **Check the monorepo structure**: Changes may affect multiple packages
6. **Test in the example app**: The `example/` directory is for testing changes
7. **Multi-instance awareness**: Remember port assignments (8081 vs 8082) and cache isolation
8. **Clean cache proactively**: Use `pnpm run clean:cache` when debugging weird behavior

## Troubleshooting

**Problem**: Build artifacts appearing in `src/` directories
**Cause**: Someone ran `tsc` directly
**Solution**: Delete the artifacts and rebuild with `pnpm run build`

```bash
# Clean and rebuild
pnpm run clean
pnpm run build
```

**Problem**: Type errors in IDE but builds work
**Cause**: IDE using wrong tsconfig or stale cache
**Solution**: Restart TypeScript server in your IDE

**Problem**: Package not found errors
**Cause**: Packages not built or not installed
**Solution**: Run `pnpm install && pnpm run build`
