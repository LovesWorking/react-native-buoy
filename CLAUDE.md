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
└── example/           # Example React Native app
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

# Run the example app
pnpm run start        # Metro bundler
pnpm run ios         # iOS simulator
pnpm run android     # Android emulator

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

Before committing:

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
