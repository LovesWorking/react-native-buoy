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

# Run specific example app directly
pnpm run start:go    # Run Expo Go app
pnpm run start:dev   # Run Development Build app
pnpm run ios:go      # Run Expo Go on iOS
pnpm run ios:dev     # Run Dev Build on iOS
pnpm run android:go  # Run Expo Go on Android
pnpm run android:dev # Run Dev Build on Android

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
```

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

## AI Assistant Best Practices

1. **Always read this file first** when working in this repo
2. **Never run `tsc` directly** - use `pnpm run build` or `pnpm run typecheck`
3. **Only edit source files** in `src/` directories, never in `lib/`
4. **Use the package manager**: Run `pnpm install` not `npm install`
5. **Check the monorepo structure**: Changes may affect multiple packages
6. **Test in the example app**: The `example/` directory is for testing changes

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
