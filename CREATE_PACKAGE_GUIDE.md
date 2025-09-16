# Package Creation Guide

## Quick Start

Create a new package with a single command:

```bash
pnpm create:package <package-name> [type]
```

## Examples

```bash
# Create a standard React Native package
pnpm create:package my-feature

# Create a UI component library
pnpm create:package design-system ui

# Create a hooks package
pnpm create:package custom-hooks hook

# Create a utilities package
pnpm create:package helpers util
```

## Package Types

### 1. Standard (default)
A regular React Native package with components and logic.

**Structure:**
```
my-feature/
├── src/
│   └── index.ts        # Main component export
├── package.json
├── tsconfig.json
└── README.md
```

**Generated Code:**
- A functional component using Card from shared
- Proper TypeScript types
- StyleSheet setup

### 2. UI Package (`ui`)
For creating reusable UI component libraries.

**Structure:**
```
design-system/
├── src/
│   ├── components/
│   │   ├── index.ts
│   │   └── ExampleComponent.tsx
│   ├── styles/
│   └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

**Generated Code:**
- Example component with Button from shared
- Component export structure
- Style organization

### 3. Hook Package (`hook`)
For custom React hooks and state management.

**Structure:**
```
custom-hooks/
├── src/
│   ├── hooks/
│   │   ├── index.ts
│   │   └── useExample.ts
│   └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

**Generated Code:**
- Example custom hook with TypeScript
- Proper return type interface
- JSDoc documentation

### 4. Utility Package (`util`)
For helper functions and utilities.

**Structure:**
```
helpers/
├── src/
│   ├── utils/
│   │   ├── index.ts
│   │   └── helpers.ts
│   └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

**Generated Code:**
- Sync and async utility examples
- Proper TypeScript generics
- Export structure

## What the Script Does

1. **Creates Directory Structure**
   - Package folder in `/packages`
   - Source directories based on type
   - Proper organization

2. **Generates package.json**
   - Correct name with @monorepo scope
   - Bob build configuration
   - Workspace dependency on shared package
   - All necessary scripts

3. **Sets Up TypeScript**
   - Extends root tsconfig
   - Proper paths configuration
   - Build output settings

4. **Creates Starter Code**
   - Type-appropriate boilerplate
   - Imports from shared package
   - Proper exports

5. **Adds Documentation**
   - README with usage instructions
   - .gitignore for clean commits

## After Creating a Package

### 1. Install Dependencies
```bash
# From root directory
pnpm install
```

### 2. Build the Package
```bash
# Build just this package
pnpm --filter @monorepo/my-feature build

# Or build all packages
pnpm build
```

### 3. Use in Example App

Edit `example/App.tsx`:

```typescript
import { MyFeatureComponent } from '@monorepo/my-feature';

export default function App() {
  return (
    <View>
      <MyFeatureComponent title="Hello!" />
    </View>
  );
}
```

### 4. Use in Other Packages

Add to another package's `package.json`:

```json
{
  "dependencies": {
    "@monorepo/my-feature": "workspace:*"
  }
}
```

Then import:

```typescript
import { MyFeatureComponent } from '@monorepo/my-feature';
```

## Hot Reload

Hot reload works automatically! When you edit files in your new package:

1. Metro watches the source files
2. Changes instantly reflect in the app
3. No rebuild needed during development

## Best Practices

### 1. Naming Conventions
- Use kebab-case for package names
- Keep names descriptive but concise
- Group related packages with prefixes (e.g., `ui-buttons`, `ui-forms`)

### 2. Dependencies
- Always use `@monorepo/shared` for common components
- Add package-specific deps to your package's `package.json`
- Use `workspace:*` for internal dependencies

### 3. Exports
- Export everything from index.ts
- Group related exports
- Re-export shared components when it makes sense

### 4. TypeScript
- Always define interfaces for props
- Export types alongside components
- Use proper JSDoc comments

### 5. Testing
Before committing:
```bash
# Type check
pnpm --filter @monorepo/my-feature typecheck

# Build
pnpm --filter @monorepo/my-feature build

# Test in app
pnpm start
```

## Package Lifecycle

### Development
```bash
# Watch mode (if needed)
cd packages/my-feature
pnpm dev  # If you add a dev script
```

### Building
```bash
# Clean build
pnpm --filter @monorepo/my-feature clean
pnpm --filter @monorepo/my-feature build
```

### Publishing (when ready)
```bash
# Version bump
pnpm --filter @monorepo/my-feature version patch

# Publish to npm
pnpm --filter @monorepo/my-feature publish
```

## Common Patterns

### Extending Shared Components

```typescript
import { Button, ButtonProps } from '@monorepo/shared';

interface CustomButtonProps extends ButtonProps {
  icon?: string;
}

export function IconButton({ icon, ...props }: CustomButtonProps) {
  return <Button {...props} title={`${icon} ${props.title}`} />;
}
```

### Composing Hooks

```typescript
import { useCounter } from '@monorepo/shared';

export function useScore() {
  const score = useCounter(0);
  const highScore = useCounter(0);

  const updateHighScore = () => {
    if (score.count > highScore.count) {
      highScore.setValue(score.count);
    }
  };

  return { score, highScore, updateHighScore };
}
```

### Wrapping Utilities

```typescript
import { formatNumber } from '@monorepo/shared';

export function formatCurrency(amount: number, currency = 'USD') {
  const formatted = formatNumber(amount);
  return `${currency} ${formatted}`;
}
```

## Troubleshooting

### Package Not Found
```bash
# Make sure to install after creating
pnpm install

# Rebuild if needed
pnpm build
```

### TypeScript Errors
```bash
# Check types
pnpm typecheck

# Rebuild TypeScript definitions
pnpm --filter @monorepo/my-feature build
```

### Hot Reload Not Working
```bash
# Restart Metro
pnpm start --reset-cache
```

### Import Errors
- Check package name matches exactly
- Ensure package is built
- Verify workspace dependency is added

## Advanced Usage

### Custom Package Types

Edit `scripts/create-package.js` to add new types:

1. Add new type to validation
2. Create type-specific directory structure
3. Generate appropriate boilerplate
4. Update this guide

### Batch Creation

Create multiple related packages:

```bash
# Create a feature set
pnpm create:package auth-ui ui
pnpm create:package auth-hooks hook
pnpm create:package auth-utils util
```

### Package Templates

Store templates in `scripts/templates/` for complex packages:

```
scripts/
├── create-package.js
└── templates/
    ├── feature/
    ├── service/
    └── provider/
```

## Summary

The package creation script automates:
- ✅ Directory structure
- ✅ Configuration files
- ✅ TypeScript setup
- ✅ Bob build config
- ✅ Shared package integration
- ✅ Hot reload setup
- ✅ Documentation

Just run `pnpm create:package <name>` and start coding!