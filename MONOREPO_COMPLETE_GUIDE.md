# React Native Monorepo - Complete Guide

## 🎯 Overview

This monorepo is set up with:
- **pnpm workspaces** for dependency management
- **React Native Builder Bob** for package building
- **Lerna-lite** for orchestration
- **Hot reload** working across all packages
- **TypeScript** with full type safety
- **Automated package creation** script

## 📁 Structure

```
rn-monorepo-clean/
├── packages/               # All packages
│   ├── shared/            # Shared UI, hooks, utilities
│   ├── devtools-floating-menu/ # Floating dev tools launcher
│   ├── env-tools/         # Environment variables tooling
│   └── [your-packages]/   # Your new packages
├── example/               # Demo/test app
├── scripts/               # Automation scripts
│   └── create-package.js  # Package creation script
├── pnpm-workspace.yaml    # Workspace configuration
├── package.json           # Root package.json
└── tsconfig.json          # Root TypeScript config
```

## 🚀 Quick Start

### Initial Setup
```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start the example app
pnpm start
```

### Create a New Package
```bash
# Standard package
pnpm create:package my-feature

# UI components package
pnpm create:package design-system ui

# Hooks package
pnpm create:package custom-hooks hook

# Utilities package
pnpm create:package helpers util
```

## 📦 Package Types

### Shared Package (`@monorepo/shared`)
The foundation package containing:
- **UI Components**: Button, Card
- **Hooks**: useCounter, useToggle
- **Utilities**: formatNumber, debounce, throttle

```typescript
// Import everything
import { Button, Card, useCounter, formatNumber } from '@monorepo/shared';

// Or import from specific exports
import { Button } from '@monorepo/shared/ui';
import { useCounter } from '@monorepo/shared/hooks';
import { formatNumber } from '@monorepo/shared/utils';
```

### Your Packages
Every package you create:
- Automatically depends on `@monorepo/shared`
- Has Bob build configuration
- Supports hot reload
- Includes TypeScript setup

## 🔥 Hot Reload

Hot reload works automatically:

1. Edit any file in any package
2. Metro detects the change via source watching
3. App updates instantly without rebuild

This works because:
- Metro watches the "source" export in package.json
- Packages use `workspace:*` protocol
- Metro config includes all workspace folders

## 📝 Common Tasks

### Building

```bash
# Build everything
pnpm build

# Build specific package
pnpm --filter @monorepo/my-package build

# Clean and rebuild
pnpm fresh
```

### Development

```bash
# Start the app
pnpm start

# iOS specific
pnpm ios

# Android specific
pnpm android

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

### Package Management

```bash
# Add dependency to specific package
pnpm --filter @monorepo/my-package add axios

# Add dev dependency to root
pnpm add -D -w eslint-plugin-react

# Update all dependencies
pnpm update -r
```

## 🏗️ Creating Components

### In a Standard Package

```typescript
// packages/my-feature/src/index.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Card, Button, useCounter } from '@monorepo/shared';

export function MyFeature() {
  const counter = useCounter(0);

  return (
    <Card>
      <Text>Count: {counter.count}</Text>
      <Button
        title="Increment"
        onPress={counter.increment}
      />
    </Card>
  );
}
```

### In a UI Package

```typescript
// packages/ui-kit/src/components/Badge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface BadgeProps {
  count: number;
  color?: string;
}

export function Badge({ count, color = '#007AFF' }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.text}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
```

## 🔧 Configuration

### Package.json Structure

Every package has:

```json
{
  "name": "@monorepo/package-name",
  "version": "0.1.0",
  "main": "lib/commonjs/index.js",
  "module": "lib/module/index.js",
  "types": "lib/typescript/index.d.ts",
  "exports": {
    ".": {
      "source": "./src/index.ts",      // For hot reload
      "import": "./lib/module/index.js",
      "require": "./lib/commonjs/index.js",
      "types": "./lib/typescript/index.d.ts"
    }
  },
  "dependencies": {
    "@monorepo/shared": "workspace:*"  // Internal dependency
  },
  "peerDependencies": {
    "react": "*",
    "react-native": "*"
  }
}
```

### Bob Configuration

Each package uses Bob for building:

```json
{
  "react-native-builder-bob": {
    "source": "src",
    "output": "lib",
    "targets": ["commonjs", "module", "typescript"]
  }
}
```

## 🎨 Using in the Example App

```typescript
// example/App.tsx
import { ScrollView, View, Text } from 'react-native';
import { Package1Component } from '@monorepo/devtools-floating-menu';
import { Package2Component } from '@monorepo/env-tools';
import { MyFeatureComponent } from '@monorepo/my-feature';

export default function App() {
  return (
    <ScrollView>
      <Text>My Monorepo App</Text>
      <Package1Component />
      <Package2Component />
      <MyFeatureComponent />
    </ScrollView>
  );
}
```

## 🚨 Troubleshooting

### Module Not Found

```bash
# Ensure package is installed
pnpm install

# Rebuild the package
pnpm --filter @monorepo/package-name build
```

### TypeScript Errors

```bash
# Check types
pnpm typecheck

# Rebuild types
pnpm build
```

### Hot Reload Not Working

```bash
# Restart Metro with cache clear
pnpm start --reset-cache
```

### React Version Issues

If you see React type errors:
- We use React 19 with React Native 0.81
- Types are set to @types/react@^19.0.14
- This is configured in root and works with RN

## 📚 Best Practices

### 1. Package Organization
- Keep packages focused and single-purpose
- Use the shared package for common code
- Group related packages with naming prefixes

### 2. Dependencies
- Put shared deps in the shared package
- Use peer dependencies for React/React Native
- Use workspace protocol for internal deps

### 3. Exports
- Always export from index.ts
- Provide both named and default exports when appropriate
- Export types alongside components

### 4. Development Workflow
1. Create package with script
2. Build to verify setup
3. Import in example app
4. Develop with hot reload
5. Test thoroughly
6. Build before committing

## 🎯 Common Patterns

### Extending Shared Components

```typescript
import { Button } from '@monorepo/shared';

export function PrimaryButton(props) {
  return <Button {...props} variant="primary" />;
}
```

### Composing Multiple Packages

```typescript
import { useAuth } from '@monorepo/auth-hooks';
import { UserCard } from '@monorepo/user-ui';
import { formatDate } from '@monorepo/utils';

export function UserProfile() {
  const { user } = useAuth();

  return (
    <UserCard
      user={user}
      joinDate={formatDate(user.createdAt)}
    />
  );
}
```

### Creating Provider Packages

```typescript
// packages/theme-provider/src/index.tsx
import React, { createContext, useContext } from 'react';

const ThemeContext = createContext({});

export function ThemeProvider({ children, theme }) {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
```

## 🚀 Next Steps

1. **Create your packages**: Use `pnpm create:package`
2. **Build your features**: Leverage shared components
3. **Test in example app**: Verify everything works
4. **Consider publishing**: When ready, packages can be published to npm

## 📄 Scripts Reference

```bash
# Package creation
pnpm create:package <name> [type]

# Building
pnpm build                 # Build all
pnpm build:packages        # Build packages only
pnpm fresh                 # Clean install and build

# Development
pnpm start                 # Start example app
pnpm ios                   # iOS simulator
pnpm android               # Android emulator

# Quality
pnpm typecheck             # Type check all
pnpm lint                  # Lint all
pnpm test                  # Full test suite

# Cleaning
pnpm clean                 # Clean everything
pnpm clean:packages        # Clean packages only
```

## 💡 Tips

1. **Use the shared package** - Don't recreate common components
2. **Hot reload is your friend** - No need to rebuild during dev
3. **Type everything** - TypeScript will catch errors early
4. **Small commits** - Build and test before committing
5. **Document as you go** - Update READMEs in your packages

## 🎉 Ready to Build!

You now have a fully functional React Native monorepo with:
- ✅ Automated package creation
- ✅ Hot reload across packages
- ✅ Shared component library
- ✅ TypeScript everywhere
- ✅ Build automation
- ✅ Clean architecture

Start creating packages and building your app!
