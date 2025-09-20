# Package Creation Guide

## Overview

This monorepo includes an automated package creation script that scaffolds new packages with all the necessary configuration for TypeScript, React Native Builder Bob, and hot reload support.

## Creating a New Package

Use the `pnpm create:package` command from the root directory:

```bash
pnpm create:package <package-name> [type]
```

### Package Types

- **standard** (default) - Regular React Native package with a component
- **ui** - UI component library package
- **hook** - Custom hooks package
- **util** - Utility functions package

### Examples

```bash
# Create a standard feature package
pnpm create:package my-feature

# Create a UI component library
pnpm create:package design-system ui

# Create a hooks package
pnpm create:package auth-hooks hook

# Create a utility package
pnpm create:package validators util
```

## What Gets Created

The script automatically creates:

### Directory Structure
```
packages/
└── your-package/
    ├── src/
    │   └── index.tsx or .ts    # Main export file
    ├── lib/                     # Build output (git ignored)
    ├── package.json            # Pre-configured with Bob
    ├── tsconfig.json           # TypeScript config
    ├── README.md               # Package documentation
    └── .gitignore              # Git ignore rules
```

### Package Configuration

Each package is automatically configured with:

1. **TypeScript Support** - Full TypeScript configuration extending the root tsconfig
2. **React Native Builder Bob** - Build configuration for CommonJS, ES modules, and TypeScript definitions
3. **Hot Reload** - Metro watches source files for instant updates
4. **Shared Package Dependency** - Automatic access to `@react-buoy/shared-ui` components and utilities
5. **Proper Exports** - Configured package.json exports for optimal bundling

## Post-Creation Steps

After creating a package:

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Build the Package
```bash
pnpm --filter @react-buoy/your-package build
```

### 3. Use in Example App
```typescript
import { YourPackageComponent } from '@react-buoy/your-package';

// In your component
<YourPackageComponent title="Hello" />
```

## Package Type Details

### Standard Package
Creates a React Native component with:
- Sample component using Card from shared
- TypeScript interfaces
- StyleSheet setup
- `.tsx` extension for React components

### UI Package
Creates a UI library with:
- `components/` directory structure
- Example component with shared Button
- Component exports setup
- `.tsx` files for React components

### Hook Package
Creates a hooks package with:
- `hooks/` directory structure
- Example custom hook with TypeScript
- Return type interfaces
- `.ts` extension (no JSX)

### Util Package
Creates a utility package with:
- `utils/` directory structure
- Example utility functions
- Async utility examples
- `.ts` extension (pure TypeScript)

## Building Packages

### Individual Package
```bash
pnpm --filter @react-buoy/package-name build
```

### All Packages
```bash
pnpm build
```

### Clean Build
```bash
pnpm --filter @react-buoy/package-name clean
pnpm --filter @react-buoy/package-name build
```

## Adding Dependencies

### To a Specific Package
```bash
pnpm --filter @react-buoy/package-name add axios
```

### Dev Dependencies
```bash
pnpm --filter @react-buoy/package-name add -D @types/lodash
```

## Hot Reload

Hot reload works automatically! The Metro bundler watches the `source` field in package.json exports:

1. Edit any file in `packages/your-package/src/`
2. Metro detects changes instantly
3. App updates without rebuilding

No additional configuration needed!

## Troubleshooting

### Package Not Found After Creation
```bash
# Ensure dependencies are installed
pnpm install

# Build the package
pnpm --filter @react-buoy/your-package build
```

### TypeScript Errors
```bash
# Type check the package
pnpm --filter @react-buoy/your-package typecheck

# Rebuild if needed
pnpm --filter @react-buoy/your-package build
```

### Hot Reload Not Working
```bash
# Restart Metro with cache clear
pnpm start --reset-cache
```

### Build Warnings
The Bob warnings about ESM and exports are normal and don't affect functionality. They occur because we're using the exports field for Metro's source watching.

## Best Practices

1. **Naming Conventions**
   - Use lowercase with hyphens: `my-feature`, not `MyFeature`
   - Be descriptive: `user-authentication` not just `auth`

2. **Dependencies**
   - All packages automatically depend on `@react-buoy/shared-ui`
   - Add package-specific deps only when needed
   - Use peer dependencies for React and React Native

3. **Exports**
   - Export from index file for clean imports
   - Use named exports (no default exports)
   - Group related functionality

4. **Testing**
   - Test in example app immediately after creation
   - Verify hot reload works
   - Check TypeScript compilation

## Advanced Usage

### Adding Prepare Script
After initial setup, you can add auto-build on install:

```json
// In packages/your-package/package.json
"scripts": {
  "prepare": "bob build",
  // ... other scripts
}
```

### Custom Package Structure
The script creates a base structure. You can extend it:

```bash
# Add more directories as needed
mkdir packages/your-package/src/services
mkdir packages/your-package/src/models
mkdir packages/your-package/src/constants
```

### Package Versioning
All packages start at `0.1.0`. Update as needed:

```json
{
  "name": "@react-buoy/your-package",
  "version": "1.0.0"
}
```

## Script Location

The package creation script is located at:
```
scripts/create-package.js
```

Feel free to modify it for your specific needs!