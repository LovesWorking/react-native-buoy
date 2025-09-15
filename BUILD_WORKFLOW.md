# Build Workflow Documentation

## Overview
This monorepo uses React Native Builder Bob for building packages, pnpm workspaces for linking, and Lerna for orchestration.

## Key Commands

### Installation
```bash
# Install all dependencies and build packages
pnpm install
```

### Building Packages

```bash
# Build all packages
pnpm build

# Clean and rebuild everything
pnpm fresh

# Clean packages only
pnpm clean:packages

# Full clean (including node_modules)
pnpm clean
```

### Development Workflow

```bash
# Start the app (hot reload enabled)
pnpm start

# Run on specific platforms
pnpm ios
pnpm android
```

### Testing & Validation

```bash
# Run full test suite (build + typecheck + lint)
pnpm test

# Individual checks
pnpm typecheck  # Check TypeScript (Note: React 19 types issue)
pnpm lint       # Run ESLint
```

## How It Works

### 1. Package Structure
Each package has:
- `src/` - Source TypeScript/React Native code
- `lib/` - Built output (CommonJS and ES modules)
- `package.json` with Bob configuration
- `tsconfig.json` for TypeScript

### 2. Build Process
React Native Builder Bob handles:
- Transpiling TypeScript/JSX to JavaScript
- Creating CommonJS builds (`lib/commonjs/`)
- Creating ES module builds (`lib/module/`)
- Skipping TypeScript declarations (due to React 19 compatibility)

### 3. Hot Reload Setup
Hot reload works through:
- **Metro Configuration**: Watches source files directly
- **Package Exports**: "source" field points to `.tsx` files
- **No watch needed**: Metro bundles TypeScript on-the-fly

```json
// Package exports configuration
"exports": {
  ".": {
    "source": "./src/index.tsx",  // Metro uses this in dev
    "import": "./lib/module/index.js",
    "require": "./lib/commonjs/index.js"
  }
}
```

### 4. Workspace Linking
- Uses pnpm's `workspace:*` protocol
- Packages automatically linked during `pnpm install`
- No need for `npm link` or `yalc`

## Common Tasks

### Adding a New Package

1. Create package directory:
```bash
mkdir packages/my-new-package
cd packages/my-new-package
```

2. Create package.json:
```json
{
  "name": "@monorepo/my-new-package",
  "version": "0.1.0",
  "main": "lib/commonjs/index.js",
  "module": "lib/module/index.js",
  "exports": {
    ".": {
      "source": "./src/index.tsx",
      "import": "./lib/module/index.js",
      "require": "./lib/commonjs/index.js"
    }
  },
  "scripts": {
    "build": "bob build",
    "typecheck": "tsc --noEmit",
    "prepare": "bob build",
    "clean": "rimraf lib"
  },
  "peerDependencies": {
    "react": "*",
    "react-native": "*"
  },
  "react-native-builder-bob": {
    "source": "src",
    "output": "lib",
    "targets": ["commonjs", "module"]
  }
}
```

3. Add source code in `src/index.tsx`

4. Install and build:
```bash
pnpm install
pnpm build
```

### Troubleshooting

#### TypeScript Errors with React 19
Current issue: React Native doesn't officially support React 19 types yet.

**Solutions:**
1. Skip TypeScript in Bob (current approach)
2. Downgrade to React 18 types
3. Use `skipLibCheck: true` in tsconfig

#### Package Not Found
After adding a new package:
1. Run `pnpm install` at root
2. Ensure package is built: `pnpm build`
3. Restart Metro: Kill and restart `pnpm start`

#### Changes Not Reflecting
1. Ensure "source" export is in package.json
2. Check Metro config includes `unstable_enablePackageExports`
3. Restart Metro with clear cache: `pnpm start --clear`

## Build Pipeline Details

### Lerna Commands
- `lerna run build --stream` - Build with live output
- `lerna run clean` - Clean all packages
- `lerna run typecheck` - Run TypeScript checking

### Bob Targets
- `commonjs` - Node.js compatible builds
- `module` - ES modules for modern bundlers
- `typescript` - Type definitions (disabled due to React 19)

### Metro Configuration
```javascript
// Key settings for hot reload
config.watchFolders = [monorepoRoot];
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['source', 'import', 'require'];
```

## Performance Tips

1. **Parallel Builds**: Lerna runs builds in parallel by default
2. **Incremental Builds**: Bob only rebuilds changed files
3. **Hot Reload**: No build needed during development
4. **Clean Builds**: Use `pnpm fresh` when in doubt

## CI/CD Considerations

For CI pipelines:
```bash
# Clean install and build
pnpm clean
pnpm install --frozen-lockfile
pnpm build
pnpm test
```

## Publishing Packages

When ready to publish to npm:
```bash
# Build and publish with Lerna
pnpm build
lerna publish
```

Lerna handles:
- Version bumping
- Git tagging
- npm publishing
- Changelog generation